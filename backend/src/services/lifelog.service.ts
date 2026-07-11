import fs from "fs";
import path from "path";

const LIFELOG_DIR = path.resolve(__dirname, "..", "..", "lifelogs");

async function ensureDir(dir: string) {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("[Lifelog] ensureDir error:", err);
  }
}

function getLogFilePath(userId: string): string {
  const date = new Date().toISOString().split("T")[0];
  return path.join(LIFELOG_DIR, userId, `${date}.jsonl`);
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

async function writeEntry(entry: LifelogEntry): Promise<void> {
  try {
    const filePath = getLogFilePath(entry.userId);
    await ensureDir(path.dirname(filePath));
    await fs.promises.appendFile(filePath, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.error("[Lifelog] Write error:", err);
  }
}

export const lifelog = {
  async transaction(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "TRANSACTION",
      action,
      summary,
      data,
    });
  },

  async conversation(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "CONVERSATION",
      action,
      summary,
      data,
    });
  },

  async tracking(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "TRACKING",
      action,
      summary,
      data,
    });
  },

  async file(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "FILE",
      action,
      summary,
      data,
    });
  },

  async auth(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "AUTH",
      action,
      summary,
      data,
    });
  },

  async system(userId: string, action: string, summary: string, data: Record<string, unknown> = {}) {
    await writeEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      type: "SYSTEM",
      action,
      summary,
      data,
    });
  },

  async getAllEntries(userId: string, options: { type?: string; from?: string; to?: string; limit?: number; offset?: number } = {}): Promise<{ entries: LifelogEntry[]; total: number }> {
    try {
      const userDir = path.join(LIFELOG_DIR, userId);
      try {
        await fs.promises.access(userDir);
      } catch {
        return { entries: [], total: 0 };
      }

      const files = (await fs.promises.readdir(userDir)).filter(f => f.endsWith(".jsonl")).sort();
      const allEntries: LifelogEntry[] = [];

      for (const file of files) {
        const dateStr = file.replace(".jsonl", "");
        if (options.from && dateStr < options.from) continue;
        if (options.to && dateStr > options.to) continue;

        const filePath = path.join(userDir, file);
        const content = await fs.promises.readFile(filePath, "utf-8");
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

      allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const total = allEntries.length;
      const offset = options.offset || 0;
      const limit = options.limit || 200;
      const paginated = allEntries.slice(offset, offset + limit);

      return { entries: paginated, total };
    } catch (err) {
      console.error("[Lifelog] getAllEntries error:", err);
      return { entries: [], total: 0 };
    }
  },

  async getAvailableDates(userId: string): Promise<string[]> {
    try {
      const userDir = path.join(LIFELOG_DIR, userId);
      try {
        await fs.promises.access(userDir);
      } catch {
        return [];
      }
      return (await fs.promises.readdir(userDir))
        .filter(f => f.endsWith(".jsonl"))
        .map(f => f.replace(".jsonl", ""))
        .sort();
    } catch (err) {
      console.error("[Lifelog] getAvailableDates error:", err);
      return [];
    }
  },

  async getDatabaseSize(userId: string): Promise<number> {
    try {
      const userDir = path.join(LIFELOG_DIR, userId);
      try {
        await fs.promises.access(userDir);
      } catch {
        return 0;
      }
      const files = (await fs.promises.readdir(userDir)).filter(f => f.endsWith(".jsonl"));
      let size = 0;
      for (const file of files) {
        try {
          const stat = await fs.promises.stat(path.join(userDir, file));
          size += stat.size;
        } catch {
          // skip file stat errors
        }
      }
      return size;
    } catch (err) {
      console.error("[Lifelog] getDatabaseSize error:", err);
      return 0;
    }
  },
};
