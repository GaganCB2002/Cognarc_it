import { prisma } from "../lib/prisma";

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

export const logActivityEvent = async (input: LogActivityInput) => {
  return prisma.activityEvent.create({
    data: {
      trackingSessionId: input.trackingSessionId,
      userId: input.userId,
      eventType: input.eventType,
      category: (input.category as any) || "OTHER",
      module: input.module || null,
      entityId: input.entityId || null,
      entityType: input.entityType || null,
      label: input.label || null,
      duration: input.duration || 0,
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
  const where: any = { userId };
  if (options.from || options.to) {
    where.startTime = {};
    if (options.from) where.startTime.gte = options.from;
    if (options.to) where.startTime.lte = options.to;
  }
  const [sessions, total] = await Promise.all([
    prisma.trackingSession.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
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
  const where: any = { trackingSessionId: sessionId, userId };
  if (options.category) where.category = options.category;
  return prisma.activityEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit || 500,
  });
};

export const getAggregatedSessionStats = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Session not found");

  const activities = await prisma.activityEvent.findMany({
    where: { trackingSessionId: sessionId, userId },
  });

  const totalDuration = session.endTime
    ? (session.endTime.getTime() - session.startTime.getTime() - session.totalPauseMs) / 1000
    : (Date.now() - session.startTime.getTime() - session.totalPauseMs) / 1000;

  const byCategory: Record<string, number> = {};
  let totalEventDuration = 0;
  for (const a of activities) {
    byCategory[a.category] = (byCategory[a.category] || 0) + a.duration;
    totalEventDuration += a.duration;
  }

  const idleEstimate = Math.max(0, totalDuration - totalEventDuration);
  const learningTime = (byCategory["LEARNING"] || 0) + (byCategory["READING"] || 0);
  const codingTime = byCategory["CODING"] || 0;
  const taskTime = byCategory["TASK"] || 0;
  const aiTime = byCategory["AI_ASSISTANT"] || 0;
  const productiveTime = learningTime + codingTime + taskTime;
  const productivityScore = totalDuration > 0 ? Math.round((productiveTime / totalDuration) * 100) : 0;
  const focusScore = Math.max(0, Math.min(100, 100 - Math.round((idleEstimate / Math.max(totalDuration, 1)) * 50)));

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
    productiveTime: Math.round(productiveTime),
    productivityScore: Math.min(100, productivityScore),
    focusScore,
    eventCount: activities.length,
  };
};
