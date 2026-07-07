import { Router } from "express";
import { getDocumentSummary, getQuiz, chat } from "../controllers/ai.controller";

const router = Router();

router.post("/summary", getDocumentSummary);
router.post("/quiz", getQuiz);
router.post("/chat", chat);

export default router;
