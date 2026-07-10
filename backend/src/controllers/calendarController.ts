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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { title, description, eventType, color, startTime, endTime, isAllDay, isRecurring, recurrenceType, recurrenceRule, recurrenceEnd, timezone, location, tags, metadata } = req.body;

    if (!title || !eventType || !startTime) {
      res.status(400).json({ message: 'title, eventType, and startTime are required' });
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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ message: 'Event ID is required' }); return; }

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ message: 'Event ID is required' }); return; }

    await deleteEvent(eventId, userId);
    res.json({ success: true, message: 'Event deleted' });
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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const eventId = req.params.eventId as string;
    if (!eventId) { res.status(400).json({ message: 'Event ID is required' }); return; }

    const event = await getEvent(eventId, userId);
    if (!event) { res.status(404).json({ message: 'Event not found' }); return; }

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { start, end, eventType, tags } = req.query;
    if (!start || !end) {
      res.status(400).json({ message: 'start and end query params are required' });
      return;
    }

    const events = await getEventsInRange(
      userId,
      new Date(start as string),
      new Date(end as string),
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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { q, eventType } = req.query;
    if (!q) { res.status(400).json({ message: 'Search query (q) is required' }); return; }

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
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { from, to } = req.query;
    if (!from || !to) {
      res.status(400).json({ message: 'from and to query params are required' });
      return;
    }

    const stats = await getEventStats(userId, new Date(from as string), new Date(to as string));
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('getCalendarStats error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error).message;
    res.status(500).json({ success: false, message: msg });
  }
}
