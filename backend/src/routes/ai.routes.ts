import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDocumentSummary, getQuiz, chat, careerChat, listConversations, deleteConversation, getConversation, documentQA, audioAnalysis, videoAnalysis } from "../controllers/ai.controller";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/summary", authenticate, getDocumentSummary);
router.post("/quiz", authenticate, getQuiz);
router.post("/chat", authenticate, chat);
router.post("/doc-qa", authenticate, upload.single("file"), documentQA);
router.post("/audio-analyze", authenticate, upload.single("file"), audioAnalysis);
router.post("/video-analyze", authenticate, upload.single("file"), videoAnalysis);

// Conversation management
router.get("/conversations", authenticate, listConversations);
router.get("/conversations/:id", authenticate, getConversation);
router.delete("/conversations/:id", authenticate, deleteConversation);

// AI Career Coach
router.post("/career-chat", authenticate, careerChat);

export default router;
