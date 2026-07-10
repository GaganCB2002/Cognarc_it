import { prisma } from "../lib/prisma";
import type { Prisma } from '@prisma/client';

export interface StartSessionInput {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  projectName?: string;
}

export interface LogActivityInput {
  trackingSessionId: string;
  userId: string;
  eventType: string;
  category?: string;
  module?: string;
  entityId?: string;
  entityType?: string;
  label?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export const startTrackingSession = async (input: StartSessionInput) => {
  return prisma.trackingSession.create({
    data: {
      userId: input.userId,
      deviceId: input.deviceId || null,
      deviceName: input.deviceName || null,
      projectName: input.projectName || null,
      status: "ACTIVE",
      startTime: new Date(),
      lastActivity: new Date(),
    },
  });
};

export const pauseTrackingSession = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId, status: "ACTIVE" },
  });
  if (!session) throw new Error("Active session not found");
  return prisma.trackingSession.update({
    where: { id: sessionId },
    data: {
      status: "PAUSED",
      pausedAt: new Date(),
    },
  });
};

export const resumeTrackingSession = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId, status: "PAUSED" },
  });
  if (!session || !session.pausedAt) throw new Error("Paused session not found");
  const pauseDuration = Date.now() - session.pausedAt.getTime();
  return prisma.trackingSession.update({
    where: { id: sessionId },
    data: {
      status: "ACTIVE",
      pausedAt: null,
      totalPauseMs: session.totalPauseMs + pauseDuration,
      lastActivity: new Date(),
    },
  });
};

export const stopTrackingSession = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Session not found");
  
  if (session.status === "COMPLETED") {
    return session; // Idempotent: already stopped
  }

  const endTime = new Date();
  return prisma.trackingSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endTime,
      lastActivity: endTime,
    },
  });
};

const VALID_CATEGORIES = ["LEARNING", "CODING", "READING", "VIDEO", "QUIZ", "TASK", "NOTE", "AI_ASSISTANT", "DOCUMENT", "RESOURCE", "CALENDAR", "MEETING", "BREAK", "IDLE", "OTHER"];

import type { EventCategory } from '@prisma/client';

export function validateCategory(cat: string | undefined): EventCategory {
  if (!cat) return "OTHER" as EventCategory;
  const upper = cat.toUpperCase();
  return (VALID_CATEGORIES.includes(upper) ? upper : "OTHER") as EventCategory;
}

export const logActivityEvent = async (input: LogActivityInput) => {
  return prisma.activityEvent.create({
    data: {
      trackingSessionId: input.trackingSessionId,
      userId: input.userId,
      eventType: input.eventType,
      category: validateCategory(input.category),
      module: input.module || null,
      entityId: input.entityId || null,
      entityType: input.entityType || null,
      label: input.label || null,
      duration: Math.max(0, input.duration || 0),
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
    },
  });
};

export const getActiveSession = async (userId: string) => {
  return prisma.trackingSession.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
    orderBy: { startTime: "desc" },
  });
};

export const getSessionHistory = async (
  userId: string,
  options: { limit?: number; offset?: number; from?: Date; to?: Date } = {}
) => {
  const where: { userId: string; startTime?: { gte?: Date; lte?: Date } } = { userId };
  if (options.from || options.to) {
    where.startTime = {};
    if (options.from) where.startTime.gte = options.from;
    if (options.to) where.startTime.lte = options.to;
  }
  const limit = Math.min(Math.max(1, options.limit || 50), 200);
  const offset = Math.max(0, options.offset || 0);
  const [sessions, total] = await Promise.all([
    prisma.trackingSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: limit,
      skip: offset,
      include: { _count: { select: { activities: true } } },
    }),
    prisma.trackingSession.count({ where }),
  ]);
  return { sessions, total };
};

export const getSessionActivities = async (
  sessionId: string,
  userId: string,
  options: { category?: string; limit?: number } = {}
) => {
  const where: Prisma.ActivityEventWhereInput = { trackingSessionId: sessionId, userId };
  if (options.category) where.category = options.category as any;
  return prisma.activityEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(1, options.limit || 500), 1000),
  });
};

export const getAggregatedSessionStats = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Session not found");

  const [activities, browserTelemetries, desktopTelemetries] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { trackingSessionId: sessionId, userId },
    }),
    prisma.browserTelemetry.findMany({
      where: { trackingSessionId: sessionId, userId },
    }),
    prisma.desktopTelemetry.findMany({
      where: { trackingSessionId: sessionId, userId },
    }),
  ]);

  const totalDuration = session.endTime
    ? (session.endTime.getTime() - session.startTime.getTime() - session.totalPauseMs) / 1000
    : (Date.now() - session.startTime.getTime() - session.totalPauseMs) / 1000;

  const byCategory: Record<string, number> = {};
  let totalEventDuration = 0;

  // Aggregate manual activities
  for (const a of activities) {
    byCategory[a.category] = (byCategory[a.category] || 0) + a.duration;
    totalEventDuration += a.duration;
  }

  // Aggregate browser telemetry
  let autoLearningDuration = 0;
  for (const b of browserTelemetries) {
    const cat = b.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + b.duration;
    totalEventDuration += b.duration;

    if (cat === "Programming" || cat === "Documentation" || cat === "AI Tools") {
      autoLearningDuration += b.duration;
    }
  }

  // Aggregate desktop telemetry
  let autoCodingDuration = 0;
  let autoCommDuration = 0;
  for (const d of desktopTelemetries) {
    const cat = d.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + d.duration;
    totalEventDuration += d.duration;

    if (cat === "IDE" || cat === "Terminal") {
      autoCodingDuration += d.duration;
    } else if (cat === "Communication") {
      autoCommDuration += d.duration;
    }
  }

  const idleEstimate = Math.max(0, totalDuration - totalEventDuration);
  const learningTime = (byCategory["LEARNING"] || 0) + (byCategory["READING"] || 0) + autoLearningDuration;
  const codingTime = (byCategory["CODING"] || 0) + autoCodingDuration;
  const taskTime = byCategory["TASK"] || 0;
  const aiTime = (byCategory["AI_ASSISTANT"] || 0) + (byCategory["AI Tools"] || 0);
  const productiveTime = learningTime + codingTime + taskTime;

  const productivityScore = totalDuration > 0 ? Math.round((productiveTime / totalDuration) * 100) : 0;
  
  const distractionDuration = byCategory["Social Media"] || 0;
  const focusScore = Math.max(0, Math.min(100, 100 - Math.round(((idleEstimate + distractionDuration) / Math.max(totalDuration, 1)) * 100)));

  return {
    sessionId,
    totalDurationSeconds: Math.round(totalDuration),
    totalPauseMs: session.totalPauseMs,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    byCategory,
    learningTime: Math.round(learningTime),
    codingTime: Math.round(codingTime),
    taskTime: Math.round(taskTime),
    aiTime: Math.round(aiTime),
    idleTime: Math.round(idleEstimate),
    meetingTime: Math.round(autoCommDuration),
    productiveTime: Math.round(productiveTime),
    productivityScore: Math.min(100, productivityScore),
    focusScore,
    eventCount: activities.length + browserTelemetries.length + desktopTelemetries.length,
  };
};
