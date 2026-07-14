import { Request, Response } from "express";
import { pool } from "../lib/prisma";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const unread = req.query.unread === "true";

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    if (unread) {
      conditions.push('"isRead" = false');
    }

    const whereClause = conditions.join(' AND ');

    const [notificationsResult, unreadCountResult] = await Promise.all([
      pool.query(`SELECT * FROM "Notification" WHERE ${whereClause} ORDER BY "createdAt" DESC LIMIT $2`, [...params, limit]),
      pool.query('SELECT COUNT(*) FROM "Notification" WHERE "userId" = $1 AND "isRead" = false', [userId]),
    ]);

    const notifications = notificationsResult.rows;
    const unreadCount = parseInt(unreadCountResult.rows[0].count, 10);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const { title, body, type, actionUrl } = req.body;
    if (!title || !body || !type) {
      res.status(400).json({ success: false, message: "title, body, and type are required" });
      return;
    }

    const result = await pool.query(
      'INSERT INTO "Notification" ("userId", "title", "body", "type", "actionUrl") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, body, type, actionUrl || null]
    );
    const notification = result.rows[0];

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error("createNotification error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const id = req.params.id as string;
    const notificationResult = await pool.query('SELECT * FROM "Notification" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const notification = notificationResult.rows[0];
    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await pool.query('UPDATE "Notification" SET "isRead" = true WHERE "id" = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    await pool.query('UPDATE "Notification" SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const id = req.params.id as string;
    const notificationResult = await pool.query('SELECT * FROM "Notification" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const notification = notificationResult.rows[0];
    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await pool.query('DELETE FROM "Notification" WHERE "id" = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
