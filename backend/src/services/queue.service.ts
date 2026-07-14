import { pool } from "../lib/prisma";
import { geminiService } from "./gemini.service";
import { getLocalPath, getFile as getStorageFile } from "./storage.service";
import fs from "fs/promises";
import path from "path";

type JobType = "AI_PROCESS_DOCUMENT" | "AI_PROCESS_NOTE" | "AI_GENERATE_DAILY_SUMMARY";

interface Job {
  id: string;
  type: JobType;
  payload: any;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error?: string;
}

class JobQueue {
  private queue: Job[] = [];
  private isProcessing = false;

  public async enqueue(type: JobType, payload: any) {
    const job: Job = {
      id: crypto.randomUUID(),
      type,
      payload,
      status: "PENDING"
    };
    this.queue.push(job);
    console.log(`[Queue] Job enqueued: ${type} (${job.id})`);
    
    // Start processing if not already (DO NOT AWAIT to avoid blocking requests)
    this.processNext().catch(err => console.error(`[Queue] Process loop failed:`, err));
    return job.id;
  }

  private async processNext() {
    if (this.isProcessing) return;
    const job = this.queue.find((j) => j.status === "PENDING");
    if (!job) return;

    this.isProcessing = true;
    job.status = "PROCESSING";
    console.log(`[Queue] Processing job: ${job.type} (${job.id})`);

    try {
      await this.handleJob(job);
      job.status = "COMPLETED";
      console.log(`[Queue] Job completed successfully: ${job.type} (${job.id})`);
    } catch (error: any) {
      job.status = "FAILED";
      job.error = error?.message || String(error);
      console.error(`[Queue] Job failed: ${job.type} (${job.id})`, error);
    }

    this.isProcessing = false;
    this.processNext();
  }

  private async handleJob(job: Job) {
    switch (job.type) {
      case "AI_PROCESS_DOCUMENT":
        await this.processDocument(job.payload.documentId);
        break;
      case "AI_PROCESS_NOTE":
        await this.processNote(job.payload.noteId);
        break;
      case "AI_GENERATE_DAILY_SUMMARY":
        await this.generateDailySummary(job.payload.userId, job.payload.date);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private async processDocument(documentId: string) {
    const { rows: docs } = await pool.query(`SELECT * FROM "Document" WHERE id = $1`, [documentId]);
    const document = docs[0];
    if (!document) throw new Error("Document not found");

    let tempPath = "";
    let isTemp = false;

    if (document.storageProvider === "LOCAL") {
      tempPath = getLocalPath(document.storageKey);
    } else {
      const buffer = await getStorageFile(document.storageKey);
      if (!buffer) throw new Error("Failed to retrieve file from storage provider");

      const tempDir = path.join(process.cwd(), "uploads", "temp");
      await fs.mkdir(tempDir, { recursive: true });
      tempPath = path.join(tempDir, `${document.id}_${document.originalName}`);
      await fs.writeFile(tempPath, buffer);
      isTemp = true;
    }

    let geminiFile;
    try {
      geminiFile = await geminiService.uploadFile(tempPath, document.mimeType, document.originalName);
      
      const aiResult = await geminiService.generateDocumentIntelligenceFromFile(geminiFile.uri, document.mimeType);

      await pool.query(
        `INSERT INTO "DocumentIntelligence" ("documentId", summary, "chapterSummaries", "keyConcepts", topics, "interviewQuestions", mcqs, flashcards, "mindMapData", "revisionChecklist") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT ("documentId") DO UPDATE SET summary = EXCLUDED.summary, "chapterSummaries" = EXCLUDED."chapterSummaries", "keyConcepts" = EXCLUDED."keyConcepts", topics = EXCLUDED.topics, "interviewQuestions" = EXCLUDED."interviewQuestions", mcqs = EXCLUDED.mcqs, flashcards = EXCLUDED.flashcards, "mindMapData" = EXCLUDED."mindMapData", "revisionChecklist" = EXCLUDED."revisionChecklist"`,
        [documentId, aiResult.summary, aiResult.chapterSummaries || [], aiResult.keyConcepts || [], aiResult.topics || [], aiResult.interviewQuestions || [], aiResult.mcqs || [], aiResult.flashcards || [], aiResult.mindMapData || [], aiResult.revisionChecklist || []]
      );
      
      // Automatically schedule a revision in Calendar
      const revisionDate = new Date();
      revisionDate.setDate(revisionDate.getDate() + 3); // Review in 3 days

      await pool.query(
        `INSERT INTO "CalendarEvent" ("userId", title, description, "eventType", "startTime", "endTime") VALUES ($1,$2,$3,$4,$5,$6)`,
        [document.userId, `Review Document: ${document.originalName}`, `Automatic AI scheduled review. Summary: ${aiResult.summary}`, "REVISION", revisionDate, new Date(revisionDate.getTime() + 60 * 60 * 1000)]
      );
    } finally {
      // Cleanup temp files
      if (isTemp && tempPath) {
        await fs.unlink(tempPath).catch(() => {});
      }
      // Cleanup Gemini Files API resources to save quota/space
      if (geminiFile?.name) {
        await geminiService.deleteFile(geminiFile.name).catch(() => {});
      }
    }
  }

  private async processNote(noteId: string) {
    const { rows: notes } = await pool.query(`SELECT * FROM "Note" WHERE id = $1`, [noteId]);
    const note = notes[0];
    if (!note) throw new Error("Note not found");

    const aiResult = await geminiService.generateNoteIntelligence(note.content);

    await pool.query(
      `INSERT INTO "NoteIntelligence" ("noteId", summary, keywords) VALUES ($1,$2,$3) ON CONFLICT ("noteId") DO UPDATE SET summary = EXCLUDED.summary, keywords = EXCLUDED.keywords`,
      [noteId, aiResult.summary, aiResult.keywords || []]
    );
  }

  private async generateDailySummary(userId: string, date: Date) {
    // Collect activities for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [tasksRes, docsRes, notesRes, sessionsRes] = await Promise.all([
      pool.query(`SELECT * FROM "Task" WHERE "userId" = $1 AND "updatedAt" >= $2 AND "updatedAt" <= $3`, [userId, startOfDay, endOfDay]),
      pool.query(`SELECT * FROM "Document" WHERE "userId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3`, [userId, startOfDay, endOfDay]),
      pool.query(`SELECT * FROM "Note" WHERE "userId" = $1 AND "updatedAt" >= $2 AND "updatedAt" <= $3`, [userId, startOfDay, endOfDay]),
      pool.query(`SELECT * FROM "TrackingSession" WHERE "userId" = $1 AND "startTime" >= $2 AND "startTime" <= $3`, [userId, startOfDay, endOfDay]),
    ]);
    const tasks = tasksRes.rows;
    const documents = docsRes.rows;
    const notes = notesRes.rows;
    const trackingSessions = sessionsRes.rows;

    const activities = {
      completedTasks: tasks.filter(t => t.status === "DONE").map(t => t.title),
      newTasks: tasks.filter(t => t.status !== "DONE").map(t => t.title),
      documentsUploaded: documents.map(d => d.originalName),
      notesEdited: notes.map(n => n.title),
      totalFocusTimeMs: trackingSessions.reduce((acc, s) => {
        if (s.endTime) return acc + (s.endTime.getTime() - s.startTime.getTime() - s.totalPauseMs);
        return acc;
      }, 0)
    };

    const aiResult = await geminiService.generateDailySummary(activities);

    await pool.query(
      `INSERT INTO "DailySummary" ("userId", date, summary, recommendations, metrics) VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("userId", date) DO UPDATE SET summary = EXCLUDED.summary, recommendations = EXCLUDED.recommendations, metrics = EXCLUDED.metrics`,
      [userId, startOfDay, aiResult.summary, aiResult.recommendations || [], aiResult.metrics || {}]
    );
  }
}

export const queueService = new JobQueue();
