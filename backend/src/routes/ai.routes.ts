import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDocumentSummary, getQuiz, chat, listConversations, deleteConversation, getConversation, queryProject } from "../controllers/ai.controller";

const router = Router();

router.post("/summary", authenticate, getDocumentSummary);
router.post("/quiz", authenticate, getQuiz);
router.post("/chat", authenticate, chat);

// Conversation management
router.get("/conversations", authenticate, listConversations);
router.get("/conversations/:id", authenticate, getConversation);
router.delete("/conversations/:id", authenticate, deleteConversation);

// RAG-powered project query (high accuracy, uses actual source code)
router.post("/query-project", authenticate, queryProject);

export default router;
