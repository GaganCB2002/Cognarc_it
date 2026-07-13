import { prisma } from "../lib/prisma";
import ExcelJS from "exceljs";
import { Buffer } from "buffer";

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
    const events = await prisma.activityEvent.findMany({
      where: {
        userId,
        ...(options.from || options.to ? {
          createdAt: {
            ...(options.from ? { gte: options.from } : {}),
            ...(options.to ? { lte: options.to } : {}),
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });
    data = events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      category: e.category,
      module: e.module || "",
      label: e.label || "",
      duration: e.duration,
      createdAt: e.createdAt.toISOString(),
    }));
    fileName = `activity-export-${Date.now()}`;
  } else if (entityType === "sessions") {
    const sessions = await prisma.trackingSession.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
    });
    data = sessions.map((s) => ({
      id: s.id,
      status: s.status,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() || "",
      durationMs: s.endTime
        ? s.endTime.getTime() - s.startTime.getTime() - s.totalPauseMs
        : 0,
      deviceName: s.deviceName || "",
      projectName: s.projectName || "",
    }));
    fileName = `sessions-export-${Date.now()}`;
  } else if (entityType === "calendar") {
    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
    });
    data = events.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString() || "",
      isAllDay: e.isAllDay,
      tags: e.tags.join("; "),
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

  await prisma.exportLog.create({
    data: {
      userId,
      format: format as any,
      entityType,
      fileName,
      fileSize: Buffer.byteLength(content, "utf-8"),
    },
  });

  return { content, fileName, mimeType };
};
