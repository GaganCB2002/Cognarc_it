import { pool } from "../lib/prisma";
import ExcelJS from "exceljs";

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(String(row[h] ?? ""))).join(","));
  }
  return lines.join("\n");
}

function toJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

export const exportData = async (
  userId: string,
  format: "CSV" | "JSON" | "EXCEL",
  entityType: string,
  options: { from?: Date; to?: Date } = {}
) => {
  let data: any[] = [];
  let fileName = "";

  if (entityType === "activity") {
    const params: any[] = [userId];
    let dateClause = "";
    if (options.from || options.to) {
      const clauses: string[] = [];
      if (options.from) { clauses.push(`"createdAt" >= $${params.length + 1}`); params.push(options.from); }
      if (options.to) { clauses.push(`"createdAt" <= $${params.length + 1}`); params.push(options.to); }
      dateClause = " AND " + clauses.join(" AND ");
    }
    const { rows: events } = await pool.query(
      `SELECT id, "eventType", category, module, label, duration, "createdAt" FROM "ActivityEvent" WHERE "userId" = $1${dateClause} ORDER BY "createdAt" DESC LIMIT 10000`,
      params
    );
    data = events.map((e: any) => ({
      id: e.id,
      eventType: e.eventType,
      category: e.category,
      module: e.module || "",
      label: e.label || "",
      duration: e.duration,
      createdAt: new Date(e.createdAt).toISOString(),
    }));
    fileName = `activity-export-${Date.now()}`;
  } else if (entityType === "sessions") {
    const { rows: sessions } = await pool.query(
      `SELECT id, status, "startTime", "endTime", "totalPauseMs", "deviceName", "projectName" FROM "TrackingSession" WHERE "userId" = $1 ORDER BY "startTime" DESC`,
      [userId]
    );
    data = sessions.map((s: any) => ({
      id: s.id,
      status: s.status,
      startTime: new Date(s.startTime).toISOString(),
      endTime: s.endTime ? new Date(s.endTime).toISOString() : "",
      durationMs: s.endTime
        ? new Date(s.endTime).getTime() - new Date(s.startTime).getTime() - s.totalPauseMs
        : 0,
      deviceName: s.deviceName || "",
      projectName: s.projectName || "",
    }));
    fileName = `sessions-export-${Date.now()}`;
  } else if (entityType === "calendar") {
    const { rows: events } = await pool.query(
      `SELECT id, title, "eventType", "startTime", "endTime", "isAllDay", tags, location FROM "CalendarEvent" WHERE "userId" = $1 ORDER BY "startTime" DESC`,
      [userId]
    );
    data = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      startTime: new Date(e.startTime).toISOString(),
      endTime: e.endTime ? new Date(e.endTime).toISOString() : "",
      isAllDay: e.isAllDay,
      tags: (e.tags || []).join("; "),
      location: e.location || "",
    }));
    fileName = `calendar-export-${Date.now()}`;
  } else {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  let content: string;
  let mimeType: string;
  let ext: string;

  if (format === "CSV") {
    content = toCsv(data);
    mimeType = "text/csv";
    ext = "csv";
  } else if (format === "JSON") {
    content = toJson(data);
    mimeType = "application/json";
    ext = "json";
  } else {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(entityType);
    if (data.length > 0) {
      sheet.columns = Object.keys(data[0]).map((k) => ({ header: k, key: k }));
      data.forEach((row) => sheet.addRow(row));
    }
    const workbookBuf = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    content = workbookBuf.toString("base64");
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    ext = "xlsx";
  }

  fileName = `${fileName}.${ext}`;

  await pool.query(
    `INSERT INTO "ExportLog" ("userId", format, "entityType", "fileName", "fileSize") VALUES ($1, $2, $3, $4, $5)`,
    [userId, format, entityType, fileName, Buffer.byteLength(content, "utf-8")]
  );

  return { content, fileName, mimeType };
};
