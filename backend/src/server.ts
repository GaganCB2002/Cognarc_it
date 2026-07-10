// MUST be first import — loads .env before any module reads process.env
import "./bootstrap";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma, pool } from "./lib/prisma";
import { verifyAccessToken } from "./utils/helpers";

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
import { lifelogMiddleware } from "./middleware/lifelog";
import { lifelog } from "./services/lifelog.service";

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

export { prisma, pool };

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Parse allowed origins
const rawFrontendUrls = (process.env.FRONTEND_URL || "https://cognarc-it.vercel.app");
const allowedOrigins = rawFrontendUrls.split(',').map(s => s.trim()).filter(Boolean);

function isOriginAllowed(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (allowedOrigins.includes('*')) return callback(null, true);
  // Allow all local development origins (localhost, 127.0.0.1, and local private network IPs) in development
  if (!isProduction) {
    const isLocal = origin.startsWith('http://localhost') || 
                    origin.startsWith('http://127.0.0.1') || 
                    origin.startsWith('http://10.') || 
                    origin.startsWith('http://192.168.') || 
                    origin.startsWith('http://172.');
    if (isLocal) return callback(null, true);
  }
  
  callback(new Error('Not allowed by CORS'));
}

export const io = new Server(httpServer, {
  cors: {
    origin: isOriginAllowed,
    credentials: true,
  },
  // Require auth token on connection
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  const decoded = verifyAccessToken(token as string);
  if (!decoded) return next(new Error('Invalid or expired token'));
  (socket as any).user = decoded;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket as any).user.userId;
  socket.join(`user_${userId}`);
  console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);
  
  socket.on('joinRoom', (roomUserId: string) => {
    if (roomUserId === userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User ${userId} disconnected (socket: ${socket.id}, reason: ${reason})`);
  });

  socket.on('error', (err) => {
    console.error(`[Socket] Error for user ${userId}:`, err.message);
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

// Lifelog middleware - logs every API transaction as JSON
app.use('/api', lifelogMiddleware);

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

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

// Lifelog retrieval API
app.get("/api/lifelog", async (req, res) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  
  const type = req.query.type as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 200), 1000);
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const result = lifelog.getAllEntries(userId, { type, from, to, limit, offset });
  res.json({ success: true, ...result });
});

app.get("/api/lifelog/dates", async (req, res) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  
  const dates = lifelog.getAvailableDates(userId);
  const totalSize = lifelog.getDatabaseSize(userId);
  res.json({ success: true, dates, totalSizeBytes: totalSize });
});

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
