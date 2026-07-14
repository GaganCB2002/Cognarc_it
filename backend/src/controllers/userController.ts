import { Request, Response } from 'express';

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  res.status(200).json({ success: true, data: { user: { id } } });
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { users: [], total: 0 } });
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  res.status(200).json({ success: true, data: { user: { id } } });
}

export async function getUserStats(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { stats: { studySessionsCount: 0, currentStreak: 0, longestStreak: 0, tasksCompleted: 0 } } });
}

export async function getPendingUsers(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { users: [], pagination: { page: 1, limit: 20, total: 0 } } });
}

export async function getAdminDashboardStats(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { stats: { totalUsers: 0, pendingApprovals: 0, activeUsers: 0, roleBreakdown: [] } } });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Updated in Clerk' } });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Deleted in Clerk' } });
}

export async function approveUser(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Approved via Clerk' } });
}

export async function rejectUser(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { message: 'Rejected via Clerk' } });
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { stats: { totalUsers: 0, pendingApprovals: 0, activeUsers: 0, roleBreakdown: [] } } });
}

export async function importUsers(req: Request, res: Response): Promise<void> {
  res.status(501).json({ success: false, message: 'Import not supported' });
}
