import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import uploadRoutes from "./routes/upload";
import resourceRoutes from "./routes/resources";
import sessionRoutes from "./routes/sessions";
import taskRoutes from "./routes/tasks";
import noteRoutes from "./routes/notes";
import telemetryRoutes from "./routes/telemetry.routes";
import aiRoutes from "./routes/ai.routes";
import analyticsRoutes from "./routes/analytics.routes";
import calendarRoutes from "./routes/calendar.routes";
import projectsRoutes from "./routes/projects.routes";
import reportsRoutes from "./routes/reports.routes";
import trackingRoutes from "./routes/tracking.routes";
import exportRoutes from "./routes/export.routes";
import insightsRoutes from "./routes/insights.routes";
import webhookRoutes from "./routes/webhooks";
import { projectIndexer } from "./services/project-indexer.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3001").split(',').map(s => s.trim());

export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('A user connected to socket:', socket.id);
  
  socket.on('joinRoom', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from socket:', socket.id);
  });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(compression());
app.use(cookieParser());

// Webhooks must be parsed as raw body for Svix signature verification
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/auth', authLimiter);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/insights", insightsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize project indexer in background (don't block startup)
  const projectRoot = path.resolve(__dirname, "..", "..");
  projectIndexer.initialize(projectRoot).catch((err) =>
    console.error("Failed to initialize project indexer:", err)
  );
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
