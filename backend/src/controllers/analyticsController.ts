import { Request, Response } from 'express';
import { pool } from '../lib/prisma';
import { getAggregatedStats } from '../services/analytics.service';
import { generateProductivityInsights } from '../services/insights.service';
import { getSessionHistory } from '../services/tracking.service';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const [legacyStats, insights, recentSessions] = await Promise.all([
      getAggregatedStats(userId),
      generateProductivityInsights(userId),
      getSessionHistory(userId, { limit: 5 }),
    ]);

    res.json({
      success: true,
      data: {
        ...legacyStats,
        insights,
        recentSessions: recentSessions.sessions,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getWeeklyTrends(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await pool.query(
      'SELECT * FROM "TrackingSession" WHERE "userId" = $1 AND "status" = $2 AND "startTime" >= $3 ORDER BY "startTime" ASC',
      [userId, 'COMPLETED', sevenDaysAgo]
    );
    const sessions = result.rows;

    const dailyMap: Record<string, { sessions: number; duration: number; score: number }> = {};
    for (const s of sessions) {
      if (!s.endTime) continue;
      const day = s.startTime.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { sessions: 0, duration: 0, score: 0 };
      dailyMap[day].sessions += 1;
      dailyMap[day].duration += (s.endTime.getTime() - s.startTime.getTime() - s.totalPauseMs) / 60000;
    }

    const trends = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      durationMinutes: Math.round(data.duration),
    }));

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('getWeeklyTrends error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCategoryBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await pool.query(
      'SELECT "category", COALESCE(SUM("duration"), 0)::int AS "_sum_duration", COUNT(*)::int AS "_count" FROM "ActivityEvent" WHERE "userId" = $1 AND "createdAt" >= $2 GROUP BY "category"',
      [userId, thirtyDaysAgo]
    );
    const activities = result.rows;

    const breakdown = activities.map((a: any) => ({
      category: a.category,
      duration: a._sum_duration || 0,
      count: a._count,
    }));

    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('getCategoryBreakdown error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getProductivityTrend(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const result = await pool.query(
      'SELECT "createdAt", "productivityScore", "focusScore", "durationSeconds" FROM "Report" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 30',
      [userId]
    );
    const reports = result.rows.reverse();

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('getProductivityTrend error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
