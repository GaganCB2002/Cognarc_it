import { Router } from "express";
import { logBrowserEvent, logDesktopEvent, getTelemetryStats } from "../controllers/telemetry.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Endpoint for browser extension
router.post("/browser", authenticate, logBrowserEvent);

// Endpoint for desktop agent
router.post("/desktop", authenticate, logDesktopEvent);

// Endpoint for analytics frontend
router.get("/stats", authenticate, getTelemetryStats);

export default router;
