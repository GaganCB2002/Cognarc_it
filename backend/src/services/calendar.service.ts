import { prisma } from "../lib/prisma";

export interface CreateCalendarEventInput {
  userId: string;
  title: string;
  description?: string;
  eventType: string;
  color?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceRule?: Record<string, unknown>;
  recurrenceEnd?: Date;
  timezone?: string;
  location?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  eventType?: string;
  color?: string;
  startTime?: Date;
  endTime?: Date;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceRule?: Record<string, unknown>;
  recurrenceEnd?: Date;
  timezone?: string;
  location?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export const createEvent = async (input: CreateCalendarEventInput) => {
  return prisma.calendarEvent.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description || null,
      eventType: input.eventType,
      color: input.color || null,
      startTime: input.startTime,
      endTime: input.endTime || null,
      isAllDay: input.isAllDay || false,
      isRecurring: input.isRecurring || false,
      recurrenceType: (input.recurrenceType as any) || null,
      recurrenceRule: input.recurrenceRule ? JSON.parse(JSON.stringify(input.recurrenceRule)) : null,
      recurrenceEnd: input.recurrenceEnd || null,
      timezone: input.timezone || null,
      location: input.location || null,
      tags: input.tags || [],
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
    },
  });
};

export const updateEvent = async (eventId: string, userId: string, input: UpdateCalendarEventInput) => {
  const existing = await prisma.calendarEvent.findFirst({ where: { id: eventId, userId } });
  if (!existing) throw new Error("Event not found");
  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.eventType !== undefined) data.eventType = input.eventType;
  if (input.color !== undefined) data.color = input.color;
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;
  if (input.isAllDay !== undefined) data.isAllDay = input.isAllDay;
  if (input.isRecurring !== undefined) data.isRecurring = input.isRecurring;
  if (input.recurrenceType !== undefined) data.recurrenceType = input.recurrenceType;
  if (input.recurrenceRule !== undefined) data.recurrenceRule = input.recurrenceRule;
  if (input.recurrenceEnd !== undefined) data.recurrenceEnd = input.recurrenceEnd;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.location !== undefined) data.location = input.location;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.metadata !== undefined) data.metadata = input.metadata;
  return prisma.calendarEvent.update({ where: { id: eventId }, data });
};

export const deleteEvent = async (eventId: string, userId: string) => {
  const existing = await prisma.calendarEvent.findFirst({ where: { id: eventId, userId } });
  if (!existing) throw new Error("Event not found");
  return prisma.calendarEvent.delete({ where: { id: eventId } });
};

export const getEvent = async (eventId: string, userId: string) => {
  return prisma.calendarEvent.findFirst({ where: { id: eventId, userId } });
};

export const getEventsInRange = async (
  userId: string,
  start: Date,
  end: Date,
  options?: { eventType?: string; tags?: string[] }
) => {
  const where: any = {
    userId,
    startTime: { lte: end },
    OR: [
      { endTime: { gte: start } },
      { endTime: null, startTime: { gte: start } },
    ],
  };
  if (options?.eventType) where.eventType = options.eventType;
  if (options?.tags?.length) where.tags = { hasSome: options.tags };
  return prisma.calendarEvent.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
};

export const searchEvents = async (
  userId: string,
  query: string,
  options?: { limit?: number; eventType?: string }
) => {
  return prisma.calendarEvent.findMany({
    where: {
      userId,
      title: { contains: query, mode: "insensitive" },
      ...(options?.eventType ? { eventType: options.eventType } : {}),
    },
    orderBy: { startTime: "asc" },
    take: options?.limit || 50,
  });
};

export const getEventStats = async (userId: string, from: Date, to: Date) => {
  const events = await prisma.calendarEvent.findMany({
    where: { userId, startTime: { gte: from, lte: to } },
  });
  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] || 0) + 1;
  }
  return {
    total: events.length,
    byType,
    range: { from, to },
  };
};
