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
import interviewRoutes from "./routes/interview.routes";
import notificationRoutes from "./routes/notifications.routes";
import { lifelogMiddleware } from "./middleware/lifelog";
import { authenticate } from "./middleware/auth";
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
  // Allow all Vercel deployments (*.vercel.app and *.now.sh)
  if (origin.match(/^https:\/\/[a-zA-Z0-9_-]+\.(vercel\.app|now\.sh)$/)) return callback(null, true);
  // Allow all local development origins in any environment
  const isLocal = origin.startsWith('http://localhost') || 
                  origin.startsWith('http://127.0.0.1') || 
                  origin.startsWith('http://10.') || 
                  origin.startsWith('http://192.168.') || 
                  origin.startsWith('http://172.');
  if (isLocal) return callback(null, true);
  
  callback(new Error('Not allowed by CORS'));
}

export const io = new Server(httpServer, {
  cors: {
    origin: isOriginAllowed,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    (socket as any).user = null;
    return next();
  }
  const decoded = verifyAccessToken(token as string);
  if (!decoded) {
    (socket as any).user = null;
    return next();
  }
  (socket as any).user = decoded;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket as any).user?.userId;
  if (userId) {
    socket.join(`user_${userId}`);
    console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);
  } else {
    console.log(`[Socket] Anonymous client connected (socket: ${socket.id})`);
  }
  
  socket.on('joinRoom', (roomUserId: string) => {
    if (userId && typeof roomUserId === 'string' && roomUserId.trim() && roomUserId === userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Client ${socket.id} disconnected (reason: ${reason})`);
  });

  socket.on('error', (err) => {
    console.error(`[Socket] Error for socket ${socket.id}:`, err.message);
  });

  socket.on('ping', (cb) => {
    if (typeof cb === 'function') cb();
  });
});

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: (req) => req.path.startsWith('/api/upload/') || req.path === '/api/upload',
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
    res.status(200).json({ success: true, status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ success: false, status: "error", db: "disconnected", timestamp: new Date().toISOString() });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, status: "error", db: "disconnected" });
  }
});

app.get("/api/database/status", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: "connected", provider: "postgresql", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, status: "disconnected" });
  }
});

app.get("/api/socket/status", (req, res) => {
  const engine = io?.engine;
  const clientsCount = engine ? engine.clientsCount : 0;
  res.json({
    success: true,
    status: "running",
    clients: clientsCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/backend/status", (req, res) => {
  res.json({ success: true, status: "online", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/api/tracking/status", async (req, res) => {
  try {
    const count = await prisma.trackingSession.count();
    res.json({ success: true, status: "active", totalSessions: count, timestamp: new Date().toISOString() });
  } catch {
    res.json({ success: true, status: "active", totalSessions: 0, timestamp: new Date().toISOString() });
  }
});

app.get("/api/diagnostics", async (req, res) => {
  let dbConnected = false;
  try { await prisma.$queryRaw`SELECT 1`; dbConnected = true; } catch {}
  const engine = io?.engine;
  res.json({
    success: true,
    data: {
      backend: { status: "ok", version: "1.0.0", uptime: process.uptime(), timestamp: new Date().toISOString() },
      database: { status: dbConnected ? "connected" : "disconnected", provider: "postgresql" },
      socket: { status: "running", clients: engine ? engine.clientsCount : 0 },
      tracking: { status: "active", sessions: 0 },
    },
  });
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
app.use("/api/interview", interviewRoutes);
app.use("/api/notifications", notificationRoutes);

// Lifelog retrieval API
app.get("/api/lifelog", authenticate, async (req, res) => {
  const userId = req.user!.userId;
  
  const type = req.query.type as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 200), 1000);
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const result = await lifelog.getAllEntries(userId, { type, from, to, limit, offset });
  res.json({ success: true, ...result });
});

app.get("/api/lifelog/dates", authenticate, async (req, res) => {
  const userId = req.user!.userId;
  
  const [dates, totalSize] = await Promise.all([
    lifelog.getAvailableDates(userId),
    lifelog.getDatabaseSize(userId),
  ]);
  res.json({ success: true, dates, totalSizeBytes: totalSize });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorPayload = {
    method: req.method,
    path: req.path,
    message: err.message,
    statusCode: (err as any).statusCode || 500,
    timestamp: new Date().toISOString(),
  };
  console.error("[UnhandledError]", JSON.stringify(errorPayload));
  if (!isProduction) {
    console.error("[UnhandledError:stack]", err.stack);
  }
  res.status(errorPayload.statusCode).json({ success: false, message: isProduction ? "Internal server error" : err.message });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${isProduction ? 'production' : 'development'})`);

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
