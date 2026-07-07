import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../server";
import { getFileType } from "../middleware/upload";

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

    const { originalname, mimetype, path: filePath, filename } = req.file;
    const title = req.body.title || originalname || filename;

    const resource = await prisma.resource.create({
      data: {
        title,
        type: getFileType(mimetype),
        fileKey: filePath,
        userId,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || !resource.fileKey) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filePath = path.resolve(resource.fileKey);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

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
