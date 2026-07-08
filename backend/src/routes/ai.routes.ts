import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getDocumentSummary, getQuiz, chat } from "../controllers/ai.controller";

const router = Router();

router.post("/summary", authenticate, getDocumentSummary);
router.post("/quiz", authenticate, getQuiz);
router.post("/chat", authenticate, chat);

export default router;
