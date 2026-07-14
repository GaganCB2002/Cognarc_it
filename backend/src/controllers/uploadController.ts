import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { pool } from "../lib/prisma";
import { getFileType } from "../middleware/upload";
import { 
  saveFile, 
  getFile as getStorageFile, 
  deleteFile as deleteStorageFile, 
  renameFile as renameStorageFile 
} from "../services/storage.service";
import { queueService } from "../services/queue.service";
import { validateFile } from "../utils/fileValidation";

interface AuthRequest extends Request {
  user?: { userId: string };
}

const getParamId = (req: AuthRequest): string => req.params.id as string;

// Helper to check user ownership
async function checkOwnership(documentId: string, userId: string) {
  const result = await pool.query('SELECT * FROM "Document" WHERE "id" = $1 LIMIT 1', [documentId]);
  const document = result.rows[0];
  if (!document) return { error: "File not found", status: 404 };
  if (document.userId !== userId) return { error: "Forbidden", status: 403 };
  if (document.status === "DELETED") return { error: "File has been deleted", status: 410 };
  return { document };
}

/**
 * Handle a single file upload logic
 */
async function processUpload(
  userId: string,
  file: Express.Multer.File,
  titleBody?: string
) {
  const { originalname, mimetype, buffer, size } = file;
  const title = titleBody || originalname;

  // Validation
  const validation = validateFile(mimetype, size, originalname);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid file");
  }

  // Save to storage (local, GitHub, or Google Drive)
  const stored = await saveFile(userId, mimetype, originalname, buffer);

  // Construct metadata JSON
  const fileMetadata = {
    downloadUrl: stored.metadata?.downloadUrl || stored.publicUrl,
    thumbnailUrl: stored.metadata?.thumbnailUrl,
    uploadedBy: userId,
  };

  // Create Document & Resource in a transaction
  const docResult = await pool.query(
    'INSERT INTO "Document" ("userId", "originalName", "mimeType", "size", "storageProvider", "storageKey", "publicUrl", "resourceType", "status", "tags", "metadata") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [userId, originalname, mimetype, size, stored.provider, stored.storageKey, stored.publicUrl, getFileType(mimetype), "READY", [], fileMetadata]
  );
  const doc = docResult.rows[0];

  const resResult = await pool.query(
    'INSERT INTO "Resource" ("title", "type", "fileKey", "fileSize", "mimeType", "isUpload", "userId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, getFileType(mimetype), stored.storageKey, size, mimetype, true, userId]
  );
  const resource = resResult.rows[0];

  const updatedDocResult = await pool.query(
    'UPDATE "Document" SET "resourceId" = $1 WHERE "id" = $2 RETURNING *',
    [resource.id, doc.id]
  );
  const updatedDoc = updatedDocResult.rows[0];

  // Trigger asynchronous AI processing if it's a PDF
  if (getFileType(mimetype) === "PDF") {
    queueService.enqueue("AI_PROCESS_DOCUMENT", { documentId: updatedDoc.id });
  }

  return { document: updatedDoc, resource };
}

/**
 * Upload single file
 */
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file provided" });
      return;
    }

    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await processUpload(userId, req.file, req.body.title);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Upload error:", error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || "Failed to upload file");
    res.status(500).json({ success: false, message: msg });
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: "No files provided" });
      return;
    }

    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const uploadPromises = files.map((file) =>
      processUpload(userId, file).catch((err) => ({
        error: true,
        fileName: file.originalname,
        message: err.message,
      }))
    );

    const results = await Promise.all(uploadPromises);
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error("Multiple uploads error:", error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || "Failed to upload files");
    res.status(500).json({ success: false, message: msg });
  }
};

/**
 * Get file stream / content
 */
export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;
    const data = await getStorageFile(doc.storageKey);
    if (!data) {
      res.status(404).json({ success: false, message: "File data not found on storage" });
      return;
    }

    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", doc.size);
    res.send(data);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve file" });
  }
};

/**
 * Download file as attachment
 */
export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;
    const data = await getStorageFile(doc.storageKey);
    if (!data) {
      res.status(404).json({ success: false, message: "File data not found on storage" });
      return;
    }

    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", doc.size);
    res.send(data);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({ success: false, message: "Failed to download file" });
  }
};

/**
 * Preview file (redirect or stream depending on config/metadata)
 */
export const previewFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;

    // If Google Drive and has public/private URL config, we can redirect to webViewLink directly
    if (doc.storageProvider === "GOOGLE_DRIVE" && doc.publicUrl) {
      res.redirect(doc.publicUrl);
      return;
    }

    // Otherwise stream it inline
    const data = await getStorageFile(doc.storageKey);
    if (!data) {
      res.status(404).json({ success: false, message: "File data not found on storage" });
      return;
    }

    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", doc.size);
    res.send(data);
  } catch (error) {
    console.error("Preview file error:", error);
    res.status(500).json({ success: false, message: "Failed to preview file" });
  }
};

/**
 * Replace file contents
 */
export const replaceFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file provided" });
      return;
    }

    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;
    const { originalname, mimetype, buffer, size } = req.file;

    // Save new file to storage first, then delete old (prevent data loss on failure)
    const stored = await saveFile(userId, mimetype, originalname, buffer);
    await deleteStorageFile(doc.storageKey);

    const fileMetadata = {
      downloadUrl: stored.metadata?.downloadUrl || stored.publicUrl,
      thumbnailUrl: stored.metadata?.thumbnailUrl,
      uploadedBy: userId,
    };

    // Update document record
    const updatedDocResult = await pool.query(
      'UPDATE "Document" SET "originalName" = $1, "mimeType" = $2, "size" = $3, "storageProvider" = $4, "storageKey" = $5, "publicUrl" = $6, "resourceType" = $7, "metadata" = $8, "status" = $9 WHERE "id" = $10 RETURNING *',
      [originalname, mimetype, size, stored.provider, stored.storageKey, stored.publicUrl, getFileType(mimetype), fileMetadata, "READY", id]
    );
    const updatedDoc = updatedDocResult.rows[0];

    // Update resource details
    if (doc.resourceId) {
      await pool.query(
        'UPDATE "Resource" SET "title" = $1, "type" = $2, "fileKey" = $3, "fileSize" = $4, "mimeType" = $5 WHERE "id" = $6',
        [originalname, getFileType(mimetype), stored.storageKey, size, mimetype, doc.resourceId]
      );
    }

    // Re-trigger AI process if PDF
    if (getFileType(mimetype) === "PDF") {
      queueService.enqueue("AI_PROCESS_DOCUMENT", { documentId: doc.id });
    }

    res.status(200).json({ success: true, data: updatedDoc });
  } catch (error: any) {
    console.error("Replace file error:", error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || "Failed to replace file");
    res.status(500).json({ success: false, message: msg });
  }
};

/**
 * Rename file
 */
export const renameFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;
    const { name } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!name || typeof name !== "string") {
      res.status(400).json({ success: false, message: "Valid new name is required" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;

    // Rename on storage (only applicable to GOOGLE_DRIVE or LOCAL)
    await renameStorageFile(doc.storageKey, name);

    // Update document original name
    const updatedDocResult = await pool.query(
      'UPDATE "Document" SET "originalName" = $1 WHERE "id" = $2 RETURNING *',
      [name, id]
    );
    const updatedDoc = updatedDocResult.rows[0];

    // Update Resource title
    if (doc.resourceId) {
      await pool.query(
        'UPDATE "Resource" SET "title" = $1 WHERE "id" = $2',
        [name, doc.resourceId]
      );
    }

    res.status(200).json({ success: true, data: updatedDoc });
  } catch (error: any) {
    console.error("Rename file error:", error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error.message || "Failed to rename file");
    res.status(500).json({ success: false, message: msg });
  }
};

/**
 * Delete file
 */
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;

    // Delete from storage
    await deleteStorageFile(doc.storageKey);

    // Soft-delete the document record
    await pool.query('UPDATE "Document" SET "status" = $1 WHERE "id" = $2', ["DELETED", id]);

    // Also delete linked Resource if exists
    if (doc.resourceId) {
      await pool.query('DELETE FROM "Resource" WHERE "id" = $1', [doc.resourceId]).catch(err => console.error('Failed to delete linked resource:', err));
    }

    res.status(200).json({ success: true, data: { message: "File deleted successfully" } });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ success: false, message: "Failed to delete file" });
  }
};

/**
 * List user files
 */
export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { type, folder, search } = req.query;

    const conditions: string[] = ['"Document"."userId" = $1', '"Document"."status" != $2'];
    const params: any[] = [userId, "DELETED"];
    let paramIdx = 3;

    if (type && typeof type === "string") {
      conditions.push(`"Document"."resourceType" = $${paramIdx}`);
      params.push(type);
      paramIdx++;
    }
    if (folder && typeof folder === "string") {
      conditions.push(`"Document"."folder" = $${paramIdx}`);
      params.push(folder);
      paramIdx++;
    }
    if (search && typeof search === "string") {
      conditions.push(`"Document"."originalName" ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const documentsResult = await pool.query(
      `SELECT "Document"."id", "Document"."originalName", "Document"."mimeType", "Document"."size", "Document"."resourceType", "Document"."status", "Document"."folder", "Document"."tags", "Document"."createdAt", "Document"."publicUrl", "Document"."metadata", "Resource"."id" AS "resource_id", "Resource"."title" AS "resource_title", "Resource"."isFavorite" AS "resource_isFavorite" FROM "Document" LEFT JOIN "Resource" ON "Document"."resourceId" = "Resource"."id" WHERE ${whereClause} ORDER BY "Document"."createdAt" DESC`,
      params
    );

    const files = documentsResult.rows.map((doc: any) => ({
      id: doc.id,
      name: doc.originalName,
      title: doc.resource_title || doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      type: doc.resourceType,
      status: doc.status,
      folder: doc.folder,
      tags: doc.tags,
      isFavorite: doc.resource_isFavorite || false,
      resourceId: doc.resource_id,
      publicUrl: doc.publicUrl,
      downloadUrl: doc.metadata?.downloadUrl || doc.publicUrl,
      thumbnailUrl: doc.metadata?.thumbnailUrl,
      uploadedAt: doc.createdAt,
    }));

    res.status(200).json({ success: true, data: files });
  } catch (error) {
    console.error("Get my files error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch files" });
  }
};

/**
 * Update metadata
 */
export const updateFileMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;
    const { folder, tags, title, isFavorite } = req.body;

    const docSetClauses: string[] = [];
    const docParams: any[] = [];
    let docParamIdx = 1;
    if (folder !== undefined) { docSetClauses.push(`"folder" = $${docParamIdx}`); docParams.push(folder); docParamIdx++; }
    if (tags !== undefined) { docSetClauses.push(`"tags" = $${docParamIdx}`); docParams.push(tags); docParamIdx++; }

    if (docSetClauses.length > 0) {
      docParams.push(id);
      await pool.query(`UPDATE "Document" SET ${docSetClauses.join(', ')} WHERE "id" = $${docParamIdx}`, docParams);
    }

    if (doc.resourceId && (title !== undefined || isFavorite !== undefined)) {
      const resSetClauses: string[] = [];
      const resParams: any[] = [];
      let resParamIdx = 1;
      if (title !== undefined) { resSetClauses.push(`"title" = $${resParamIdx}`); resParams.push(title); resParamIdx++; }
      if (isFavorite !== undefined) { resSetClauses.push(`"isFavorite" = $${resParamIdx}`); resParams.push(isFavorite); resParamIdx++; }
      if (resSetClauses.length > 0) {
        resParams.push(doc.resourceId);
        await pool.query(`UPDATE "Resource" SET ${resSetClauses.join(', ')} WHERE "id" = $${resParamIdx}`, resParams);
      }
    }

    res.status(200).json({ success: true, data: { message: "Metadata updated successfully" } });
  } catch (error) {
    console.error("Update metadata error:", error);
    res.status(500).json({ success: false, message: "Failed to update metadata" });
  }
};

/**
 * Text extraction from document
 */
export const extractText = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const check = await checkOwnership(id, userId);
    if (check.error) {
      res.status(check.status || 500).json({ success: false, message: check.error });
      return;
    }

    const doc = check.document!;
    let text = "";

    // PDF parse or text parse
    const data = await getStorageFile(doc.storageKey);
    if (!data) {
      res.status(404).json({ success: false, message: "File data not found" });
      return;
    }

    if (doc.mimeType === "application/pdf") {
      const PDFParse = require("pdf-parse");
      const parsed = await PDFParse(data);
      text = parsed.text;
    } else if (doc.mimeType.startsWith("text/")) {
      text = data.toString("utf-8");
    } else {
      res.status(400).json({ success: false, message: `Text extraction not supported for ${doc.mimeType}` });
      return;
    }

    res.json({ success: true, data: { text, title: doc.originalName } });
  } catch (error) {
    console.error("Extract text error:", error);
    res.status(500).json({ success: false, message: "Failed to extract text from file" });
  }
};
