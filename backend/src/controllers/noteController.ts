import { Request, Response } from 'express';
import { pool } from '../lib/prisma';
import { queueService } from '../services/queue.service';
export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { folder, search, tag, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (folder) {
      conditions.push(`"folderId" = $${paramIdx}`);
      params.push(folder);
      paramIdx++;
    }
    if (search) {
      conditions.push(`"title" ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (tag) {
      conditions.push(`$${paramIdx} = ANY("tags")`);
      params.push(tag);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const [notesResult, countResult] = await Promise.all([
      pool.query(`SELECT * FROM "Note" WHERE ${whereClause} ORDER BY "isPinned" DESC, "updatedAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, take]),
      pool.query(`SELECT COUNT(*) FROM "Note" WHERE ${whereClause}`, params),
    ]);

    const notes = notesResult.rows;
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ success: true, data: { notes, total, page: parseInt(page as string), limit: take } });
  } catch (error) {
    console.error('getNotes error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const result = await pool.query('SELECT * FROM "Note" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const note = result.rows[0];
    if (!note) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('getNoteById error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { title, content, tags, folderId } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO "Note" ("userId", "title", "content", "tags", "folderId") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, content, tags || [], folderId || null]
    );
    const note = result.rows[0];

    queueService.enqueue("AI_PROCESS_NOTE", { noteId: note.id });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('createNote error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "Note" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    const { title, content, tags, folderId } = req.body;
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (folderId !== undefined) updateData.folderId = folderId || null;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`"${key}" = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
    params.push(id);
    const result = await pool.query(`UPDATE "Note" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const note = result.rows[0];

    queueService.enqueue("AI_PROCESS_NOTE", { noteId: note.id });

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('updateNote error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "Note" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    await pool.query('DELETE FROM "Note" WHERE "id" = $1', [id]);

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('deleteNote error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function pinNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existingResult = await pool.query('SELECT * FROM "Note" WHERE "id" = $1 AND "userId" = $2 LIMIT 1', [id, userId]);
    const existing = existingResult.rows[0];
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    const result = await pool.query('UPDATE "Note" SET "isPinned" = NOT "isPinned" WHERE "id" = $1 AND "userId" = $2 RETURNING *', [id, userId]);
    const note = result.rows[0];

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('pinNote error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
