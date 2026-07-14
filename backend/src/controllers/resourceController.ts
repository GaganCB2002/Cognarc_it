import { Request, Response } from "express";
import { pool } from "../lib/prisma";

interface AuthRequest extends Request {
  user?: { userId: string };
}

const getUserId = (req: AuthRequest): string | undefined => req.user?.userId;
const getParamId = (req: AuthRequest): string => req.params.id as string;

export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { type, search } = req.query;

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (type && typeof type === "string") {
      conditions.push(`"type" = $${paramIdx}`);
      params.push(type);
      paramIdx++;
    }

    if (search && typeof search === "string") {
      conditions.push(`"title" ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const result = await pool.query(`SELECT * FROM "Resource" WHERE ${whereClause} ORDER BY "createdAt" DESC`, params);
    const resources = result.rows;

    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resources" });
  }
};

export const getResourceById = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const result = await pool.query('SELECT * FROM "Resource" WHERE "id" = $1 LIMIT 1', [id]);
    const resource = result.rows[0];
    if (!resource) {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }

    if (resource.userId !== userId) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    console.error("Get resource by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resource" });
  }
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { title, type, url, tags, collectionId } = req.body;

    if (!type) {
      res.status(400).json({ success: false, message: "Type is required" });
      return;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          res.status(400).json({ success: false, message: "URL must use http or https protocol" });
          return;
        }
      } catch {
        res.status(400).json({ success: false, message: "Invalid URL format" });
        return;
      }
    }

    const result = await pool.query(
      'INSERT INTO "Resource" ("title", "type", "url", "tags", "collectionId", "userId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title || url || "Untitled", type, url || null, tags || [], collectionId || null, userId]
    );
    const resource = result.rows[0];

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ success: false, message: "Failed to create resource" });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const existingResult = await pool.query('SELECT * FROM "Resource" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const { title, tags, collectionId, isFavorite } = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (title !== undefined) { setClauses.push(`"title" = $${paramIdx}`); params.push(title); paramIdx++; }
    if (tags !== undefined) { setClauses.push(`"tags" = $${paramIdx}`); params.push(tags); paramIdx++; }
    if (collectionId !== undefined) { setClauses.push(`"collectionId" = $${paramIdx}`); params.push(collectionId); paramIdx++; }
    if (isFavorite !== undefined) { setClauses.push(`"isFavorite" = $${paramIdx}`); params.push(isFavorite); paramIdx++; }

    if (setClauses.length === 0) {
      res.status(200).json({ success: true, data: existing });
      return;
    }

    params.push(id);
    const result = await pool.query(`UPDATE "Resource" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const resource = result.rows[0];

    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({ success: false, message: "Failed to update resource" });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req);
    const userId = getUserId(req);

    const result = await pool.query('SELECT * FROM "Resource" WHERE "id" = $1 LIMIT 1', [id]);
    const resource = result.rows[0];
    if (!resource) {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }

    if (resource.userId !== userId) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    await pool.query('DELETE FROM "Resource" WHERE "id" = $1', [id]);

    res.status(200).json({ success: true, data: { message: "Resource deleted successfully" } });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ success: false, message: "Failed to delete resource" });
  }
};
