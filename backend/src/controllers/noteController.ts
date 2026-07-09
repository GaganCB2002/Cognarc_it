import { Request, Response } from 'express';
import { prisma } from '../server';
import { queueService } from '../services/queue.service';
export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { folder, search, tag, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId };
    if (folder) where.folderId = folder;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };
    if (tag) where.tags = { has: tag as string };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.note.count({ where }),
    ]);

    res.json({ success: true, data: notes, total, page: parseInt(page as string), limit: take });
  } catch (error) {
    console.error('getNotes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('getNoteById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { title, content, tags, folderId } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const note = await prisma.note.create({
      data: { userId, title, content, tags: tags || [], folderId: folderId || undefined },
    });

    // Trigger AI Processing
    queueService.enqueue("AI_PROCESS_NOTE", { noteId: note.id });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('createNote error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    const { title, content, tags, folderId } = req.body;
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (folderId !== undefined) updateData.folderId = folderId || null;

    const note = await prisma.note.update({ where: { id }, data: updateData });

    // Trigger AI Processing
    queueService.enqueue("AI_PROCESS_NOTE", { noteId: note.id });

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('updateNote error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    await prisma.note.delete({ where: { id } });

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('deleteNote error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function pinNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Note not found' }); return; }

    const note = await prisma.note.update({
      where: { id },
      data: { isPinned: !existing.isPinned },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('pinNote error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
