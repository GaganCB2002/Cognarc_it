import { Request, Response } from 'express';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  getEventsInRange,
  searchEvents,
  getEventStats,
} from '../services/calendar.service';

export async function createCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { title, description, eventType, color, startTime, endTime, isAllDay, isRecurring, recurrenceType, recurrenceRule, recurrenceEnd, timezone, location, tags, metadata } = req.body;

    if (!title || !eventType || !startTime) {
      res.status(400).json({ success: false, message: 'title, eventType, and startTime are required' });
      return;
    }

    const validEventTypes = ['STUDY', 'WORK', 'MEETING', 'PERSONAL', 'BREAK', 'OTHER', 'LEARNING', 'CODING', 'TASK', 'REVISION', 'GOAL'];
    if (!validEventTypes.includes(eventType)) {
      res.status(400).json({ success: false, message: 'Invalid event type' });
      return;
    }

    const event = await createEvent({
      userId,
      title,
      description,
      eventType,
      color,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      isAllDay,
      isRecurring,
      recurrenceType,
      recurrenceRule,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : undefined,
      timezone,
      location,
      tags,
      metadata,
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('createCalendarEvent error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ success: false, message: 'Event ID is required' }); return; }

    const event = await updateEvent(eventId, userId, req.body);
    res.json({ success: true, data: event });
  } catch (error: any) {
    console.error('updateCalendarEvent error:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ success: false, message: 'Event ID is required' }); return; }

    await deleteEvent(eventId, userId);
    res.json({ success: true, data: { message: 'Event deleted' } });
  } catch (error: any) {
    console.error('deleteCalendarEvent error:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ success: false, message: 'Event ID is required' }); return; }

    const event = await getEvent(eventId, userId);
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('getCalendarEvent error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function listCalendarEvents(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { start, end, eventType, tags } = req.query;
    if (!start || !end) {
      res.status(400).json({ success: false, message: 'start and end query params are required' });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const validEventTypes = ['STUDY', 'WORK', 'MEETING', 'PERSONAL', 'BREAK', 'OTHER', 'LEARNING', 'CODING', 'TASK', 'REVISION', 'GOAL'];
    if (eventType && !validEventTypes.includes(eventType as string)) {
      res.status(400).json({ success: false, message: 'Invalid event type' });
      return;
    }

    const events = await getEventsInRange(
      userId,
      startDate,
      endDate,
      {
        eventType: eventType as string,
        tags: tags ? (tags as string).split(',') : undefined,
      }
    );
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('listCalendarEvents error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function searchCalendarEvents(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { q, eventType } = req.query;
    if (!q) { res.status(400).json({ success: false, message: 'Search query (q) is required' }); return; }

    const events = await searchEvents(userId, q as string, { eventType: eventType as string });
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('searchCalendarEvents error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getCalendarStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const { from, to } = req.query;
    if (!from || !to) {
      res.status(400).json({ success: false, message: 'from and to query params are required' });
      return;
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const stats = await getEventStats(userId, fromDate, toDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('getCalendarStats error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
