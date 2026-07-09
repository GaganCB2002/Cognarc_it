import { prisma } from "../server";
import { geminiService } from "./gemini.service";
import { getLocalPath } from "./storage.service";

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

  public enqueue(type: JobType, payload: any) {
    const job: Job = {
      id: Math.random().toString(36).substring(7),
      type,
      payload,
      status: "PENDING"
    };
    this.queue.push(job);
    console.log(`[Queue] Job enqueued: ${type} (${job.id})`);
    
    // Start processing if not already
    this.processQueue();
    return job.id;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.some(j => j.status === "PENDING")) {
      const job = this.queue.find(j => j.status === "PENDING");
      if (!job) break;

      job.status = "PROCESSING";
      console.log(`[Queue] Processing job: ${job.type} (${job.id})`);

      try {
        await this.handleJob(job);
        job.status = "COMPLETED";
        console.log(`[Queue] Job completed: ${job.type} (${job.id})`);
      } catch (error: any) {
        job.status = "FAILED";
        job.error = error?.message || String(error);
        console.error(`[Queue] Job failed: ${job.type} (${job.id})`, error);
      }
    }

    this.isProcessing = false;
    
    // Optional: Clean up old completed/failed jobs to avoid memory leaks
    this.queue = this.queue.filter(j => j.status === "PENDING" || j.status === "PROCESSING");
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
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new Error("Document not found");

    const filePath = getLocalPath(document.storageKey);

    const geminiFile = await geminiService.uploadFile(filePath, document.mimeType, document.originalName);
    
    const aiResult = await geminiService.generateDocumentIntelligenceFromFile(geminiFile.uri);

    // Save to DB
    await prisma.documentIntelligence.upsert({
      where: { documentId },
      update: {
        summary: aiResult.summary,
        chapterSummaries: aiResult.chapterSummaries || [],
        keyConcepts: aiResult.keyConcepts || [],
        topics: aiResult.topics || [],
        interviewQuestions: aiResult.interviewQuestions || [],
        mcqs: aiResult.mcqs || [],
        flashcards: aiResult.flashcards || [],
        mindMapData: aiResult.mindMapData || [],
        revisionChecklist: aiResult.revisionChecklist || [],
      },
      create: {
        documentId,
        summary: aiResult.summary,
        chapterSummaries: aiResult.chapterSummaries || [],
        keyConcepts: aiResult.keyConcepts || [],
        topics: aiResult.topics || [],
        interviewQuestions: aiResult.interviewQuestions || [],
        mcqs: aiResult.mcqs || [],
        flashcards: aiResult.flashcards || [],
        mindMapData: aiResult.mindMapData || [],
        revisionChecklist: aiResult.revisionChecklist || [],
      }
    });
    
    // Automatically schedule a revision in Calendar
    const revisionDate = new Date();
    revisionDate.setDate(revisionDate.getDate() + 3); // Review in 3 days

    await prisma.calendarEvent.create({
      data: {
        userId: document.userId,
        title: `Review Document: ${document.originalName}`,
        description: `Automatic AI scheduled review. Summary: ${aiResult.summary}`,
        eventType: "REVISION",
        startTime: revisionDate,
        endTime: new Date(revisionDate.getTime() + 60 * 60 * 1000), // 1 hour
      }
    });

    // Cleanup gemini file
    await geminiService.deleteFile(geminiFile.name);
  }

  private async processNote(noteId: string) {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new Error("Note not found");

    const aiResult = await geminiService.generateNoteIntelligence(note.content);

    await prisma.noteIntelligence.upsert({
      where: { noteId },
      update: {
        summary: aiResult.summary,
        keywords: aiResult.keywords || [],
      },
      create: {
        noteId,
        summary: aiResult.summary,
        keywords: aiResult.keywords || [],
      }
    });
  }

  private async generateDailySummary(userId: string, date: Date) {
    // Collect activities for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [tasks, documents, notes, trackingSessions] = await Promise.all([
      prisma.task.findMany({ where: { userId, updatedAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.document.findMany({ where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.note.findMany({ where: { userId, updatedAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.trackingSession.findMany({ where: { userId, startTime: { gte: startOfDay, lte: endOfDay } } }),
    ]);

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

    await prisma.dailySummary.upsert({
      where: { userId_date: { userId, date: startOfDay } },
      update: {
        summary: aiResult.summary,
        recommendations: aiResult.recommendations || [],
        metrics: aiResult.metrics || {},
      },
      create: {
        userId,
        date: startOfDay,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations || [],
        metrics: aiResult.metrics || {},
      }
    });
  }
}

export const queueService = new JobQueue();
