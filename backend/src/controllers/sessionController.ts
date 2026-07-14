import { Request, Response } from 'express';
import { pool } from '../lib/prisma';

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { startDate, endDate, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (startDate || endDate) {
      const dateConditions: string[] = [];
      if (startDate) {
        dateConditions.push(`"createdAt" >= $${paramIdx}`);
        params.push(new Date(startDate as string));
        paramIdx++;
      }
      if (endDate) {
        dateConditions.push(`"createdAt" <= $${paramIdx}`);
        params.push(new Date(endDate as string));
        paramIdx++;
      }
      conditions.push(`(${dateConditions.join(' AND ')})`);
    }

    const whereClause = conditions.join(' AND ');

    const [sessionsResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "StudySession" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, take]),
      pool.query(`SELECT COUNT(*) FROM "StudySession" WHERE ${whereClause}`, params),
    ]);

    const sessions = sessionsResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

    res.json({ success: true, data: { sessions, total, page: parseInt(page as string), limit: take } });
  } catch (error) {
    console.error('getSessions error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTodaySessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await pool.query(
      'SELECT * FROM "StudySession" WHERE "userId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3 ORDER BY "createdAt" DESC',
      [userId, todayStart, todayEnd]
    );
    const sessions = result.rows;

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('getTodaySessions error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getSessionById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const result = await pool.query('SELECT * FROM "StudySession" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const session = result.rows[0];

    if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('getSessionById error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { topic, duration, type, notes } = req.body;

    const validTypes = ['DEEP_WORK', 'LEARNING', 'MEETING', 'BREAK', 'OTHER'];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid session type' });
      return;
    }

    if (!topic || duration === undefined) {
      res.status(400).json({ success: false, message: 'Topic and duration are required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO "StudySession" ("userId", "topic", "duration", "type", "notes") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, topic, parseInt(duration), type || 'GENERAL', notes]
    );
    const session = result.rows[0];

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('createSession error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "StudySession" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    const { topic, duration, type, notes } = req.body;

    const validTypes = ['DEEP_WORK', 'LEARNING', 'MEETING', 'BREAK', 'OTHER'];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid session type' });
      return;
    }

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (topic !== undefined) { setClauses.push(`"topic" = $${paramIdx}`); params.push(topic); paramIdx++; }
    if (duration !== undefined) { setClauses.push(`"duration" = $${paramIdx}`); params.push(parseInt(duration)); paramIdx++; }
    if (type !== undefined) { setClauses.push(`"type" = $${paramIdx}`); params.push(type); paramIdx++; }
    if (notes !== undefined) { setClauses.push(`"notes" = $${paramIdx}`); params.push(notes); paramIdx++; }

    if (setClauses.length === 0) {
      res.json({ success: true, data: existing });
      return;
    }

    params.push(id);
    const result = await pool.query(`UPDATE "StudySession" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const session = result.rows[0];

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('updateSession error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "StudySession" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

    await pool.query('DELETE FROM "StudySession" WHERE "id" = $1', [id]);

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('deleteSession error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
