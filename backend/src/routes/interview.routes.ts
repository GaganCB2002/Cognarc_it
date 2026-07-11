import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  askAI,
  generateQuestions,
  saveQuestion,
  listQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getCompanyQuestions,
  saveCompanyQuestion,
  generateMCQ,
  listMCQs,
  attemptMCQ,
  getMCQResult,
  generateCodingProblem,
  listCodingProblems,
  getCodingProblem,
  submitCoding,
  aiCodeReview,
  startMockInterview,
  answerMockQuestion,
  getMockInterviewResult,
  generateFlowDiagram,
  generateNotes,
  listNotes,
  saveNote,
  deleteNote,
  toggleBookmark,
  listBookmarks,
  saveItem,
  listSavedItems,
  deleteSavedItem,
  search,
  getAnalytics,
  getRecommendations,
  getProgress,
  listInterviewConversations as listConversations,
  getInterviewConversation as getConversation,
  deleteInterviewConversation as deleteConversation,
  pinConversation,
  exportConversation,
} from "../controllers/interview.controller";

const router = Router();

// Ask AI
router.post("/ask", authenticate, askAI);

// Questions CRUD
router.post("/questions/generate", authenticate, generateQuestions);
router.post("/questions", authenticate, saveQuestion);
router.get("/questions", authenticate, listQuestions);
router.get("/questions/:id", authenticate, getQuestion);
router.put("/questions/:id", authenticate, updateQuestion);
router.delete("/questions/:id", authenticate, deleteQuestion);

// Company questions
router.get("/company/:company", authenticate, getCompanyQuestions);
router.post("/company", authenticate, saveCompanyQuestion);

// MCQ
router.post("/mcq/generate", authenticate, generateMCQ);
router.get("/mcq", authenticate, listMCQs);
router.post("/mcq/attempt", authenticate, attemptMCQ);
router.get("/mcq/:id/result", authenticate, getMCQResult);

// Coding Problems
router.post("/coding/generate", authenticate, generateCodingProblem);
router.get("/coding", authenticate, listCodingProblems);
router.get("/coding/:id", authenticate, getCodingProblem);
router.post("/coding/:id/submit", authenticate, submitCoding);
router.post("/coding/review", authenticate, aiCodeReview);

// Mock Interview
router.post("/mock/start", authenticate, startMockInterview);
router.post("/mock/:sessionId/answer", authenticate, answerMockQuestion);
router.get("/mock/:sessionId/result", authenticate, getMockInterviewResult);

// Flow Diagram
router.post("/diagram", authenticate, generateFlowDiagram);

// Notes
router.post("/notes/generate", authenticate, generateNotes);
router.get("/notes", authenticate, listNotes);
router.post("/notes", authenticate, saveNote);
router.delete("/notes/:id", authenticate, deleteNote);

// Bookmarks
router.post("/bookmarks/toggle", authenticate, toggleBookmark);
router.get("/bookmarks", authenticate, listBookmarks);

// Saved Items
router.post("/saved", authenticate, saveItem);
router.get("/saved", authenticate, listSavedItems);
router.delete("/saved/:id", authenticate, deleteSavedItem);

// Search
router.get("/search", authenticate, search);

// Analytics, Recommendations, Progress
router.get("/analytics", authenticate, getAnalytics);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/progress", authenticate, getProgress);

// Conversations
router.get("/conversations", authenticate, listConversations);
router.get("/conversations/:id", authenticate, getConversation);
router.delete("/conversations/:id", authenticate, deleteConversation);
router.post("/conversations/:id/pin", authenticate, pinConversation);
router.get("/conversations/:id/export", authenticate, exportConversation);

export default router;
