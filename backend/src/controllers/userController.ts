import { Request, Response } from 'express';
import { prisma } from '../server';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        omit: { password: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      omit: { password: true },
      include: {
        profile: true,
        learningStreak: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const [studySessionsCount, learningStreak, tasksCompleted] = await Promise.all([
      prisma.studySession.count({ where: { userId } }),
      prisma.learningStreak.findUnique({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
    ]);

    res.status(200).json({
      stats: {
        studySessionsCount,
        currentStreak: learningStreak?.currentStreak ?? 0,
        longestStreak: learningStreak?.longestStreak ?? 0,
        tasksCompleted,
      },
    });
  } catch (error) {
    console.error('GetUserStats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
