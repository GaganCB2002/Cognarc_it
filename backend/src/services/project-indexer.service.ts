import fs from "fs";
import path from "path";

export interface IndexedFile {
  relativePath: string;
  language: string;
  content: string;
  lines: number;
}

class ProjectIndexer {
  private index: IndexedFile[] = [];
  private initialized = false;

  private EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".prisma", ".json", ".css",
  ]);

  private EXCLUDE_DIRS = new Set([
    "node_modules", ".next", "dist", "build", ".git",
    "uploads", "public", ".turbo", "coverage",
  ]);

  async initialize(projectRoot: string, log = true) {
    if (this.initialized) return;

    const dirs = [
      path.join(projectRoot, "backend", "src"),
      path.join(projectRoot, "backend", "prisma"),
      path.join(projectRoot, "frontend", "src"),
      path.join(projectRoot, "extension"),
      path.join(projectRoot, "database"),
    ];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        await this.scanDir(dir, projectRoot);
      }
    }

    this.initialized = true;
    if (log) {
      console.log(`Project indexer: indexed ${this.index.length} files`);
    }
  }

  private async scanDir(dirPath: string, projectRoot: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!this.EXCLUDE_DIRS.has(entry.name)) {
          await this.scanDir(fullPath, projectRoot);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (this.EXTENSIONS.has(ext)) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const relativePath = path.relative(projectRoot, fullPath);
            const langMap: Record<string, string> = {
              ".ts": "TypeScript",
              ".tsx": "TypeScript React",
              ".js": "JavaScript",
              ".jsx": "JavaScript React",
              ".prisma": "Prisma",
              ".json": "JSON",
              ".css": "CSS",
            };
            this.index.push({
              relativePath,
              language: langMap[ext] || ext,
              content,
              lines: content.split("\n").length,
            });
          } catch {
            // skip unreadable files
          }
        }
      }
    }
  }

  search(query: string, maxResults = 5): IndexedFile[] {
    const q = query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const scored = this.index.map((file) => {
      const lowerPath = file.relativePath.toLowerCase();
      const lowerContent = file.content.toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (lowerPath.includes(term)) score += 10;
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        const matches = (lowerContent.match(regex) || []).length;
        score += matches;
      }

      return { file, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored
      .filter((s) => s.score > 0)
      .slice(0, maxResults)
      .map((s) => s.file);
  }

  getRelevantContext(query: string, maxFiles = 5, maxChars = 50000): string {
    const results = this.search(query, maxFiles);
    if (results.length === 0) return "";

    let context = "";
    for (const file of results) {
      const header = `\n===== FILE: ${file.relativePath} (${file.language}, ${file.lines} lines) =====\n`;
      const remaining = maxChars - context.length - header.length - 200;
      if (remaining <= 0) break;
      context += header;
      context += file.content.slice(0, remaining) + "\n";
    }
    return context;
  }

  getStats() {
    const byType: Record<string, number> = {};
    for (const f of this.index) {
      byType[f.language] = (byType[f.language] || 0) + 1;
    }
    return {
      totalFiles: this.index.length,
      totalLines: this.index.reduce((a, f) => a + f.lines, 0),
      byType,
    };
  }
}

export const projectIndexer = new ProjectIndexer();
