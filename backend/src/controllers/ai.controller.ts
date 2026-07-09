import { Request, Response } from "express";
import { generateSummary, generateQuiz, chatWithTutor, chatWithCareerCoach } from "../services/ai.service";
import { prisma } from "../server";
import { projectIndexer } from "../services/project-indexer.service";
import { geminiService } from "../services/gemini.service";
import { agentService } from "../services/agent.service";
import { PROJECT_SYSTEM_CONTEXT } from "../data/project-context";

interface AuthRequest extends Request {
  user?: { userId: string };
}

export const getDocumentSummary = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const summaryData = await generateSummary(text);
    res.json(summaryData);
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const quizData = await generateQuiz(text);
    res.json(quizData);
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });

    res.json(conversations);
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = req.params.id as string;
    const conversation = await prisma.aIConversation.findUnique({ where: { id } });

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    await prisma.aIConversation.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = req.params.id as string;
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    res.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { messages, conversationId, documentId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: { messages: true }
      });
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId,
          documentId,
          title: messages[0]?.content?.substring(0, 50) || "New Chat",
        },
        include: { messages: true }
      });
    }

    // Determine the newest message
    const newMessageContent = messages[messages.length - 1].content;

    // Save user message to DB
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: newMessageContent
      }
    });

    // Reconstruct history for Gemini
    const history = conversation.messages.map(m => ({
      role: m.role as "user" | "model",
      content: m.content
    }));
    
    // Check if we need to supply a document URI
    let documentFileUri;
    if (conversation.documentId) {
       const doc = await prisma.document.findUnique({ where: { id: conversation.documentId } });
       // We can only use the URI if it was uploaded to Gemini, but here we might just pass text if we can't easily get the Gemini URI.
       // The geminiFileUri is temporary inside queueService. For true continuous chat over a document,
       // we should either extract text and put it in the prompt, or rely on a stored gemini URI.
       // Since Gemini File API files expire after 48h, we might not always have it.
       // For now, let's keep it simple and skip sending the whole document unless we implement a proper retrieval step.
    }

    // Call AI
    const aiResponseText = await chatWithTutor([...history, { role: "user", content: newMessageContent }]);

    // Save AI message to DB
    const aiMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "model",
        content: aiResponseText
      }
    });

    res.json({ reply: aiResponseText, conversationId: conversation.id, messageId: aiMessage.id });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
};

export const agentChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const reply = await agentService.processMessage(messages, userId);
    res.json({ reply });
  } catch (error) {
    console.error("Agent chat error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

export const careerChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const aiResponseText = await chatWithCareerCoach(messages);
    res.json({ reply: aiResponseText });
  } catch (error) {
    console.error("Career chat error:", error);
    res.status(500).json({ error: "Failed to process career chat" });
  }
};

export const queryProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { question, conversationId } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    // Step 1: Search the project index for relevant files
    const relevantContext = projectIndexer.getRelevantContext(question, 5, 60000);

    // Step 2: Build the augmented prompt
    const contextPrompt = relevantContext
      ? `Here is the actual source code from the project that is relevant to the question:\n${relevantContext}\n\n---\nAnswer the user's question based on the source code above. If the code does not contain the answer, use your general knowledge of the project described in the system context. Always cite specific file paths when referencing code.`
      : `Answer the user's question based on your knowledge of the project described in the system context. Always cite specific file paths when referencing code.`;

    // Step 3: Save to conversation if provided
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: { messages: true }
      });
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId,
          title: question.substring(0, 50),
        },
        include: { messages: true }
      });
    }

    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "user", content: question }
    });

    // Step 4: Call Gemini with project context + retrieved code
    const fullPrompt = `${contextPrompt}\n\nUser Question: ${question}`;
    const answer = await geminiService.generateWithContext(fullPrompt, PROJECT_SYSTEM_CONTEXT);

    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "model", content: answer }
    });

    // Update conversation title if it's the first message
    if (conversation.title === "New Chat") {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { title: question.substring(0, 50) }
      });
    }

    res.json({ reply: answer, conversationId: conversation.id });
  } catch (error) {
    console.error("Project query error:", error);
    res.status(500).json({ error: "Failed to process project query" });
  }
};
