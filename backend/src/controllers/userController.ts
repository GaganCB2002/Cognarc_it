import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

async function requireAdmin(userId: string | undefined, res: Response): Promise<boolean> {
  if (!userId) {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return false;
  }
  return true;
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    const users = rawUsers.map(({ password, ...rest }) => rest);

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
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const rawUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        learningStreak: true,
      },
    });

    if (!rawUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { password, ...user } = rawUser;
    res.status(200).json({ user });
  } catch (error) {
    console.error('GetUserById error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

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
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
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
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function getPendingUsers(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: { isApproved: false, role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { isApproved: false, role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }),
    ]);
    const users = rawUsers.map(({ password, ...rest }) => rest);

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
    console.error('GetPendingUsers error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function approveUser(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

    const id = req.params.id as string;
    await prisma.user.update({
      where: { id },
      data: { isApproved: true },
    });

    res.status(200).json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('ApproveUser error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function rejectUser(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

    const id = req.params.id as string;
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: 'User rejected and deleted successfully' });
  } catch (error) {
    console.error('RejectUser error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}

export async function getAdminDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const ok = await requireAdmin(req.user?.userId, res);
    if (!ok) return;

    const [totalUsers, pendingUsers, approvedUsers, totalTasks, totalNotes, totalSessions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: false, role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.user.count({ where: { isApproved: true } }),
      prisma.task.count(),
      prisma.note.count(),
      prisma.trackingSession.count(),
    ]);

    // Role breakdown
    const roleBreakdown = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    res.status(200).json({
      stats: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        totalTasks,
        totalNotes,
        totalSessions,
        roleBreakdown: roleBreakdown.map(r => ({ role: r.role, count: r._count.role })),
      },
    });
  } catch (error) {
    console.error('GetAdminDashboardStats error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ message: msg });
  }
}
