import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { status, priority, category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.task.count({ where }),
    ]);

    res.json({ success: true, data: tasks, total, page: parseInt(page as string), limit: take });
  } catch (error) {
    console.error('getTasks error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getTaskStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const [total, byStatus, byPriority] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.groupBy({ by: ['status'], where: { userId }, _count: true }),
      prisma.task.groupBy({ by: ['priority'], where: { userId }, _count: true }),
    ]);

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const task = await prisma.task.findFirst({ where: { id, userId } });
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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { title, description, priority, status, dueDate, category, checklist } = req.body;
    if (!title) { res.status(400).json({ success: false, message: 'Title is required' }); return; }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        category,
        checklist: checklist || undefined,
      },
    });

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Task not found' }); return; }

    const { title, description, priority, status, dueDate, category, checklist } = req.body;
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (category !== undefined) updateData.category = category;
    if (checklist !== undefined) updateData.checklist = checklist;

    const task = await prisma.task.update({ where: { id }, data: updateData });

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const id = req.params.id as string;
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Task not found' }); return; }

    await prisma.task.delete({ where: { id } });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
