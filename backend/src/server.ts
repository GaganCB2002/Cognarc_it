import dotenv from "dotenv";
import path from "path";
// Load env from project root (../env.backend) for easy local development
// In production, env vars come from the hosting provider (Render/Vercel)
dotenv.config({ path: path.resolve(__dirname, "..", "..", "env.backend"), override: false });
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
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

const isProduction = process.env.NODE_ENV === 'production';

// Validate critical env vars at startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
if (isProduction) {
  requiredEnvVars.push('FRONTEND_URL');
}
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configure database pool with SSL (required by Neon and Render PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Parse allowed origins
const rawFrontendUrls = (process.env.FRONTEND_URL || "https://cognarc-it.vercel.app,http://localhost:3001");
const allowedOrigins = rawFrontendUrls.split(',').map(s => s.trim()).filter(Boolean);

function isOriginAllowed(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (allowedOrigins.includes('*')) return callback(null, true);
  // Allow all localhost origins in development
  if (!isProduction && origin.startsWith('http://localhost')) return callback(null, true);
  
  callback(new Error('Not allowed by CORS'));
}

export const io = new Server(httpServer, {
  cors: {
    origin: isOriginAllowed,
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

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProduction ? undefined : false,
}));
app.use(cors({
  origin: isOriginAllowed,
  credentials: true,
}));
app.use(compression());
app.use(cookieParser());

// Webhooks must be parsed as raw body for Svix signature verification
app.use("/api/webhooks", webhookRoutes);

// Upload routes must be BEFORE body parsers (express.urlencoded consumes multipart streams in v5)
app.use("/api/upload", uploadRoutes);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authLimiter);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Health check with database verification
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "connected", timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: "error", db: "disconnected", timestamp: new Date() });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
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
  console.error("Unhandled error:", {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  });
  res.status(500).json({ message: isProduction ? "Internal server error" : err.message });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  const projectRoot = path.resolve(__dirname, "..", "..");
  projectIndexer.initialize(projectRoot).catch((err) =>
    console.error("Failed to initialize project indexer:", err)
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
  await pool.end();
  console.log('Database connections closed');
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
