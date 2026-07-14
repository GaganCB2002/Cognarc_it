import { pool } from "../lib/prisma";

export const generateSessionReport = async (sessionId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [sessionId, userId]
  );
  if (rows.length === 0) throw new Error("Session not found");
  const session = rows[0];

  const { rows: activities } = await pool.query(
    `SELECT * FROM "ActivityEvent" WHERE "trackingSessionId" = $1 ORDER BY "createdAt" ASC`,
    [sessionId]
  );

  const totalMs = session.endTime
    ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
    : Date.now() - new Date(session.startTime).getTime();
  const activeMs = Math.max(0, totalMs - session.totalPauseMs);
  const totalSec = Math.round(activeMs / 1000);

  const byCategory: Record<string, { duration: number; count: number }> = {};
  const modules: Record<string, number> = {};
  const technologies = new Set<string>();
  const topics = new Set<string>();

  for (const a of activities) {
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
    title: `Session Summary - ${new Date(session.startTime).toLocaleDateString()}`,
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
      eventCount: activities.length,
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
      timeline: activities.map((a: any) => ({
        time: new Date(a.createdAt).toISOString(),
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

  const { rows: report } = await pool.query(
    `INSERT INTO "Report" ("userId", "trackingSessionId", type, title, summary, "durationSeconds", "productivityScore", "focusScore", metrics, "chartData", recommendations, insights, technologies, topics) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [
      userId, sessionId, "SESSION_SUMMARY", reportData.title, reportData.summary,
      reportData.durationSeconds, reportData.productivityScore, reportData.focusScore,
      JSON.parse(JSON.stringify(reportData.metrics)),
      JSON.parse(JSON.stringify(reportData.chartData)),
      JSON.parse(JSON.stringify(reportData.recommendations)),
      JSON.parse(JSON.stringify(reportData.insights)),
      reportData.technologies, reportData.topics,
    ]
  );

  return report[0];
};

export const generatePeriodicReport = async (
  userId: string,
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
  from: Date,
  to: Date
) => {
  const { rows: sessions } = await pool.query(
    `SELECT * FROM "TrackingSession" WHERE "userId" = $1 AND status = 'COMPLETED' AND "startTime" >= $2 AND "startTime" <= $3`,
    [userId, from, to]
  );

  const totalDuration = sessions.reduce((s: number, sess: any) => {
    if (!sess.endTime) return s;
    return s + (new Date(sess.endTime).getTime() - new Date(sess.startTime).getTime() - sess.totalPauseMs) / 1000;
  }, 0);
  const totalSessions = sessions.length;

  const sessionIds = sessions.map((s: any) => s.id);
  let allActivities: any[] = [];
  if (sessionIds.length > 0) {
    const { rows } = await pool.query(
      `SELECT * FROM "ActivityEvent" WHERE "trackingSessionId" = ANY($1)`,
      [sessionIds]
    );
    allActivities = rows;
  }

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

  const [browserRes, desktopRes] = await Promise.all([
    pool.query(`SELECT * FROM "BrowserTelemetry" WHERE "userId" = $1 AND "timestamp" >= $2 AND "timestamp" <= $3`, [userId, from, to]),
    pool.query(`SELECT * FROM "DesktopTelemetry" WHERE "userId" = $1 AND "timestamp" >= $2 AND "timestamp" <= $3 AND "isIdle" = false`, [userId, from, to]),
  ]);

  const domainMap: Record<string, number> = {};
  browserRes.rows.forEach((e: any) => {
    domainMap[e.domain] = (domainMap[e.domain] || 0) + e.duration;
  });
  const topWebsites = Object.entries(domainMap)
    .map(([domain, duration]) => ({ domain, duration }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const appMap: Record<string, number> = {};
  desktopRes.rows.forEach((e: any) => {
    appMap[e.activeApp] = (appMap[e.activeApp] || 0) + e.duration;
  });
  const topApps = Object.entries(appMap)
    .map(([app, duration]) => ({ app, duration }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const title = `${type.charAt(0) + type.slice(1).toLowerCase()} Report - ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;
  const summary = `You completed ${totalSessions} sessions totaling ${Math.round(totalDuration / 60)} minutes. Average productivity score: ${avgScore}%.`;

  const { rows: report } = await pool.query(
    `INSERT INTO "Report" ("userId", type, title, summary, "durationSeconds", "productivityScore", "focusScore", metrics, "chartData", recommendations, insights, technologies, topics) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      userId, type, title, summary, Math.round(totalDuration), avgScore, avgScore,
      { totalSessions, totalDuration: Math.round(totalDuration), avgScore, topWebsites, topApps },
      { sessions: sessions.map((s: any) => ({ id: s.id, start: s.startTime, end: s.endTime, durationSeconds: s.endTime ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime() - s.totalPauseMs) / 1000) : 0 })) },
      [], {}, [], [],
    ]
  );

  return report[0];
};

export const getReports = async (
  userId: string,
  options: { type?: string; limit?: number; offset?: number } = {}
) => {
  const params: any[] = [userId];
  let typeClause = "";
  if (options.type) {
    typeClause = ` AND type = $${params.length + 1}`;
    params.push(options.type);
  }

  const { rows: reports } = await pool.query(
    `SELECT * FROM "Report" WHERE "userId" = $1${typeClause} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, options.limit || 20, options.offset || 0]
  );
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM "Report" WHERE "userId" = $1${typeClause}`,
    params
  );

  return { reports, total: parseInt(count, 10) };
};

export const getReport = async (reportId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM "Report" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [reportId, userId]
  );
  return rows[0] || null;
};
