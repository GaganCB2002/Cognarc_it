import { prisma } from "../lib/prisma";

export const generateSessionReport = async (sessionId: string, userId: string) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId },
    include: { activities: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new Error("Session not found");

  const totalMs = session.endTime
    ? session.endTime.getTime() - session.startTime.getTime()
    : Date.now() - session.startTime.getTime();
  const activeMs = totalMs - session.totalPauseMs;
  const totalSec = Math.round(activeMs / 1000);

  const byCategory: Record<string, { duration: number; count: number }> = {};
  const modules: Record<string, number> = {};
  const technologies = new Set<string>();
  const topics = new Set<string>();

  for (const a of session.activities) {
    if (!byCategory[a.category]) byCategory[a.category] = { duration: 0, count: 0 };
    byCategory[a.category].duration += a.duration;
    byCategory[a.category].count += 1;
    if (a.module) modules[a.module] = (modules[a.module] || 0) + a.duration;
    if (a.metadata && typeof a.metadata === "object") {
      const m = a.metadata as Record<string, any>;
      if (m.technology) technologies.add(m.technology);
      if (m.technologies) m.technologies.forEach((t: string) => technologies.add(t));
      if (m.topic) topics.add(m.topic);
      if (m.topics) m.topics.forEach((t: string) => topics.add(t));
    }
  }

  const learningTime = (byCategory["LEARNING"]?.duration || 0) + (byCategory["READING"]?.duration || 0);
  const codingTime = byCategory["CODING"]?.duration || 0;
  const taskTime = byCategory["TASK"]?.duration || 0;
  const aiTime = byCategory["AI_ASSISTANT"]?.duration || 0;
  const videoTime = byCategory["VIDEO"]?.duration || 0;
  const quizTime = byCategory["QUIZ"]?.duration || 0;
  const productiveTime = learningTime + codingTime + taskTime + quizTime;
  const idleEstimate = Math.max(0, totalSec - Object.values(byCategory).reduce((s, c) => s + c.duration, 0));
  const productivityScore = totalSec > 0 ? Math.round((productiveTime / totalSec) * 100) : 0;
  const focusScore = Math.max(0, Math.min(100, 100 - Math.round((idleEstimate / Math.max(totalSec, 1)) * 50)));

  const summaryLines: string[] = [];
  const device = session.deviceName || "Web";
  const durMin = Math.round(totalSec / 60);
  summaryLines.push(`You completed a ${durMin}-minute ${session.projectName ? `"${session.projectName}"` : ""} session on ${device}.`);

  if (learningTime > 0) summaryLines.push(`You spent ${Math.round(learningTime / 60)} minutes learning.`);
  if (codingTime > 0) summaryLines.push(`You spent ${Math.round(codingTime / 60)} minutes coding.`);
  if (taskTime > 0) summaryLines.push(`You completed ${byCategory["TASK"]?.count || 0} tasks.`);
  if (aiTime > 0) summaryLines.push(`You used the AI assistant for ${Math.round(aiTime / 60)} minutes.`);
  if (videoTime > 0) summaryLines.push(`You watched ${byCategory["VIDEO"]?.count || 0} videos.`);

  const recs: string[] = [];
  if (learningTime > codingTime) recs.push("Increase hands-on coding practice to balance theory with application.");
  if (codingTime > learningTime * 2) recs.push("Consider reviewing fundamental concepts to strengthen your theoretical foundation.");
  if (idleEstimate > totalSec * 0.3) recs.push("Try shorter, more focused sessions to maintain higher concentration.");
  if (productivityScore < 50) recs.push("Break your session into smaller blocks with clear goals for each.");
  if (recs.length === 0) recs.push("Great session! Keep up the consistent pace.");

  const suggestions: string[] = [];
  if (Array.from(technologies).length > 0) {
    suggestions.push(`Review ${Array.from(technologies).slice(0, 3).join(", ")}`);
  }
  suggestions.push("Practice with flashcards on key topics");
  suggestions.push("Try explaining concepts to reinforce learning");

  const insights = {
    primaryFocus: Object.entries(byCategory).sort((a, b) => b[1].duration - a[1].duration)[0]?.[0] || "General",
    learningVsCoding: learningTime > codingTime ? "Learning-focused" : "Coding-focused",
    consistency: productivityScore > 70 ? "High" : productivityScore > 40 ? "Medium" : "Low",
    topModules: Object.entries(modules).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m),
  };

  const reportData = {
    sessionId,
    type: "SESSION_SUMMARY",
    title: `Session Summary - ${session.startTime.toLocaleDateString()}`,
    summary: summaryLines.join(" "),
    durationSeconds: totalSec,
    productivityScore,
    focusScore,
    metrics: {
      totalDuration: totalSec,
      learningTime: Math.round(learningTime),
      codingTime: Math.round(codingTime),
      taskTime: Math.round(taskTime),
      aiTime: Math.round(aiTime),
      videoTime: Math.round(videoTime),
      quizTime: Math.round(quizTime),
      idleTime: Math.round(idleEstimate),
      productiveTime: Math.round(productiveTime),
      pauseMs: session.totalPauseMs,
      eventCount: session.activities.length,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, { duration: v.duration, count: v.count }])
      ),
    },
    chartData: {
      categoryBreakdown: Object.entries(byCategory).map(([name, data]) => ({
        name,
        duration: data.duration,
        count: data.count,
      })),
      timeline: session.activities.map((a) => ({
        time: a.createdAt.toISOString(),
        type: a.eventType,
        category: a.category,
        label: a.label,
      })),
    },
    recommendations: recs,
    insights,
    technologies: Array.from(technologies),
    topics: Array.from(topics),
  };

  const report = await prisma.report.create({
    data: {
      userId,
      trackingSessionId: sessionId,
      type: "SESSION_SUMMARY",
      title: reportData.title,
      summary: reportData.summary,
      durationSeconds: reportData.durationSeconds,
      productivityScore: reportData.productivityScore,
      focusScore: reportData.focusScore,
      metrics: JSON.parse(JSON.stringify(reportData.metrics)),
      chartData: JSON.parse(JSON.stringify(reportData.chartData)),
      recommendations: JSON.parse(JSON.stringify(reportData.recommendations)),
      insights: JSON.parse(JSON.stringify(reportData.insights)),
      technologies: reportData.technologies,
      topics: reportData.topics,
    },
  });

  return report;
};

export const generatePeriodicReport = async (
  userId: string,
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
  from: Date,
  to: Date
) => {
  const sessions = await prisma.trackingSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      startTime: { gte: from, lte: to },
    },
    include: { _count: { select: { activities: true } } },
  });

  const totalDuration = sessions.reduce((s, sess) => {
    if (!sess.endTime) return s;
    return s + (sess.endTime.getTime() - sess.startTime.getTime() - sess.totalPauseMs) / 1000;
  }, 0);
  const totalSessions = sessions.length;

  const sessionIds = sessions.map(s => s.id);
  const allActivities = sessionIds.length > 0
    ? await prisma.activityEvent.findMany({ where: { trackingSessionId: { in: sessionIds } } })
    : [];

  const byCategory: Record<string, number> = {};
  let totalEventDuration = 0;
  for (const a of allActivities) {
    byCategory[a.category] = (byCategory[a.category] || 0) + a.duration;
    totalEventDuration += a.duration;
  }
  const learningTime = (byCategory["LEARNING"] || 0) + (byCategory["READING"] || 0);
  const codingTime = byCategory["CODING"] || 0;
  const productiveTime = learningTime + codingTime;
  const avgScore = totalDuration > 0 ? Math.round((productiveTime / totalDuration) * 100) : 0;

  // Aggregate external telemetry for the period
  const [browserEvents, desktopEvents] = await Promise.all([
    prisma.browserTelemetry.findMany({
      where: { userId, timestamp: { gte: from, lte: to } }
    }),
    prisma.desktopTelemetry.findMany({
      where: { userId, timestamp: { gte: from, lte: to }, isIdle: false }
    })
  ]);

  const domainMap: Record<string, number> = {};
  browserEvents.forEach(e => {
    domainMap[e.domain] = (domainMap[e.domain] || 0) + e.duration;
  });
  const topWebsites = Object.entries(domainMap)
    .map(([domain, duration]) => ({ domain, duration }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const appMap: Record<string, number> = {};
  desktopEvents.forEach(e => {
    appMap[e.activeApp] = (appMap[e.activeApp] || 0) + e.duration;
  });
  const topApps = Object.entries(appMap)
    .map(([app, duration]) => ({ app, duration }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const title = `${type.charAt(0) + type.slice(1).toLowerCase()} Report - ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;
  const summary = `You completed ${totalSessions} sessions totaling ${Math.round(totalDuration / 60)} minutes. Average productivity score: ${avgScore}%.`;

  return prisma.report.create({
    data: {
      userId,
      type: type as any,
      title,
      summary,
      durationSeconds: Math.round(totalDuration),
      productivityScore: avgScore,
      focusScore: avgScore,
      metrics: { 
        totalSessions, 
        totalDuration: Math.round(totalDuration), 
        avgScore,
        topWebsites,
        topApps
      },
      chartData: { 
        sessions: sessions.map((s) => ({ id: s.id, start: s.startTime, end: s.endTime, durationSeconds: s.endTime ? Math.round((s.endTime.getTime() - s.startTime.getTime() - s.totalPauseMs) / 1000) : 0 })) 
      },
      recommendations: [],
      insights: {},
      technologies: [],
      topics: [],
    },
  });
};

export const getReports = async (
  userId: string,
  options: { type?: string; limit?: number; offset?: number } = {}
) => {
  const where: any = { userId };
  if (options.type) where.type = options.type;
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit || 20,
      skip: options.offset || 0,
    }),
    prisma.report.count({ where }),
  ]);
  return { reports, total };
};

export const getReport = async (reportId: string, userId: string) => {
  return prisma.report.findFirst({ where: { id: reportId, userId } });
};
