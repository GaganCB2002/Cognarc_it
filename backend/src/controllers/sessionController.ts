import { Request, Response } from 'express';
import { prisma } from '../server';

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { startDate, endDate, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.studySession.count({ where }),
    ]);

    res.json({ success: true, data: sessions, total, page: parseInt(page as string), limit: take });
  } catch (error) {
    console.error('getSessions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getTodaySessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sessions = await prisma.studySession.findMany({
      where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('getTodaySessions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const session = await prisma.studySession.findFirst({
      where: { id, userId },
    });

    if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('getSessionById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { topic, duration, type, notes } = req.body;
    if (!topic || duration === undefined) {
      res.status(400).json({ success: false, message: 'Topic and duration are required' });
      return;
    }

    const session = await prisma.studySession.create({
      data: { userId, topic, duration: parseInt(duration), type: type || 'GENERAL', notes },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('createSession error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.studySession.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    const { topic, duration, type, notes } = req.body;
    const updateData: Record<string, any> = {};
    if (topic !== undefined) updateData.topic = topic;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (type !== undefined) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;

    const session = await prisma.studySession.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('updateSession error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.studySession.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    await prisma.studySession.delete({ where: { id } });

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('deleteSession error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
