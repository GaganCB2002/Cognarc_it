import { prisma } from "../lib/prisma";

export const generateProductivityInsights = async (userId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await prisma.trackingSession.findMany({
    where: { userId, status: "COMPLETED", startTime: { gte: thirtyDaysAgo } },
    include: { _count: { select: { activities: true } } },
  });
  const totalSessions = sessions.length;
  if (totalSessions === 0) return { message: "Not enough data. Complete a few sessions to get insights." };

  const totalDuration = sessions.reduce((s, sess) => {
    if (!sess.endTime) return s;
    return s + (sess.endTime.getTime() - sess.startTime.getTime() - sess.totalPauseMs);
  }, 0);

  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const bestSession = sessions.reduce((best, s) => {
    if (!s.endTime) return best;
    const d = s.endTime.getTime() - s.startTime.getTime() - s.totalPauseMs;
    return d > (best.duration || 0) ? { id: s.id, duration: d, date: s.startTime } : best;
  }, { id: "", duration: 0, date: new Date() });

  const reports = await prisma.report.findMany({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
  });

  const avgProductivity = reports.length > 0
    ? reports.reduce((s, r) => s + (r.productivityScore || 0), 0) / reports.length
    : 0;

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];
  const allTopics = new Set<string>();
  for (const r of reports) {
    if (r.topics) r.topics.forEach((t) => allTopics.add(t));
    if (r.productivityScore && r.productivityScore > 70 && r.topics) {
      r.topics.forEach((t) => { if (!weakTopics.includes(t) && !strongTopics.includes(t)) strongTopics.push(t); });
    } else if (r.productivityScore && r.productivityScore < 50 && r.topics) {
      r.topics.forEach((t) => { if (!strongTopics.includes(t) && !weakTopics.includes(t)) weakTopics.push(t); });
    }
  }

  const recommendations: string[] = [];
  if (avgDuration < 30 * 60 * 1000) recommendations.push("Try longer sessions (30-60 min) for deeper focus.");
  if (avgDuration > 120 * 60 * 1000) recommendations.push("Consider breaking sessions into 45-60 min blocks with breaks.");
  if (avgProductivity < 50) recommendations.push("Set specific goals before each session to improve focus.");
  if (strongTopics.length > 0) recommendations.push(`Your strengths: ${strongTopics.slice(0, 3).join(", ")}. Keep building on these.`);
  if (weakTopics.length > 0) recommendations.push(`Areas to improve: ${weakTopics.slice(0, 3).join(", ")}. Consider reviewing fundamentals.`);
  if (recommendations.length === 0) recommendations.push("Great consistency! Challenge yourself with advanced topics.");

  return {
    totalSessions,
    totalHours: Math.round(totalDuration / 3600000 * 10) / 10,
    avgSessionMinutes: Math.round(avgDuration / 60000 * 10) / 10,
    bestSession: bestSession.id ? { id: bestSession.id, durationMinutes: Math.round(bestSession.duration / 60000), date: bestSession.date } : null,
    avgProductivity: Math.round(avgProductivity),
    strongTopics: strongTopics.slice(0, 5),
    weakTopics: weakTopics.slice(0, 5),
    allTopics: Array.from(allTopics),
    recommendations,
    trend: avgProductivity > 60 ? "positive" : avgProductivity > 40 ? "stable" : "needs_improvement",
  };
};

export const generateLearningRoadmap = async (userId: string) => {
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const allTechnologies = new Set<string>();
  const allTopics = new Set<string>();
  for (const r of reports) {
    if (r.technologies) r.technologies.forEach((t) => allTechnologies.add(t));
    if (r.topics) r.topics.forEach((t) => allTopics.add(t));
  }

  return {
    currentTechnologies: Array.from(allTechnologies),
    currentTopics: Array.from(allTopics),
    suggestedNext: [
      "Master design patterns in your primary language",
      "Build a full-stack project end-to-end",
      "Study system design for scalability",
      "Practice coding challenges daily",
      "Contribute to open source projects",
    ],
  };
};

export const generateInterviewQuestions = async (userId: string) => {
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const technologies = new Set<string>();
  for (const r of reports) {
    if (r.technologies) r.technologies.forEach((t) => technologies.add(t));
  }

  const techList = Array.from(technologies);
  return {
    technologies: techList,
    questions: [
      { question: `Explain how you would design a scalable system using ${techList[0] || "your stack"}.`, type: "system_design" },
      { question: "Describe a challenging bug you fixed and how you approached it.", type: "behavioral" },
      { question: "How do you ensure code quality in your projects?", type: "best_practices" },
      { question: "Explain the difference between REST and GraphQL.", type: "technical" },
      { question: "How do you stay updated with new technologies?", type: "learning" },
    ],
  };
};
