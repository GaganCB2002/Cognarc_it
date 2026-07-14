import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

let _io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  if (_io) return _io;

  // Parse allowed origins
  const rawFrontendUrls = process.env.FRONTEND_URL || "https://cognarc-it.vercel.app";
  const allowedOrigins = rawFrontendUrls.split(",").map((s) => s.trim()).filter(Boolean);

  function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (allowedOrigins.includes("*")) return true;
    if (origin.match(/^https:\/\/[a-zA-Z0-9_-]+\.(vercel\.app|now\.sh)$/)) return true;
    const isLocal =
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://10.") ||
      origin.startsWith("http://192.168.") ||
      origin.startsWith("http://172.");
    if (isLocal) return true;
    return false;
  }

  _io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
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

  return _io;
}

export function getIO(): SocketServer {
  if (!_io) throw new Error("Socket.IO not initialized. Call initSocket() first.");
  return _io;
}
