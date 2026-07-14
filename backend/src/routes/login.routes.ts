import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { recordLogin, getLoginStats, getLoginHistory } from "../services/login.service";

const router = Router();

// Record a login event (called after Clerk successful sign-in)
router.post("/login/record", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || undefined;

    const result = await recordLogin(userId, ipAddress, userAgent);

    res.json({
      success: true,
      data: {
        loginHash: result.loginHash,
        loginCount: result.loginCount,
      },
    });
  } catch (error: any) {
    console.error("[Login] Failed to record login:", error.message);
    res.status(500).json({ success: false, message: "Failed to record login" });
  }
});

// Get login stats for the current user
router.get("/login/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const stats = await getLoginStats(userId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("[Login] Failed to get stats:", error.message);
    res.status(500).json({ success: false, message: "Failed to get login stats" });
  }
});

// Get login history for the current user
router.get("/login/history", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const result = await getLoginHistory(userId, limit, offset);

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Login] Failed to get history:", error.message);
    res.status(500).json({ success: false, message: "Failed to get login history" });
  }
});

export default router;
