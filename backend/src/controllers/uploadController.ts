import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../lib/prisma";
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
  const document = await prisma.document.findUnique({ where: { id: documentId } });
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
  const { document, resource } = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        userId,
        originalName: originalname,
        mimeType: mimetype,
        size,
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        resourceType: getFileType(mimetype),
        status: "READY",
        tags: [],
        metadata: fileMetadata,
      },
    });

    const res = await tx.resource.create({
      data: {
        title,
        type: getFileType(mimetype),
        fileKey: stored.storageKey,
        fileSize: size,
        mimeType: mimetype,
        isUpload: true,
        userId,
      },
    });

    const updatedDoc = await tx.document.update({
      where: { id: doc.id },
      data: { resourceId: res.id },
    });

    return { document: updatedDoc, resource: res };
  });

  // Trigger asynchronous AI processing if it's a PDF
  if (getFileType(mimetype) === "PDF") {
    queueService.enqueue("AI_PROCESS_DOCUMENT", { documentId: document.id });
  }

  return { document, resource };
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
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        originalName: originalname,
        mimeType: mimetype,
        size,
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        resourceType: getFileType(mimetype),
        metadata: fileMetadata,
        status: "READY",
      },
    });

    // Update resource details
    if (doc.resourceId) {
      await prisma.resource.update({
        where: { id: doc.resourceId },
        data: {
          title: originalname,
          type: getFileType(mimetype),
          fileKey: stored.storageKey,
          fileSize: size,
          mimeType: mimetype,
        },
      });
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
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: { originalName: name },
    });

    // Update Resource title
    if (doc.resourceId) {
      await prisma.resource.update({
        where: { id: doc.resourceId },
        data: { title: name },
      });
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
    await prisma.document.update({
      where: { id },
      data: { status: "DELETED" },
    });

    // Also delete linked Resource if exists
    if (doc.resourceId) {
      await prisma.resource.delete({ where: { id: doc.resourceId } }).catch(() => {});
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

    const where: Record<string, unknown> = {
      userId,
      status: { not: "DELETED" },
    };

    if (type && typeof type === "string") {
      where.resourceType = type;
    }
    if (folder && typeof folder === "string") {
      where.folder = folder;
    }
    if (search && typeof search === "string") {
      where.originalName = { contains: search, mode: "insensitive" };
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        resourceType: true,
        status: true,
        folder: true,
        tags: true,
        createdAt: true,
        publicUrl: true,
        metadata: true,
        resource: {
          select: {
            id: true,
            title: true,
            isFavorite: true,
          },
        },
      },
    });

    const files = documents.map((doc: any) => ({
      id: doc.id,
      name: doc.originalName,
      title: doc.resource?.title || doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      type: doc.resourceType,
      status: doc.status,
      folder: doc.folder,
      tags: doc.tags,
      isFavorite: doc.resource?.isFavorite || false,
      resourceId: doc.resource?.id,
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

    const docData: Record<string, unknown> = {};
    if (folder !== undefined) docData.folder = folder;
    if (tags !== undefined) docData.tags = tags;

    await prisma.document.update({
      where: { id },
      data: docData,
    });

    if (doc.resourceId && (title !== undefined || isFavorite !== undefined)) {
      const resData: Record<string, unknown> = {};
      if (title !== undefined) resData.title = title;
      if (isFavorite !== undefined) resData.isFavorite = isFavorite;
      await prisma.resource.update({
        where: { id: doc.resourceId },
        data: resData,
      });
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
