import { Request, Response } from "express";
import { generateSummary, generateQuiz, chatWithTutor, chatWithCareerCoach } from "../services/ai.service";
import { pool } from "../lib/prisma";
import { getFile } from "../services/storage.service";
import { lifelog } from "../services/lifelog.service";

interface AuthRequest extends Request {
  user?: { userId: string };
}

export const getDocumentSummary = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const summaryData = await generateSummary(text);
    res.json({ success: true, data: summaryData });
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate summary" });
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const quizData = await generateQuiz(text);
    res.json({ success: true, data: quizData });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate quiz" });
  }
};

export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const conversationsResult = await pool.query(
      `SELECT *, (SELECT COUNT(*)::int FROM "AIMessage" WHERE "AIMessage"."conversationId" = "AIConversation"."id") AS "_count_messages" FROM "AIConversation" WHERE "userId" = $1 ORDER BY "updatedAt" DESC`,
      [userId]
    );
    const conversations = conversationsResult.rows.map((c: any) => ({
      ...c,
      _count: { messages: c._count_messages },
    }));

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ success: false, message: "Failed to list conversations" });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversationResult = await pool.query('SELECT * FROM "AIConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query('DELETE FROM "AIConversation" WHERE "id" = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to delete conversation" });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversationResult = await pool.query('SELECT * FROM "AIConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const messagesResult = await pool.query(
      'SELECT * FROM "AIMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [id]
    );
    conversation.messages = messagesResult.rows;

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to get conversation" });
  }
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { messages, conversationId, documentId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required" });
    }

    let conversation = null;
    if (conversationId) {
      const convResult = await pool.query('SELECT * FROM "AIConversation" WHERE "id" = $1 LIMIT 1', [conversationId]);
      conversation = convResult.rows[0];
      if (conversation) {
        const msgsResult = await pool.query('SELECT * FROM "AIMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC', [conversationId]);
        conversation.messages = msgsResult.rows;
      }
    }

    if (!conversation) {
      const newConvResult = await pool.query(
        'INSERT INTO "AIConversation" ("userId", "documentId", "title") VALUES ($1, $2, $3) RETURNING *',
        [userId, documentId, messages[0]?.content?.substring(0, 50) || "New Chat"]
      );
      conversation = newConvResult.rows[0];
      conversation.messages = [];
    }

    const newMessageContent = messages[messages.length - 1].content;

    await pool.query(
      'INSERT INTO "AIMessage" ("conversationId", "role", "content") VALUES ($1, $2, $3)',
      [conversation.id, "user", newMessageContent]
    );

    const history = conversation.messages.map((m: any) => ({
      role: m.role as "user" | "model",
      content: m.content
    }));
    
    let documentFileUri;
    let documentText = "";
    if (conversation.documentId) {
      const docResult = await pool.query('SELECT * FROM "Document" WHERE "id" = $1 LIMIT 1', [conversation.documentId]);
      const doc = docResult.rows[0];
      if (doc) {
        try {
          const buf = await getFile(doc.storageKey);
          if (buf && buf.length > 0 && doc.mimeType.startsWith("text/")) {
            documentText = buf.toString("utf-8").substring(0, 50000);
          } else if (buf && buf.length > 0) {
            documentText = `[Binary file: ${doc.originalName} (${doc.mimeType}, ${doc.size} bytes)]`;
          } else {
            documentText = `[Document: ${doc.originalName} (${doc.mimeType})]`;
          }
        } catch {
          documentText = `[Referenced document: ${doc.originalName}]`;
        }
      }
    }

    const contextMessage = documentText
      ? `The user is referring to the following document:\n"""\n${documentText}\n"""\n\nUser question: ${newMessageContent}`
      : newMessageContent;

    const aiResponseText = await chatWithTutor([...history, { role: "user", content: contextMessage }]);

    const aiMessageResult = await pool.query(
      'INSERT INTO "AIMessage" ("conversationId", "role", "content") VALUES ($1, $2, $3) RETURNING *',
      [conversation.id, "model", aiResponseText]
    );
    const aiMessage = aiMessageResult.rows[0];

    await lifelog.conversation(userId, "CHAT_MESSAGE", `Chat: ${newMessageContent.substring(0, 80)}`, {
      conversationId: conversation.id,
      userMessage: newMessageContent,
      aiMessage: aiResponseText,
      messageCount: conversation.messages.length + 2,
      documentId: conversation.documentId || undefined,
    });

    res.json({ success: true, data: { reply: aiResponseText, conversationId: conversation.id, messageId: aiMessage.id } });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ success: false, message: "Failed to process chat" });
  }
};

export const careerChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Messages array is required" });
    }

    const aiResponseText = await chatWithCareerCoach(messages);
    await lifelog.conversation(userId, "CAREER_CHAT", `Career chat: ${messages[messages.length - 1]?.content?.substring(0, 80) || ""}`, {
      messages,
      reply: aiResponseText,
    });
    res.json({ success: true, data: { reply: aiResponseText } });
  } catch (error) {
    console.error("Career chat error:", error);
    res.status(500).json({ success: false, message: "Failed to process career chat" });
  }
};

export const documentQA = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const file = req.file;
    const { question } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer as BlobPart], { type: file.mimetype }), file.originalname);
    formData.append("question", question);

    const pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${pythonServiceUrl}/api/doc-qa`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python AI service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Document QA error:", error);
    res.status(500).json({ success: false, message: "Failed to process Document QA via Python service" });
  }
};

export const audioAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer as BlobPart], { type: file.mimetype }), file.originalname);

    const pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${pythonServiceUrl}/api/audio-analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python AI service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Audio Analysis error:", error);
    res.status(500).json({ success: false, message: "Failed to process Audio Analysis via Python service" });
  }
};

export const videoAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer as BlobPart], { type: file.mimetype }), file.originalname);

    const pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${pythonServiceUrl}/api/video-analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python AI service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Video Analysis error:", error);
    res.status(500).json({ success: false, message: "Failed to process Video Analysis via Python service" });
  }
};
