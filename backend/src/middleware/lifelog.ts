import { Request, Response, NextFunction } from "express";
import { lifelog } from "../services/lifelog.service";

const SKIP_PATHS = ["/health", "/api/lifelog", "/uploads", "/_next", "/__nextjs"];
const SKIP_METHODS = ["OPTIONS", "HEAD"];

const SENSITIVE_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh-token"];

export function lifelogMiddleware(req: Request, res: Response, next: NextFunction) {
  if (SKIP_METHODS.includes(req.method)) return next();

  const isSkippable = SKIP_PATHS.some(p => req.path.startsWith(p));
  if (isSkippable) return next();

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const startTime = Date.now();

  res.json = function (body: unknown) {
    const userId = (req as any).user?.userId;
    const duration = Date.now() - startTime;

    if (userId) {
      const statusGroup = Math.floor(res.statusCode / 100);
      const isError = statusGroup === 4 || statusGroup === 5;
      const isSensitive = SENSITIVE_PATHS.some(p => req.path.startsWith(p));

      const data: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
      };

      if (!isSensitive) {
        data.requestBody = sanitizeBody(req.body);
      }

      if (isError && !isSensitive) {
        data.responsePreview = typeof body === "object" && body !== null ? (body as any).message || (body as any).error : undefined;
      }

      lifelog.transaction(
        userId,
        `${req.method} ${req.path}`,
        `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)${isError ? " ⚠" : ""}`,
        data,
      ).catch(() => {});
    }

    return originalJson(body);
  };

  res.send = function (body: unknown) {
    const userId = (req as any).user?.userId;
    const duration = Date.now() - startTime;

    if (userId) {
      lifelog.transaction(
        userId,
        `${req.method} ${req.path}`,
        `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`,
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: duration,
        },
      ).catch(() => {});
    }

    return originalSend(body);
  };

  next();
}

function sanitizeBody(body: unknown): Record<string, unknown> | string {
  if (!body || typeof body !== "object") return {};
  const obj = { ...body } as Record<string, unknown>;
  const sensitiveKeys = ["password", "token", "secret", "authorization", "refreshToken", "otp", "code"];
  for (const key of sensitiveKeys) {
    if (key in obj) obj[key] = "[REDACTED]";
  }
  return obj;
}
