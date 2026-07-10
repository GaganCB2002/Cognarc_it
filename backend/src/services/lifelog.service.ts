import fs from "fs";
import path from "path";

const LIFELOG_DIR = path.resolve(__dirname, "..", "..", "lifelogs");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getLogFilePath(userId: string): string {
  const date = new Date().toISOString().split("T")[0];
  const userDir = path.join(LIFELOG_DIR, userId);
  ensureDir(userDir);
  return path.join(userDir, `${date}.jsonl`);
}

export interface LifelogEntry {
  id: string;
  timestamp: string;
  userId: string;
  type: "TRANSACTION" | "CONVERSATION" | "TRACKING" | "FILE" | "AUTH" | "EXPORT" | "SYSTEM";
  action: string;
  summary: string;
  data: Record<string, unknown>;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

function writeEntry(entry: LifelogEntry): void {
  try {
    const filePath = getLogFilePath(entry.userId);
    fs.appendFileSync(filePath, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.error("[Lifelog] Write error:", err);
  }
}

export const lifelog = {
  transaction(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "TRANSACTION",
      action,
      summary,
      data,
    });
  },

  conversation(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "CONVERSATION",
      action,
      summary,
      data,
    });
  },

  tracking(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "TRACKING",
      action,
      summary,
      data,
    });
  },

  file(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "FILE",
      action,
      summary,
      data,
    });
  },

  auth(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "AUTH",
      action,
      summary,
      data,
    });
  },

  system(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "SYSTEM",
      action,
      summary,
      data,
    });
  },

  getAllEntries(userId: string, options: { type?: string; from?: string; to?: string; limit?: number; offset?: number } = {}): { entries: LifelogEntry[]; total: number } {
    const userDir = path.join(LIFELOG_DIR, userId);
    if (!fs.existsSync(userDir)) {
      return { entries: [], total: 0 };
    }

    const files = fs.readdirSync(userDir).filter(f => f.endsWith(".jsonl")).sort();
    const allEntries: LifelogEntry[] = [];

    for (const file of files) {
      const dateStr = file.replace(".jsonl", "");
      if (options.from && dateStr < options.from) continue;
      if (options.to && dateStr > options.to) continue;

      const filePath = path.join(userDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as LifelogEntry;
          if (options.type && entry.type !== options.type) continue;
          allEntries.push(entry);
        } catch {
          // skip malformed lines
        }
      }
    }

    // newest first
    allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const total = allEntries.length;
    const offset = options.offset || 0;
    const limit = options.limit || 200;
    const paginated = allEntries.slice(offset, offset + limit);

    return { entries: paginated, total };
  },

  getAvailableDates(userId: string): string[] {
    const userDir = path.join(LIFELOG_DIR, userId);
    if (!fs.existsSync(userDir)) return [];
    return fs.readdirSync(userDir)
      .filter(f => f.endsWith(".jsonl"))
      .map(f => f.replace(".jsonl", ""))
      .sort();
  },

  getDatabaseSize(userId: string): number {
    const userDir = path.join(LIFELOG_DIR, userId);
    if (!fs.existsSync(userDir)) return 0;
    const files = fs.readdirSync(userDir).filter(f => f.endsWith(".jsonl"));
    return files.reduce((size, file) => {
      try {
        return size + fs.statSync(path.join(userDir, file)).size;
      } catch {
        return size;
      }
    }, 0);
  },
};
