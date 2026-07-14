import { pool } from "../lib/prisma";

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

const COLUMNS = `"id", "userId", title, description, "eventType", color, "startTime", "endTime", "isAllDay", "isRecurring", "recurrenceType", "recurrenceRule", "recurrenceEnd", timezone, location, tags, metadata, "createdAt", "updatedAt"`;

export const createEvent = async (input: CreateCalendarEventInput) => {
  const { rows } = await pool.query(
    `INSERT INTO "CalendarEvent" ("userId", title, description, "eventType", color, "startTime", "endTime", "isAllDay", "isRecurring", "recurrenceType", "recurrenceRule", "recurrenceEnd", timezone, location, tags, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING ${COLUMNS}`,
    [
      input.userId, input.title, input.description || null, input.eventType,
      input.color || null, input.startTime, input.endTime || null,
      input.isAllDay || false, input.isRecurring || false,
      (input.recurrenceType as any) || null,
      input.recurrenceRule ? JSON.parse(JSON.stringify(input.recurrenceRule)) : null,
      input.recurrenceEnd || null, input.timezone || null,
      input.location || null, input.tags || [],
      input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
    ]
  );
  return rows[0];
};

export const updateEvent = async (eventId: string, userId: string, input: UpdateCalendarEventInput) => {
  const { rows } = await pool.query(
    `SELECT id FROM "CalendarEvent" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [eventId, userId]
  );
  if (rows.length === 0) throw new Error("Event not found");

  const setClauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  const addField = (col: string, val: any) => {
    if (val !== undefined) {
      setClauses.push(`"${col}" = $${idx++}`);
      params.push(val);
    }
  };

  addField("title", input.title);
  addField("description", input.description);
  addField("eventType", input.eventType);
  addField("color", input.color);
  addField("startTime", input.startTime);
  addField("endTime", input.endTime);
  addField("isAllDay", input.isAllDay);
  addField("isRecurring", input.isRecurring);
  addField("recurrenceType", input.recurrenceType);
  addField("recurrenceRule", input.recurrenceRule);
  addField("recurrenceEnd", input.recurrenceEnd);
  addField("timezone", input.timezone);
  addField("location", input.location);
  addField("tags", input.tags);
  addField("metadata", input.metadata);

  if (setClauses.length === 0) {
    const { rows: existing } = await pool.query(`SELECT ${COLUMNS} FROM "CalendarEvent" WHERE id = $1`, [eventId]);
    return existing[0];
  }

  setClauses.push(`"updatedAt" = now()`);

  const { rows: updated } = await pool.query(
    `UPDATE "CalendarEvent" SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING ${COLUMNS}`,
    [...params, eventId]
  );
  return updated[0];
};

export const deleteEvent = async (eventId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT id FROM "CalendarEvent" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [eventId, userId]
  );
  if (rows.length === 0) throw new Error("Event not found");
  const { rows: deleted } = await pool.query(
    `DELETE FROM "CalendarEvent" WHERE id = $1 RETURNING ${COLUMNS}`,
    [eventId]
  );
  return deleted[0];
};

export const getEvent = async (eventId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM "CalendarEvent" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [eventId, userId]
  );
  return rows[0] || null;
};

export const getEventsInRange = async (
  userId: string,
  start: Date,
  end: Date,
  options?: { eventType?: string; tags?: string[] }
) => {
  const params: any[] = [userId, end, start];
  let extra = "";
  if (options?.eventType) {
    extra += ` AND "eventType" = $${params.length + 1}`;
    params.push(options.eventType);
  }
  if (options?.tags?.length) {
    extra += ` AND tags && $${params.length + 1}`;
    params.push(options.tags);
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM "CalendarEvent" WHERE "userId" = $1 AND "startTime" <= $2 AND ("endTime" >= $3 OR ("endTime" IS NULL AND "startTime" >= $3))${extra} ORDER BY "startTime" ASC`,
    params
  );
  return rows;
};

export const searchEvents = async (
  userId: string,
  query: string,
  options?: { limit?: number; eventType?: string }
) => {
  const params: any[] = [userId, `%${query}%`];
  let extra = "";
  if (options?.eventType) {
    extra += ` AND "eventType" = $${params.length + 1}`;
    params.push(options.eventType);
  }
  const limit = options?.limit || 50;
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM "CalendarEvent" WHERE "userId" = $1 AND title ILIKE $2${extra} ORDER BY "startTime" ASC LIMIT ${limit}`,
    params
  );
  return rows;
};

export const getEventStats = async (userId: string, from: Date, to: Date) => {
  const { rows: events } = await pool.query(
    `SELECT "eventType" FROM "CalendarEvent" WHERE "userId" = $1 AND "startTime" >= $2 AND "startTime" <= $3`,
    [userId, from, to]
  );
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
