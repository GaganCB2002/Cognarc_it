import { Request, Response } from "express";
import { prisma } from "../server";

interface AuthRequest extends Request {
  user?: { userId: string };
}

const getUserId = (req: AuthRequest): string | undefined => req.user?.userId;
const getParamId = (req: AuthRequest): string => req.params.id as string;

export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { type, search } = req.query;

    const where: Record<string, unknown> = { userId };

    if (type && typeof type === "string") {
      where.type = type;
    }

    if (search && typeof search === "string") {
      where.title = { contains: search, mode: "insensitive" };
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(resources);
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

export const getResourceById = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (resource.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.status(200).json(resource);
  } catch (error) {
    console.error("Get resource by ID error:", error);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { title, type, url, tags, collectionId } = req.body;

    if (!title || !type) {
      res.status(400).json({ error: "Title and type are required" });
      return;
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        url,
        tags: tags || [],
        collectionId: collectionId || null,
        userId,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { title, tags, collectionId, isFavorite } = req.body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (tags !== undefined) data.tags = tags;
    if (collectionId !== undefined) data.collectionId = collectionId;
    if (isFavorite !== undefined) data.isFavorite = isFavorite;

    const resource = await prisma.resource.update({
      where: { id },
      data,
    });

    res.status(200).json(resource);
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (resource.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.resource.delete({ where: { id } });

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
};
