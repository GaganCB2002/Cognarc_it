import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController";

const router = Router();

router.get("/", authenticate, getNotifications);
router.post("/", authenticate, createNotification);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
