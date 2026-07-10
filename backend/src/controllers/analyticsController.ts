import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getAggregatedStats } from '../services/analytics.service';
import { generateProductivityInsights } from '../services/insights.service';
import { getSessionHistory } from '../services/tracking.service';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await prisma.trackingSession.findMany({
      where: { userId, status: 'COMPLETED', startTime: { gte: sevenDaysAgo } },
      orderBy: { startTime: 'asc' },
    });

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await prisma.activityEvent.groupBy({
      by: ['category'],
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { duration: true },
      _count: true,
    });

    const breakdown = activities.map((a) => ({
      category: a.category,
      duration: a._sum.duration || 0,
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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { createdAt: true, productivityScore: true, focusScore: true, durationSeconds: true },
    });

    res.json({ success: true, data: reports.reverse() });
  } catch (error) {
    console.error('getProductivityTrend error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
