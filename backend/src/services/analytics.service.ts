import { pool } from '../lib/prisma';
import { generateAIInsights } from './ai.service';

export const getAggregatedStats = async (userId: string) => {
  const desktopDeep = await pool.query(
    `SELECT COALESCE(SUM(duration), 0) as duration FROM "DesktopTelemetry" WHERE "userId" = $1 AND category = ANY($2)`,
    [userId, ['IDE', 'Terminal']]
  );
  const browserDeep = await pool.query(
    `SELECT COALESCE(SUM(duration), 0) as duration FROM "BrowserTelemetry" WHERE "userId" = $1 AND category = ANY($2)`,
    [userId, ['Documentation', 'Learning']]
  );

  const totalDeepSeconds = Number(desktopDeep.rows[0].duration) + Number(browserDeep.rows[0].duration);
  const deepHours = (totalDeepSeconds / 3600).toFixed(1);

  const { rows: sessions } = await pool.query(
    `SELECT "startTime", "endTime", "totalPauseMs" FROM "TrackingSession" WHERE "userId" = $1 AND status = 'COMPLETED' AND "endTime" IS NOT NULL`,
    [userId]
  );
  const totalSessionSeconds = sessions.reduce((acc: number, s: any) => {
    return acc + Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime() - s.totalPauseMs) / 1000);
  }, 0);
  const intensityPct = totalSessionSeconds > 0 ? Math.round((totalDeepSeconds / totalSessionSeconds) * 100) : 0;
  const sessionIntensity = totalDeepSeconds > 0 ? `High (${intensityPct}%)` : "None (0%)";

  const { rows: topDesktop } = await pool.query(
    `SELECT "processName", SUM(duration) as duration FROM "DesktopTelemetry" WHERE "userId" = $1 GROUP BY "processName" ORDER BY duration DESC LIMIT 2`,
    [userId]
  );
  const { rows: topBrowser } = await pool.query(
    `SELECT domain, SUM(duration) as duration FROM "BrowserTelemetry" WHERE "userId" = $1 GROUP BY domain ORDER BY duration DESC LIMIT 2`,
    [userId]
  );

  let combinedSessions = [
    ...topDesktop.map((s: any) => ({ topic: s.processName, type: 'Desktop', duration: Number(s.duration) })),
    ...topBrowser.map((s: any) => ({ topic: s.domain, type: 'Browser', duration: Number(s.duration) }))
  ].sort((a, b) => b.duration - a.duration).slice(0, 2);

  if (combinedSessions.length === 0) {
    combinedSessions = [
      { topic: 'System Design', type: 'Fallback', duration: 1200 },
      { topic: 'React.js', type: 'Fallback', duration: 800 }
    ];
  }

  const maxDuration = combinedSessions.length > 0 ? combinedSessions[0].duration : 1;
  const topSessionsFormatted = combinedSessions.map(s => ({
    topic: s.topic,
    desc: `Intensive focus in ${s.topic} (${(s.duration / 60).toFixed(0)} minutes logged).`,
    progress: Math.min(100, Math.round((s.duration / maxDuration) * 100))
  }));

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

  const { rows: dailyDesktop } = await pool.query(
    `SELECT "timestamp", duration FROM "DesktopTelemetry" WHERE "userId" = $1 AND "timestamp" >= $2`,
    [userId, twentyEightDaysAgo]
  );
  const { rows: dailyBrowser } = await pool.query(
    `SELECT "timestamp", duration FROM "BrowserTelemetry" WHERE "userId" = $1 AND "timestamp" >= $2`,
    [userId, twentyEightDaysAgo]
  );

  const pulseMap = new Array(28).fill(0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const bucketEvent = (event: any) => {
    const eventDate = new Date(event.timestamp);
    const diffTime = Math.abs(today.getTime() - eventDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 28) {
      pulseMap[27 - diffDays] += (event.duration || 0);
    }
  };

  dailyDesktop.forEach(bucketEvent);
  dailyBrowser.forEach(bucketEvent);

  const maxPulse = Math.max(...pulseMap, 1);
  const activityPulse = pulseMap.map(val => {
    if (val === 0) return 0;
    const ratio = val / maxPulse;
    if (ratio > 0.6) return 3;
    if (ratio > 0.3) return 2;
    return 1;
  });

  const aiData = await generateAIInsights(combinedSessions.map(s => s.topic).filter((t): t is string => t !== null));

  return {
    sessionIntensity,
    deepHours: parseFloat(deepHours),
    profileType: aiData.profileType,
    profileDesc: aiData.profileDesc,
    coreProficiencies: aiData.coreProficiencies,
    topSessions: topSessionsFormatted,
    activityPulse,
    interviewQuestions: aiData.interviewQuestions
  };
};
