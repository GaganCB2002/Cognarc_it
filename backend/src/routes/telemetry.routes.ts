import { Router } from "express";
import { logBrowserEvent, logDesktopEvent, getTelemetryStats } from "../controllers/telemetry.controller";
// import { requireAuth } from "../middleware/auth"; // Will add auth middleware later

const router = Router();

// Endpoint for browser extension
router.post("/browser", logBrowserEvent);

// Endpoint for desktop agent
router.post("/desktop", logDesktopEvent);

// Endpoint for analytics frontend
router.get("/stats", getTelemetryStats);

export default router;
