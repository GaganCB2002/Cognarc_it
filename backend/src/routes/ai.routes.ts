import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDocumentSummary, getQuiz, chat, careerChat, listConversations, deleteConversation, getConversation } from "../controllers/ai.controller";

const router = Router();

router.post("/summary", authenticate, getDocumentSummary);
router.post("/quiz", authenticate, getQuiz);
router.post("/chat", authenticate, chat);

// Conversation management
router.get("/conversations", authenticate, listConversations);
router.get("/conversations/:id", authenticate, getConversation);
router.delete("/conversations/:id", authenticate, deleteConversation);

// AI Career Coach
router.post("/career-chat", authenticate, careerChat);

export default router;
