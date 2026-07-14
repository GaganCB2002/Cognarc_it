import { Request, Response } from "express";
import { interviewService } from "../services/interview.service";
import { geminiService } from "../services/gemini.service";
import { prisma } from "../lib/prisma";
import { lifelog } from "../services/lifelog.service";

interface AuthRequest extends Request {
  user?: { userId: string };
}

function paginate(query: any, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function str(val: any): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0];
  return undefined;
}

// ─── Ask AI ──────────────────────────────────────────────────────────────────

export const askAI = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { question, conversationId, history } = req.body;
    if (!question) return res.status(400).json({ success: false, message: "Question is required" });

    let conversation: any;
    if (conversationId) {
      conversation = await prisma.aIInterviewConversation.findUnique({
        where: { id: conversationId },
        include: { messages: true },
      });
    }

    if (!conversation) {
      conversation = await prisma.aIInterviewConversation.create({
        data: { userId, title: question.substring(0, 50), type: "qa" },
        include: { messages: true },
      });
    }

    await prisma.aIInterviewMessage.create({
      data: { conversationId: conversation.id, role: "user", content: question },
    });

    const result = await interviewService.askAI(question, history || [], userId);

    const responseText = JSON.stringify(result);
    await prisma.aIInterviewMessage.create({
      data: { conversationId: conversation.id, role: "model", content: responseText },
    });

    if (conversation.title === "New Interview Chat") {
      await prisma.aIInterviewConversation.update({
        where: { id: conversation.id },
        data: { title: question.substring(0, 50) },
      });
    }

    await lifelog.conversation(userId, "INTERVIEW_ASK", `Interview Q&A: ${question.substring(0, 80)}`, {
      conversationId: conversation.id,
      question,
    });

    res.json({ success: true, data: { result, conversationId: conversation.id } });
  } catch (error) {
    console.error("Ask AI error:", error);
    res.status(500).json({ success: false, message: "Failed to process question" });
  }
};

// ─── Generate Questions ──────────────────────────────────────────────────────

export const generateQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { category, difficulty, count, type } = req.body;
    if (!category) return res.status(400).json({ success: false, message: "Category is required" });

    const result = await interviewService.generateInterviewQuestions(
      category,
      difficulty || "Intermediate",
      Math.min(count || 5, 20),
      type || "mixed"
    );

    await lifelog.conversation(userId, "GENERATE_QUESTIONS", `Generated ${result.questions?.length || 0} questions for ${category}`, {
      category,
      difficulty,
      count: result.questions?.length || 0,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Generate questions error:", error);
    res.status(500).json({ success: false, message: "Failed to generate questions" });
  }
};

// ─── CRUD Questions ──────────────────────────────────────────────────────────

export const saveQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { question, answer, explanation, difficulty, category, type, tags } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: "Question and answer are required" });

    const created = await prisma.interviewQuestion.create({
      data: {
        userId,
        question,
        answer,
        explanation,
        difficulty: difficulty || "Intermediate",
        category: category || "General",
        type: type || "Theory",
        tags: tags || [],
      },
    });

    await lifelog.conversation(userId, "SAVE_QUESTION", `Saved question: ${question.substring(0, 80)}`, {
      questionId: created.id,
      category,
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error("Save question error:", error);
    res.status(500).json({ success: false, message: "Failed to save question" });
  }
};

export const listQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { page, limit, skip } = paginate(req.query);
    const category = str(req.query.category);
    const difficulty = str(req.query.difficulty);
    const search = str(req.query.search);

    const where: any = { userId };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" as const } },
        { answer: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.interviewQuestion.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.interviewQuestion.count({ where }),
    ]);

    res.json({ success: true, data: { questions, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("List questions error:", error);
    res.status(500).json({ success: false, message: "Failed to list questions" });
  }
};

export const getQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const question = await prisma.interviewQuestion.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    if (question.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    res.json({ success: true, data: question });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ success: false, message: "Failed to get question" });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const existing = await prisma.interviewQuestion.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Question not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const { question, answer, explanation, difficulty, category, type, tags } = req.body;
    const updated = await prisma.interviewQuestion.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(explanation !== undefined && { explanation }),
        ...(difficulty !== undefined && { difficulty }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(tags !== undefined && { tags }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({ success: false, message: "Failed to update question" });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const existing = await prisma.interviewQuestion.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Question not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await prisma.interviewQuestion.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ success: false, message: "Failed to delete question" });
  }
};

// ─── Company Questions ──────────────────────────────────────────────────────

export const getCompanyQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const company = req.params.company as string;
    const role = str(req.query.role);
    const experience = str(req.query.experience);
    const difficulty = str(req.query.difficulty);

    const where: any = { userId, company };
    if (role) where.role = role;
    if (experience) where.experience = experience;
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.companyQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: questions });
  } catch (error) {
    console.error("Get company questions error:", error);
    res.status(500).json({ success: false, message: "Failed to get company questions" });
  }
};

export const saveCompanyQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { company, role, experience, question, answer, difficulty, technology } = req.body;
    if (!company || !question || !answer) {
      return res.status(400).json({ success: false, message: "Company, question, and answer are required" });
    }

    const created = await prisma.companyQuestion.create({
      data: {
        userId,
        company,
        role,
        experience,
        question,
        answer,
        difficulty: difficulty || "Intermediate",
        technology: technology || [],
        tags: [],
      },
    });

    await lifelog.conversation(userId, "SAVE_COMPANY_QUESTION", `Saved ${company} question`, {
      company,
      role,
      questionId: created.id,
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error("Save company question error:", error);
    res.status(500).json({ success: false, message: "Failed to save company question" });
  }
};

// ─── MCQ ─────────────────────────────────────────────────────────────────────

export const generateMCQ = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { category, count, difficulty } = req.body;
    if (!category) return res.status(400).json({ success: false, message: "Category is required" });

    const result = await interviewService.generateMCQs(category, Math.min(count || 5, 20), difficulty || "Medium");

    const savedMcqs: any[] = [];
    const mcqs = (result as any).mcqs || [];
    for (const mcq of mcqs) {
      const saved = await prisma.mCQ.create({
        data: {
          userId,
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          category,
          topic: mcq.topic,
          difficulty: mcq.difficulty || difficulty || "Medium",
          tags: [],
        },
      });
      savedMcqs.push(saved);
    }

    await lifelog.conversation(userId, "GENERATE_MCQ", `Generated ${savedMcqs.length} MCQs for ${category}`, { category, count: savedMcqs.length });

    res.json({ success: true, data: { mcqs: savedMcqs } });
  } catch (error) {
    console.error("Generate MCQ error:", error);
    res.status(500).json({ success: false, message: "Failed to generate MCQs" });
  }
};

export const listMCQs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { page, limit, skip } = paginate(req.query);
    const category = str(req.query.category);
    const difficulty = str(req.query.difficulty);

    const where: any = { userId };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const [mcqs, total] = await Promise.all([
      prisma.mCQ.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.mCQ.count({ where }),
    ]);

    res.json({ success: true, data: { mcqs, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("List MCQs error:", error);
    res.status(500).json({ success: false, message: "Failed to list MCQs" });
  }
};

export const attemptMCQ = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { mcqId, selectedAnswer, timeTaken } = req.body;
    if (!mcqId || selectedAnswer === undefined) {
      return res.status(400).json({ success: false, message: "mcqId and selectedAnswer are required" });
    }

    const mcq = await prisma.mCQ.findUnique({ where: { id: mcqId } });
    if (!mcq) return res.status(404).json({ success: false, message: "MCQ not found" });

    const isCorrect = selectedAnswer === mcq.correctAnswer;
    const attempt = await prisma.mCQAttempt.create({
      data: { userId, mcqId, selectedAnswer, isCorrect, timeTaken },
    });

    const evaluation = await interviewService.evaluateMCQAnswer(mcq.question, String(selectedAnswer), String(mcq.correctAnswer));

    // Update progress
    await prisma.userInterviewProgress.upsert({
      where: { userId },
      update: {
        mcqsCompleted: { increment: 1 },
        lastActiveDate: new Date(),
      },
      create: {
        userId,
        mcqsCompleted: 1,
        lastActiveDate: new Date(),
      },
    });

    await lifelog.conversation(userId, "MCQ_ATTEMPT", `MCQ attempt: ${isCorrect ? "Correct" : "Wrong"}`, {
      mcqId,
      isCorrect,
      timeTaken,
    });

    res.json({ success: true, data: { attempt, isCorrect, evaluation } });
  } catch (error) {
    console.error("Attempt MCQ error:", error);
    res.status(500).json({ success: false, message: "Failed to record MCQ attempt" });
  }
};

export const getMCQResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const mcq = await prisma.mCQ.findUnique({
      where: { id },
      include: { attempts: { where: { userId }, orderBy: { createdAt: "desc" } } },
    });

    if (!mcq) return res.status(404).json({ success: false, message: "MCQ not found" });

    res.json({ success: true, data: mcq });
  } catch (error) {
    console.error("Get MCQ result error:", error);
    res.status(500).json({ success: false, message: "Failed to get MCQ result" });
  }
};

// ─── Coding Problems ─────────────────────────────────────────────────────────

export const generateCodingProblem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { difficulty, language, topic } = req.body;
    if (!topic || !language) return res.status(400).json({ success: false, message: "Topic and language are required" });

    const result = await interviewService.generateCodingProblem(difficulty || "Medium", language, topic);

    const problem = await prisma.codingProblem.create({
      data: {
        userId,
        title: result.title,
        description: result.description,
        examples: result.examples,
        constraints: result.constraints,
        difficulty: difficulty || "Medium",
        category: topic,
        tags: [topic, language],
        sampleTestCases: result.sampleTestCases,
        hiddenTestCases: result.hiddenTestCases,
        timeLimit: result.timeLimit,
        memoryLimit: result.memoryLimit,
        isAIGenerated: true,
      },
    });

    await lifelog.conversation(userId, "GENERATE_CODING", `Generated coding problem: ${result.title}`, {
      problemId: problem.id,
      language,
      topic,
    });

    res.json({ success: true, data: { problem, solutionApproach: result.solutionApproach, complexityAnalysis: result.complexityAnalysis } });
  } catch (error) {
    console.error("Generate coding problem error:", error);
    res.status(500).json({ success: false, message: "Failed to generate coding problem" });
  }
};

export const listCodingProblems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { page, limit, skip } = paginate(req.query);
    const difficulty = str(req.query.difficulty);
    const category = str(req.query.category);

    const where: any = { userId };
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;

    const [problems, total] = await Promise.all([
      prisma.codingProblem.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.codingProblem.count({ where }),
    ]);

    res.json({ success: true, data: { problems, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("List coding problems error:", error);
    res.status(500).json({ success: false, message: "Failed to list coding problems" });
  }
};

export const getCodingProblem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const problem = await prisma.codingProblem.findUnique({
      where: { id },
      include: { submissions: { where: { userId }, orderBy: { createdAt: "desc" }, take: 10 } },
    });

    if (!problem) return res.status(404).json({ success: false, message: "Coding problem not found" });

    const hasSubmission = problem.submissions.length > 0;
    const { submissions, ...rest } = problem;
    const response = {
      ...rest,
      hiddenTestCases: hasSubmission ? problem.hiddenTestCases : undefined,
      submissions,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Get coding problem error:", error);
    res.status(500).json({ success: false, message: "Failed to get coding problem" });
  }
};

export const submitCoding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const { code, language } = req.body;
    if (!code || !language) return res.status(400).json({ success: false, message: "Code and language are required" });

    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) return res.status(404).json({ success: false, message: "Coding problem not found" });

    const testCases = (problem.sampleTestCases as any[]) || [];
    const totalTests = testCases.length + ((problem.hiddenTestCases as any[])?.length || 0);
    const passedTests = 0;

    const aiReview = await interviewService.aiCodeReview(code, language, problem.description);

    const submission = await prisma.codingSubmission.create({
      data: {
        userId,
        problemId: id,
        language,
        code,
        status: "Accepted",
        passedTests,
        totalTests,
        aiReview: aiReview as any,
      },
    });

    await prisma.userInterviewProgress.upsert({
      where: { userId },
      update: { codingProblemsSolved: { increment: 1 }, lastActiveDate: new Date() },
      create: { userId, codingProblemsSolved: 1, lastActiveDate: new Date() },
    });

    await lifelog.conversation(userId, "SUBMIT_CODING", `Submitted ${language} solution for problem ${id}`, {
      problemId: id,
      language,
      status: submission.status,
    });

    res.json({ success: true, data: { submission, aiReview } });
  } catch (error) {
    console.error("Submit coding error:", error);
    res.status(500).json({ success: false, message: "Failed to submit coding solution" });
  }
};

export const aiCodeReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { code, language, problemDescription } = req.body;
    if (!code || !language) return res.status(400).json({ success: false, message: "Code and language are required" });

    const review = await interviewService.aiCodeReview(code, language, problemDescription || "");

    await lifelog.conversation(userId, "AI_CODE_REVIEW", `Reviewed ${language} code`, { language });

    res.json({ success: true, data: review });
  } catch (error) {
    console.error("AI code review error:", error);
    res.status(500).json({ success: false, message: "Failed to review code" });
  }
};

// ─── Mock Interview ──────────────────────────────────────────────────────────

export const startMockInterview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { type, difficulty } = req.body;
    const sessionType = type || "technical";

    // Gather user context: notes, documents
    const [notes, documents] = await Promise.all([
      prisma.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.document.findMany({ where: { userId, status: "READY" }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const userContext = {
      resume: null,
      jobDescription: null,
      targetRole: null,
      currentLevel: null,
      skills: null,
      notes: notes.map((n: { title: string; content?: string | null }) => ({ title: n.title, content: n.content?.substring(0, 2000) })),
      documents: documents.map((d: { originalName: string; mimeType: string }) => ({ name: d.originalName, type: d.mimeType })),
    };

    const category = sessionType === "hr" ? "HR & Behavioral" : sessionType === "system-design" ? "System Design" : "Technical";
    const questionsResult = await interviewService.generateInterviewQuestions(category, difficulty || "Intermediate", 10, sessionType, userContext);

    const questions = ((questionsResult as any).questions || []).map((q: any) => ({
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      expectedAnswer: q.expectedAnswer || "",
      userAnswer: "",
      score: 0,
      feedback: "",
    }));

    const session = await prisma.interviewSession.create({
      data: {
        userId,
        type: sessionType,
        difficulty: difficulty || "Intermediate",
        questions,
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        context: JSON.stringify(userContext),
      },
    });

    await lifelog.conversation(userId, "START_MOCK_INTERVIEW", `Started ${sessionType} mock interview`, {
      sessionId: session.id,
      type: sessionType,
      totalQuestions: questions.length,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        currentQuestion: questions[0] || null,
        totalQuestions: questions.length,
        type: sessionType,
      },
    });
  } catch (error) {
    console.error("Start mock interview error:", error);
    res.status(500).json({ success: false, message: "Failed to start mock interview" });
  }
};

export const answerMockQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sessionId = req.params.sessionId as string;
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ success: false, message: "Answer is required" });

    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });
    if (session.status !== "in-progress") return res.status(400).json({ success: false, message: "Session is not active" });

    const questions = (session.questions as any[]) || [];
    const currentIndex = session.currentQuestionIndex || 0;

    if (currentIndex >= questions.length) {
      return res.status(400).json({ success: false, message: "No more questions in this session" });
    }

    const currentQuestion = questions[currentIndex];
    currentQuestion.userAnswer = answer;

    const contextObj = session.context ? JSON.parse(session.context as string) : null;
    const evaluation = await interviewService.conductMockInterview(currentQuestion.question, answer, contextObj);

    currentQuestion.score = evaluation.overallScore || 0;
    currentQuestion.feedback = JSON.stringify(evaluation);

    questions[currentIndex] = currentQuestion;

    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= questions.length;

    const updateData: any = {
      questions,
      currentQuestionIndex: nextIndex,
    };

    if (isComplete) {
      const totalScore = questions.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
      const avgScore = totalScore / questions.length;
      updateData.status = "completed";
      updateData.completedAt = new Date();
      updateData.overallScore = avgScore;
      updateData.technicalScore = evaluation.scores?.technicalAccuracy || 0;
      updateData.communicationScore = evaluation.scores?.communication || 0;
      updateData.confidenceScore = evaluation.scores?.depthOfKnowledge || 0;
      updateData.feedback = `Interview completed. Overall score: ${avgScore.toFixed(1)}/60`;
      updateData.improvementSuggestions = evaluation.areasForImprovement || [];

      await prisma.userInterviewProgress.upsert({
        where: { userId },
        update: { interviewSessions: { increment: 1 }, lastActiveDate: new Date() },
        create: { userId, interviewSessions: 1, lastActiveDate: new Date() },
      });
    }

    await prisma.interviewSession.update({ where: { id: sessionId }, data: updateData });

    await lifelog.conversation(userId, "MOCK_ANSWER", `Answered question ${currentIndex + 1}/${session.totalQuestions}`, {
      sessionId,
      isComplete,
      score: currentQuestion.score,
    });

    res.json({
      success: true,
      data: {
        evaluation,
        nextQuestion: isComplete ? null : questions[nextIndex],
        isComplete,
        progress: { current: nextIndex, total: session.totalQuestions },
      },
    });
  } catch (error) {
    console.error("Answer mock question error:", error);
    res.status(500).json({ success: false, message: "Failed to process answer" });
  }
};

export const getMockInterviewResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sessionId = req.params.sessionId as string;
    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    res.json({ success: true, data: session });
  } catch (error) {
    console.error("Get mock interview result error:", error);
    res.status(500).json({ success: false, message: "Failed to get result" });
  }
};

// ─── Flow Diagram ────────────────────────────────────────────────────────────

export const generateFlowDiagram = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { topic } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "Topic is required" });

    const result = await interviewService.generateFlowDiagram(topic);

    await lifelog.conversation(userId, "GENERATE_DIAGRAM", `Generated diagram for: ${topic}`, { topic });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Generate diagram error:", error);
    res.status(500).json({ success: false, message: "Failed to generate diagram" });
  }
};

// ─── Notes ───────────────────────────────────────────────────────────────────

export const generateNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { topic, type } = req.body;
    if (!topic || !type) return res.status(400).json({ success: false, message: "Topic and type are required" });

    const result = await interviewService.generateNotes(topic, type);

    const note = await prisma.interviewNote.create({
      data: {
        userId,
        title: (result as any).title || `${topic} - ${type} notes`,
        content: JSON.stringify(result),
        type,
        tags: [topic],
        sourceType: "ai-generated",
      },
    });

    await lifelog.conversation(userId, "GENERATE_NOTES", `Generated ${type} notes for: ${topic}`, { topic, type, noteId: note.id });

    res.json({ success: true, data: { note, content: result } });
  } catch (error) {
    console.error("Generate notes error:", error);
    res.status(500).json({ success: false, message: "Failed to generate notes" });
  }
};

export const listNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { page, limit, skip } = paginate(req.query);
    const type = str(req.query.type);

    const where: any = { userId };
    if (type) where.type = type;

    const [notes, total] = await Promise.all([
      prisma.interviewNote.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.interviewNote.count({ where }),
    ]);

    res.json({ success: true, data: { notes, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("List notes error:", error);
    res.status(500).json({ success: false, message: "Failed to list notes" });
  }
};

export const saveNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { title, content, type, tags } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content are required" });

    const note = await prisma.interviewNote.create({
      data: { userId, title, content, type: type || "general", tags: tags || [] },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    console.error("Save note error:", error);
    res.status(500).json({ success: false, message: "Failed to save note" });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const existing = await prisma.interviewNote.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await prisma.interviewNote.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ success: false, message: "Failed to delete note" });
  }
};

export const updateInterviewNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const existing = await prisma.interviewNote.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const { title, content, type, tags, pinned } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (type !== undefined) data.type = type;
    if (tags !== undefined) data.tags = tags;
    if (pinned !== undefined) data.isPinned = pinned;

    const updated = await prisma.interviewNote.update({ where: { id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ success: false, message: "Failed to update note" });
  }
};

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { itemType, itemId, label } = req.body;
    if (!itemType || !itemId) return res.status(400).json({ success: false, message: "itemType and itemId are required" });

    const existing = await prisma.userBookmark.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });

    if (existing) {
      await prisma.userBookmark.delete({ where: { id: existing.id } });
      res.json({ success: true, data: { bookmarked: false } });
    } else {
      await prisma.userBookmark.create({ data: { userId, itemType, itemId, label } });
      res.json({ success: true, data: { bookmarked: true } });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark" });
  }
};

export const listBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const itemType = str(req.query.itemType);
    const where: any = { userId };
    if (itemType) where.itemType = itemType;

    const bookmarks = await prisma.userBookmark.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error("List bookmarks error:", error);
    res.status(500).json({ success: false, message: "Failed to list bookmarks" });
  }
};

// ─── Saved Items ─────────────────────────────────────────────────────────────

export const saveItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { itemType, itemId, label } = req.body;
    if (!itemType || !itemId) return res.status(400).json({ success: false, message: "itemType and itemId are required" });

    const saved = await prisma.userSavedItem.create({
      data: { userId, itemType, itemId, label },
    });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Item already saved" });
    }
    console.error("Save item error:", error);
    res.status(500).json({ success: false, message: "Failed to save item" });
  }
};

export const listSavedItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const itemType = str(req.query.itemType);
    const where: any = { userId };
    if (itemType) where.itemType = itemType;

    const items = await prisma.userSavedItem.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("List saved items error:", error);
    res.status(500).json({ success: false, message: "Failed to list saved items" });
  }
};

export const deleteSavedItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const existing = await prisma.userSavedItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Saved item not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await prisma.userSavedItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete saved item error:", error);
    res.status(500).json({ success: false, message: "Failed to delete saved item" });
  }
};

// ─── Search ──────────────────────────────────────────────────────────────────

export const search = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const q = str(req.query.q);
    const category = str(req.query.category);
    const query = q || "";
    if (!query) return res.status(400).json({ success: false, message: "Search query is required" });

    const { page, limit, skip } = paginate(req.query, 20);

    const questionWhere: any = {
      userId,
      OR: [
        { question: { contains: query, mode: "insensitive" as const } },
        { tags: { has: query.toLowerCase() } },
      ],
    };
    if (category) questionWhere.category = category;

    const [questions, companyQuestions, total] = await Promise.all([
      prisma.interviewQuestion.findMany({ where: questionWhere, skip, take: limit }),
      prisma.companyQuestion.findMany({
        where: { userId, question: { contains: query, mode: "insensitive" as const } },
        skip,
        take: limit,
      }),
      prisma.interviewQuestion.count({ where: questionWhere }),
    ]);

    await prisma.interviewSearchLog.create({
      data: { userId, query, category: category || "questions", results: questions.length },
    });

    await lifelog.conversation(userId, "INTERVIEW_SEARCH", `Searched: ${query}`, { query, category, results: questions.length });

    res.json({ success: true, data: { questions, companyQuestions, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Failed to search" });
  }
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const [totalQuestions, totalMCQs, totalCoding, totalSessions, totalNotes, progress] = await Promise.all([
      prisma.interviewQuestion.count({ where: { userId } }),
      prisma.mCQ.count({ where: { userId } }),
      prisma.codingProblem.count({ where: { userId } }),
      prisma.interviewSession.count({ where: { userId } }),
      prisma.interviewNote.count({ where: { userId } }),
      prisma.userInterviewProgress.findUnique({ where: { userId } }),
    ]);

    const categoryBreakdown = await prisma.interviewQuestion.groupBy({
      by: ["category"],
      where: { userId },
      _count: true,
    });

    const difficultyBreakdown = await prisma.interviewQuestion.groupBy({
      by: ["difficulty"],
      where: { userId },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totals: { totalQuestions, totalMCQs, totalCoding, totalSessions, totalNotes },
        progress: progress || { questionsSolved: 0, mcqsCompleted: 0, codingProblemsSolved: 0, interviewSessions: 0, averageScore: 0 },
        categoryBreakdown,
        difficultyBreakdown,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to get analytics" });
  }
};

// ─── Recommendations ─────────────────────────────────────────────────────────

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const aiRecommendations = await interviewService.generateRecommendations(userId);

    const recs = (aiRecommendations as any).recommendations || [];
    for (const rec of recs) {
      await prisma.interviewRecommendation.create({
        data: {
          userId,
          type: rec.type || "topic",
          title: rec.title || "",
          description: rec.description,
          priority: rec.priority || 0,
          reason: rec.reason,
        },
      });
    }

    const allRecommendations = await prisma.interviewRecommendation.findMany({
      where: { userId, isCompleted: false },
      orderBy: { priority: "desc" },
    });

    res.json({
      success: true,
      data: {
        recommendations: allRecommendations,
        weakAreas: (aiRecommendations as any).weakAreas || [],
        suggestedFocus: (aiRecommendations as any).suggestedFocus || "",
        estimatedPreparationLevel: (aiRecommendations as any).estimatedPreparationLevel || "Beginner",
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ success: false, message: "Failed to get recommendations" });
  }
};

// ─── Progress ────────────────────────────────────────────────────────────────

export const getProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const progress = await prisma.userInterviewProgress.findUnique({ where: { userId } });
    if (!progress) {
      return res.json({
        success: true,
        data: {
          questionsSolved: 0,
          mcqsCompleted: 0,
          codingProblemsSolved: 0,
          interviewSessions: 0,
          averageScore: 0,
          weakTopics: [],
          strongTopics: [],
          learningStreak: 0,
        },
      });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ success: false, message: "Failed to get progress" });
  }
};

// ─── Conversations ───────────────────────────────────────────────────────────

export const listInterviewConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const type = str(req.query.type);
    const where: any = { userId };
    if (type) where.type = type;

    const conversations = await prisma.aIInterviewConversation.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: { _count: { select: { messages: true } } },
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ success: false, message: "Failed to list conversations" });
  }
};

export const getInterviewConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversation = await prisma.aIInterviewConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to get conversation" });
  }
};

export const deleteInterviewConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversation = await prisma.aIInterviewConversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await prisma.aIInterviewConversation.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to delete conversation" });
  }
};

export const deleteAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await prisma.aIInterviewConversation.deleteMany({ where: { userId } });
    res.json({ success: true, message: "All conversations deleted" });
  } catch (error) {
    console.error("Delete all conversations error:", error);
    res.status(500).json({ success: false, message: "Failed to delete conversations" });
  }
};

export const pinConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversation = await prisma.aIInterviewConversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const updated = await prisma.aIInterviewConversation.update({
      where: { id },
      data: { isPinned: !conversation.isPinned },
    });

    res.json({ success: true, data: { isPinned: updated.isPinned } });
  } catch (error) {
    console.error("Pin conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle pin" });
  }
};

export const exportConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const format = (req.query.format as string) || "markdown";

    const conversation = await prisma.aIInterviewConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    if (format === "markdown") {
      const markdown = `# ${conversation.title}\n\n${conversation.messages
        .map((m: any) => `**${m.role === "user" ? "You" : "AI"}**: ${m.content}`)
        .join("\n\n")}`;

      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${conversation.title}.md"`);
      return res.send(markdown);
    }

    if (format === "text") {
      const text = `${conversation.title}\n${"=".repeat(conversation.title.length)}\n\n${conversation.messages
        .map((m: any) => `[${m.role.toUpperCase()}]\n${m.content}`)
        .join("\n\n")}`;

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${conversation.title}.txt"`);
      return res.send(text);
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Export conversation error:", error);
    res.status(500).json({ success: false, message: "Failed to export conversation" });
  }
};
