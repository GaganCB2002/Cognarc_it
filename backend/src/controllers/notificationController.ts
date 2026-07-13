import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string | undefined;
    if (!userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const unread = req.query.unread === "true";

    const where: any = { userId };
    if (unread) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

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

    const notification = await prisma.notification.create({
      data: { userId, title, body, type, actionUrl: actionUrl || null },
    });

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
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
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

    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
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
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
