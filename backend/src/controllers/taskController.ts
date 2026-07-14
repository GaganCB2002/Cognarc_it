import { Request, Response } from 'express';
import { pool } from '../lib/prisma';

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { status, priority, category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (status) { conditions.push(`"status" = $${paramIdx}`); params.push(status); paramIdx++; }
    if (priority) { conditions.push(`"priority" = $${paramIdx}`); params.push(priority); paramIdx++; }
    if (category) { conditions.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }
    if (search) {
      conditions.push(`"title" ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const [tasksResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "Task" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, take]),
      pool.query(`SELECT COUNT(*) FROM "Task" WHERE ${whereClause}`, params),
    ]);

    const tasks = tasksResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

    res.json({ success: true, data: { tasks, total, page: parseInt(page as string), limit: take } });
  } catch (error) {
    console.error('getTasks error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTaskStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const [totalResult, byStatusResult, byPriorityResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Task" WHERE "userId" = $1', [userId]),
      pool.query('SELECT "status", COUNT(*)::int AS "_count" FROM "Task" WHERE "userId" = $1 GROUP BY "status"', [userId]),
      pool.query('SELECT "priority", COUNT(*)::int AS "_count" FROM "Task" WHERE "userId" = $1 GROUP BY "priority"', [userId]),
    ]);

    const total = parseInt(totalResult.rows[0].count, 10);
    const byStatus = byStatusResult.rows;
    const byPriority = byPriorityResult.rows;

    res.json({ success: true, data: { total, byStatus, byPriority } });
  } catch (error) {
    console.error('getTaskStats error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const result = await pool.query('SELECT * FROM "Task" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const task = result.rows[0];
    if (!task) { res.status(404).json({ success: false, message: 'Task not found' }); return; }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('getTaskById error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { title, description, priority, status, dueDate, category, checklist } = req.body;
    if (!title) { res.status(400).json({ success: false, message: 'Title is required' }); return; }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority value' }); return;
    }
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value' }); return;
    }

    const result = await pool.query(
      'INSERT INTO "Task" ("userId", "title", "description", "priority", "status", "dueDate", "category", "checklist") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, title, description, priority || 'MEDIUM', status || 'TODO', dueDate ? new Date(dueDate) : null, category, checklist || null]
    );
    const task = result.rows[0];

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('createTask error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "Task" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Task not found' }); return; }

    const { title, description, priority, status, dueDate, category, checklist } = req.body;

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority value' }); return;
    }
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value' }); return;
    }

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (title !== undefined) { setClauses.push(`"title" = $${paramIdx}`); params.push(title); paramIdx++; }
    if (description !== undefined) { setClauses.push(`"description" = $${paramIdx}`); params.push(description); paramIdx++; }
    if (priority !== undefined) { setClauses.push(`"priority" = $${paramIdx}`); params.push(priority); paramIdx++; }
    if (status !== undefined) { setClauses.push(`"status" = $${paramIdx}`); params.push(status); paramIdx++; }
    if (dueDate !== undefined) { setClauses.push(`"dueDate" = $${paramIdx}`); params.push(dueDate ? new Date(dueDate) : null); paramIdx++; }
    if (category !== undefined) { setClauses.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }
    if (checklist !== undefined) { setClauses.push(`"checklist" = $${paramIdx}`); params.push(checklist); paramIdx++; }

    if (setClauses.length === 0) {
      res.json({ success: true, data: existing });
      return;
    }

    params.push(id);
    const result = await pool.query(`UPDATE "Task" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const task = result.rows[0];

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('updateTask error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "Task" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Task not found' }); return; }

    await pool.query('DELETE FROM "Task" WHERE "id" = $1', [id]);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
