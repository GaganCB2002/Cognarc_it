import { Request, Response } from 'express';
import {
  generateProductivityInsights,
  generateLearningRoadmap,
  generateInterviewQuestions,
} from '../services/insights.service';

export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const insights = await generateProductivityInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('getInsights error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getLearningRoadmap(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const roadmap = await generateLearningRoadmap(userId);
    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('getLearningRoadmap error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getInterviewQuestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const questions = await generateInterviewQuestions(userId);
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('getInterviewQuestions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
