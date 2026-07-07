import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../server";
import { getFileType } from "../middleware/upload";
import { saveFile, getFile, deleteFile as deleteStorageFile, getLocalPath } from "../services/storage.service";

interface AuthRequest extends Request {
  user?: { userId: string };
}

const getParamId = (req: AuthRequest): string => req.params.id as string;

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const title = req.body.title || originalname;

    // Save to persistent storage (local or S3)
    const stored = await saveFile(userId, mimetype, originalname, buffer);

    // Create Document record for long-term tracking
    const document = await prisma.document.create({
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
      },
    });

    // Create Resource record for display in dashboard
    const resource = await prisma.resource.create({
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

    // Link Document to Resource
    await prisma.document.update({
      where: { id: document.id },
      data: { resourceId: resource.id },
    });

    res.status(201).json({
      document,
      resource,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Try Document first, fall back to Resource
    let document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      const resource = await prisma.resource.findUnique({ where: { id } });
      if (!resource || !resource.fileKey) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      if (resource.userId !== userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      // Serve via legacy fileKey path
      const filePath = path.resolve(resource.fileKey);
      res.sendFile(filePath);
      return;
    }

    // Ownership check on Document
    if (document.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (document.status === "DELETED") {
      res.status(410).json({ error: "File has been deleted" });
      return;
    }

    // Serve via storage service
    const data = await getFile(document.storageKey);
    if (!data) {
      res.status(404).json({ error: "File data not found on storage" });
      return;
    }

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${document.originalName}"`);
    res.setHeader("Content-Length", document.size);
    res.send(data);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Try Document first
    const document = await prisma.document.findUnique({ where: { id } });

    if (document) {
      if (document.userId !== userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Delete from storage
      await deleteStorageFile(document.storageKey);

      // Soft-delete the document record
      await prisma.document.update({
        where: { id },
        data: { status: "DELETED" },
      });

      // Also delete linked Resource if exists
      if (document.resourceId) {
        await prisma.resource.delete({ where: { id: document.resourceId } }).catch(() => {});
      }

      res.status(200).json({ message: "File deleted successfully" });
      return;
    }

    // Fallback to legacy Resource-based file
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    if (resource.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Legacy deletion
    if (resource.fileKey) {
      await fs.unlink(resource.fileKey).catch(() => {});
    }
    await prisma.resource.delete({ where: { id } });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

// GET /api/upload/my-files - list all documents for the current user
export const getMyFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
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
        resource: {
          select: {
            id: true,
            title: true,
            isFavorite: true,
          },
        },
      },
    });

    // Map to frontend-friendly format
    const files = documents.map((doc) => ({
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
      uploadedAt: doc.createdAt,
    }));

    res.status(200).json(files);
  } catch (error) {
    console.error("Get my files error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// PATCH /api/upload/:id/metadata - update file metadata (folder, tags, favorite)
export const updateFileMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    if (document.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { folder, tags, title, isFavorite } = req.body;

    const docData: Record<string, unknown> = {};
    if (folder !== undefined) docData.folder = folder;
    if (tags !== undefined) docData.tags = tags;

    await prisma.document.update({
      where: { id },
      data: docData,
    });

    // Update linked resource if present
    if (document.resourceId && (title !== undefined || isFavorite !== undefined)) {
      const resData: Record<string, unknown> = {};
      if (title !== undefined) resData.title = title;
      if (isFavorite !== undefined) resData.isFavorite = isFavorite;
      await prisma.resource.update({
        where: { id: document.resourceId },
        data: resData,
      });
    }

    res.status(200).json({ message: "Metadata updated successfully" });
  } catch (error) {
    console.error("Update metadata error:", error);
    res.status(500).json({ error: "Failed to update metadata" });
  }
};
