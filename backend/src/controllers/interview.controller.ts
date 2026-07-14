import { Request, Response } from "express";
import { interviewService } from "../services/interview.service";
import { geminiService } from "../services/gemini.service";
import { pool } from "../lib/prisma";
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
      const convResult = await pool.query('SELECT * FROM "AIInterviewConversation" WHERE "id" = $1 LIMIT 1', [conversationId]);
      conversation = convResult.rows[0];
      if (conversation) {
        const msgsResult = await pool.query('SELECT * FROM "AIInterviewMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC', [conversationId]);
        conversation.messages = msgsResult.rows;
      }
    }

    if (!conversation) {
      const newConvResult = await pool.query(
        'INSERT INTO "AIInterviewConversation" ("userId", "title", "type") VALUES ($1, $2, $3) RETURNING *',
        [userId, question.substring(0, 50), "qa"]
      );
      conversation = newConvResult.rows[0];
      conversation.messages = [];
    }

    await pool.query(
      'INSERT INTO "AIInterviewMessage" ("conversationId", "role", "content") VALUES ($1, $2, $3)',
      [conversation.id, "user", question]
    );

    const result = await interviewService.askAI(question, history || [], userId);

    const responseText = JSON.stringify(result);
    await pool.query(
      'INSERT INTO "AIInterviewMessage" ("conversationId", "role", "content") VALUES ($1, $2, $3)',
      [conversation.id, "model", responseText]
    );

    if (conversation.title === "New Interview Chat") {
      await pool.query(
        'UPDATE "AIInterviewConversation" SET "title" = $1 WHERE "id" = $2',
        [question.substring(0, 50), conversation.id]
      );
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

    const result = await pool.query(
      'INSERT INTO "InterviewQuestion" ("userId", "question", "answer", "explanation", "difficulty", "category", "type", "tags") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, question, answer, explanation, difficulty || "Intermediate", category || "General", type || "Theory", tags || []]
    );
    const created = result.rows[0];

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

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (category) { conditions.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }
    if (difficulty) { conditions.push(`"difficulty" = $${paramIdx}`); params.push(difficulty); paramIdx++; }
    if (search) {
      conditions.push(`("question" ILIKE $${paramIdx} OR "answer" ILIKE $${paramIdx + 1} OR $${paramIdx + 2} = ANY("tags"))`);
      params.push(`%${search}%`, `%${search}%`, search.toLowerCase());
      paramIdx += 3;
    }

    const whereClause = conditions.join(' AND ');

    const [questionsResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "InterviewQuestion" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, limit]),
      pool.query(`SELECT COUNT(*) FROM "InterviewQuestion" WHERE ${whereClause}`, params),
    ]);

    const questions = questionsResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

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
    const result = await pool.query('SELECT * FROM "InterviewQuestion" WHERE "id" = $1 LIMIT 1', [id]);
    const question = result.rows[0];
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
    const existingResult = await pool.query('SELECT * FROM "InterviewQuestion" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Question not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const { question, answer, explanation, difficulty, category, type, tags } = req.body;
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (question !== undefined) { setClauses.push(`"question" = $${paramIdx}`); params.push(question); paramIdx++; }
    if (answer !== undefined) { setClauses.push(`"answer" = $${paramIdx}`); params.push(answer); paramIdx++; }
    if (explanation !== undefined) { setClauses.push(`"explanation" = $${paramIdx}`); params.push(explanation); paramIdx++; }
    if (difficulty !== undefined) { setClauses.push(`"difficulty" = $${paramIdx}`); params.push(difficulty); paramIdx++; }
    if (category !== undefined) { setClauses.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }
    if (type !== undefined) { setClauses.push(`"type" = $${paramIdx}`); params.push(type); paramIdx++; }
    if (tags !== undefined) { setClauses.push(`"tags" = $${paramIdx}`); params.push(tags); paramIdx++; }

    params.push(id);
    const result = await pool.query(`UPDATE "InterviewQuestion" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const updated = result.rows[0];

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
    const existingResult = await pool.query('SELECT * FROM "InterviewQuestion" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Question not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query('DELETE FROM "InterviewQuestion" WHERE "id" = $1', [id]);
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

    const conditions: string[] = ['"userId" = $1', '"company" = $2'];
    const params: any[] = [userId, company];
    let paramIdx = 3;

    if (role) { conditions.push(`"role" = $${paramIdx}`); params.push(role); paramIdx++; }
    if (experience) { conditions.push(`"experience" = $${paramIdx}`); params.push(experience); paramIdx++; }
    if (difficulty) { conditions.push(`"difficulty" = $${paramIdx}`); params.push(difficulty); paramIdx++; }

    const whereClause = conditions.join(' AND ');
    const result = await pool.query(`SELECT * FROM "CompanyQuestion" WHERE ${whereClause} ORDER BY "createdAt" DESC`, params);
    const questions = result.rows;

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

    const result = await pool.query(
      'INSERT INTO "CompanyQuestion" ("userId", "company", "role", "experience", "question", "answer", "difficulty", "technology", "tags") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [userId, company, role, experience, question, answer, difficulty || "Intermediate", technology || [], []]
    );
    const created = result.rows[0];

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
      const savedResult = await pool.query(
        'INSERT INTO "MCQ" ("userId", "question", "options", "correctAnswer", "explanation", "category", "topic", "difficulty", "tags") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [userId, mcq.question, mcq.options, mcq.correctAnswer, mcq.explanation, category, mcq.topic, mcq.difficulty || difficulty || "Medium", []]
      );
      savedMcqs.push(savedResult.rows[0]);
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

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (category) { conditions.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }
    if (difficulty) { conditions.push(`"difficulty" = $${paramIdx}`); params.push(difficulty); paramIdx++; }

    const whereClause = conditions.join(' AND ');

    const [mcqsResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "MCQ" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, limit]),
      pool.query(`SELECT COUNT(*) FROM "MCQ" WHERE ${whereClause}`, params),
    ]);

    const mcqs = mcqsResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

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

    const mcqResult = await pool.query('SELECT * FROM "MCQ" WHERE "id" = $1 LIMIT 1', [mcqId]);
    const mcq = mcqResult.rows[0];
    if (!mcq) return res.status(404).json({ success: false, message: "MCQ not found" });

    const isCorrect = selectedAnswer === mcq.correctAnswer;
    const attemptResult = await pool.query(
      'INSERT INTO "MCQAttempt" ("userId", "mcqId", "selectedAnswer", "isCorrect", "timeTaken") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, mcqId, selectedAnswer, isCorrect, timeTaken]
    );
    const attempt = attemptResult.rows[0];

    const evaluation = await interviewService.evaluateMCQAnswer(mcq.question, String(selectedAnswer), String(mcq.correctAnswer));

    // Update progress
    const existingProgressResult = await pool.query('SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1', [userId]);
    const existingProgress = existingProgressResult.rows[0];
    if (existingProgress) {
      await pool.query(
        'UPDATE "UserInterviewProgress" SET "mcqsCompleted" = "mcqsCompleted" + 1, "lastActiveDate" = $1 WHERE "userId" = $2',
        [new Date(), userId]
      );
    } else {
      await pool.query(
        'INSERT INTO "UserInterviewProgress" ("userId", "mcqsCompleted", "lastActiveDate") VALUES ($1, $2, $3)',
        [userId, 1, new Date()]
      );
    }

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
    const mcqResult = await pool.query('SELECT * FROM "MCQ" WHERE "id" = $1 LIMIT 1', [id]);
    const mcq = mcqResult.rows[0];

    if (!mcq) return res.status(404).json({ success: false, message: "MCQ not found" });

    const attemptsResult = await pool.query(
      'SELECT * FROM "MCQAttempt" WHERE "mcqId" = $1 AND "userId" = $2 ORDER BY "createdAt" DESC',
      [id, userId]
    );
    mcq.attempts = attemptsResult.rows;

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

    const problemResult = await pool.query(
      'INSERT INTO "CodingProblem" ("userId", "title", "description", "examples", "constraints", "difficulty", "category", "tags", "sampleTestCases", "hiddenTestCases", "timeLimit", "memoryLimit", "isAIGenerated") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [userId, result.title, result.description, result.examples, result.constraints, difficulty || "Medium", topic, [topic, language], result.sampleTestCases, result.hiddenTestCases, result.timeLimit, result.memoryLimit, true]
    );
    const problem = problemResult.rows[0];

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

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (difficulty) { conditions.push(`"difficulty" = $${paramIdx}`); params.push(difficulty); paramIdx++; }
    if (category) { conditions.push(`"category" = $${paramIdx}`); params.push(category); paramIdx++; }

    const whereClause = conditions.join(' AND ');

    const [problemsResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "CodingProblem" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, limit]),
      pool.query(`SELECT COUNT(*) FROM "CodingProblem" WHERE ${whereClause}`, params),
    ]);

    const problems = problemsResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

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
    const problemResult = await pool.query('SELECT * FROM "CodingProblem" WHERE "id" = $1 LIMIT 1', [id]);
    const problem = problemResult.rows[0];

    if (!problem) return res.status(404).json({ success: false, message: "Coding problem not found" });

    const submissionsResult = await pool.query(
      'SELECT * FROM "CodingSubmission" WHERE "problemId" = $1 AND "userId" = $2 ORDER BY "createdAt" DESC LIMIT 10',
      [id, userId]
    );
    const submissions = submissionsResult.rows;

    const hasSubmission = submissions.length > 0;
    const { hiddenTestCases, ...rest } = problem;
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

    const problemResult = await pool.query('SELECT * FROM "CodingProblem" WHERE "id" = $1 LIMIT 1', [id]);
    const problem = problemResult.rows[0];
    if (!problem) return res.status(404).json({ success: false, message: "Coding problem not found" });

    const testCases = (problem.sampleTestCases as any[]) || [];
    const totalTests = testCases.length + ((problem.hiddenTestCases as any[])?.length || 0);
    const passedTests = 0;

    const aiReview = await interviewService.aiCodeReview(code, language, problem.description);

    const submissionResult = await pool.query(
      'INSERT INTO "CodingSubmission" ("userId", "problemId", "language", "code", "status", "passedTests", "totalTests", "aiReview") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, id, language, code, "Accepted", passedTests, totalTests, aiReview as any]
    );
    const submission = submissionResult.rows[0];

    const existingProgressResult = await pool.query('SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1', [userId]);
    const existingProgress = existingProgressResult.rows[0];
    if (existingProgress) {
      await pool.query(
        'UPDATE "UserInterviewProgress" SET "codingProblemsSolved" = "codingProblemsSolved" + 1, "lastActiveDate" = $1 WHERE "userId" = $2',
        [new Date(), userId]
      );
    } else {
      await pool.query(
        'INSERT INTO "UserInterviewProgress" ("userId", "codingProblemsSolved", "lastActiveDate") VALUES ($1, $2, $3)',
        [userId, 1, new Date()]
      );
    }

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

    const [notesResult, documentsResult] = await Promise.all([
      pool.query('SELECT * FROM "Note" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 10', [userId]),
      pool.query('SELECT * FROM "Document" WHERE "userId" = $1 AND "status" = $2 ORDER BY "createdAt" DESC LIMIT 10', [userId, "READY"]),
    ]);

    const notes = notesResult.rows;
    const documents = documentsResult.rows;

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

    const sessionResult = await pool.query(
      'INSERT INTO "InterviewSession" ("userId", "type", "difficulty", "questions", "currentQuestionIndex", "totalQuestions", "context") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, sessionType, difficulty || "Intermediate", JSON.stringify(questions), 0, questions.length, JSON.stringify(userContext)]
    );
    const session = sessionResult.rows[0];

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

    const sessionResult = await pool.query('SELECT * FROM "InterviewSession" WHERE "id" = $1 LIMIT 1', [sessionId]);
    const session = sessionResult.rows[0];
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

      const existingProgressResult = await pool.query('SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1', [userId]);
      const existingProgress = existingProgressResult.rows[0];
      if (existingProgress) {
        await pool.query(
          'UPDATE "UserInterviewProgress" SET "interviewSessions" = "interviewSessions" + 1, "lastActiveDate" = $1 WHERE "userId" = $2',
          [new Date(), userId]
        );
      } else {
        await pool.query(
          'INSERT INTO "UserInterviewProgress" ("userId", "interviewSessions", "lastActiveDate") VALUES ($1, $2, $3)',
          [userId, 1, new Date()]
        );
      }
    }

    const setClauses: string[] = [];
    const updateParams: any[] = [];
    let updateParamIdx = 1;
    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`"${key}" = $${updateParamIdx}`);
      updateParams.push(value);
      updateParamIdx++;
    }
    updateParams.push(sessionId);
    await pool.query(`UPDATE "InterviewSession" SET ${setClauses.join(', ')} WHERE "id" = $${updateParamIdx}`, updateParams);

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
    const sessionResult = await pool.query('SELECT * FROM "InterviewSession" WHERE "id" = $1 LIMIT 1', [sessionId]);
    const session = sessionResult.rows[0];
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

    const noteResult = await pool.query(
      'INSERT INTO "InterviewNote" ("userId", "title", "content", "type", "tags", "sourceType") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, (result as any).title || `${topic} - ${type} notes`, JSON.stringify(result), type, [topic], "ai-generated"]
    );
    const note = noteResult.rows[0];

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

    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIdx = 2;

    if (type) { conditions.push(`"type" = $${paramIdx}`); params.push(type); paramIdx++; }

    const whereClause = conditions.join(' AND ');

    const [notesResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "InterviewNote" WHERE ${whereClause} ORDER BY "createdAt" DESC OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`, [...params, skip, limit]),
      pool.query(`SELECT COUNT(*) FROM "InterviewNote" WHERE ${whereClause}`, params),
    ]);

    const notes = notesResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

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

    const result = await pool.query(
      'INSERT INTO "InterviewNote" ("userId", "title", "content", "type", "tags") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, content, type || "general", tags || []]
    );
    const note = result.rows[0];

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
    const existingResult = await pool.query('SELECT * FROM "InterviewNote" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query('DELETE FROM "InterviewNote" WHERE "id" = $1', [id]);
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
    const existingResult = await pool.query('SELECT * FROM "InterviewNote" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Note not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const { title, content, type, tags, pinned } = req.body;
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;
    if (title !== undefined) { setClauses.push(`"title" = $${paramIdx}`); params.push(title); paramIdx++; }
    if (content !== undefined) { setClauses.push(`"content" = $${paramIdx}`); params.push(content); paramIdx++; }
    if (type !== undefined) { setClauses.push(`"type" = $${paramIdx}`); params.push(type); paramIdx++; }
    if (tags !== undefined) { setClauses.push(`"tags" = $${paramIdx}`); params.push(tags); paramIdx++; }
    if (pinned !== undefined) { setClauses.push(`"isPinned" = $${paramIdx}`); params.push(pinned); paramIdx++; }

    params.push(id);
    const result = await pool.query(`UPDATE "InterviewNote" SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx} RETURNING *`, params);
    const updated = result.rows[0];

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

    const existingResult = await pool.query(
      'SELECT * FROM "UserBookmark" WHERE "userId" = $1 AND "itemType" = $2 AND "itemId" = $3 LIMIT 1',
      [userId, itemType, itemId]
    );
    const existing = existingResult.rows[0];

    if (existing) {
      await pool.query('DELETE FROM "UserBookmark" WHERE "id" = $1', [existing.id]);
      res.json({ success: true, data: { bookmarked: false } });
    } else {
      await pool.query(
        'INSERT INTO "UserBookmark" ("userId", "itemType", "itemId", "label") VALUES ($1, $2, $3, $4)',
        [userId, itemType, itemId, label]
      );
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
    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    if (itemType) { conditions.push('"itemType" = $2'); params.push(itemType); }

    const whereClause = conditions.join(' AND ');
    const result = await pool.query(`SELECT * FROM "UserBookmark" WHERE ${whereClause} ORDER BY "createdAt" DESC`, params);
    const bookmarks = result.rows;

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

    const result = await pool.query(
      'INSERT INTO "UserSavedItem" ("userId", "itemType", "itemId", "label") VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, itemType, itemId, label]
    );
    const saved = result.rows[0];

    res.json({ success: true, data: saved });
  } catch (error: any) {
    if (error.code === "23505") {
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
    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    if (itemType) { conditions.push('"itemType" = $2'); params.push(itemType); }

    const whereClause = conditions.join(' AND ');
    const result = await pool.query(`SELECT * FROM "UserSavedItem" WHERE ${whereClause} ORDER BY "createdAt" DESC`, params);
    const items = result.rows;

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
    const existingResult = await pool.query('SELECT * FROM "UserSavedItem" WHERE "id" = $1 LIMIT 1', [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ success: false, message: "Saved item not found" });
    if (existing.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query('DELETE FROM "UserSavedItem" WHERE "id" = $1', [id]);
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

    const questionConditions: string[] = ['"userId" = $1'];
    const questionParams: any[] = [userId];
    let questionParamIdx = 2;

    questionConditions.push(`("question" ILIKE $${questionParamIdx} OR $${questionParamIdx + 1} = ANY("tags"))`);
    questionParams.push(`%${query}%`, query.toLowerCase());
    questionParamIdx += 2;

    if (category) { questionConditions.push(`"category" = $${questionParamIdx}`); questionParams.push(category); questionParamIdx++; }

    const questionWhere = questionConditions.join(' AND ');

    const [questionsResult, companyQuestionsResult, totalResult] = await Promise.all([
      pool.query(`SELECT * FROM "InterviewQuestion" WHERE ${questionWhere} OFFSET $${questionParamIdx} LIMIT $${questionParamIdx + 1}`, [...questionParams, skip, limit]),
      pool.query('SELECT * FROM "CompanyQuestion" WHERE "userId" = $1 AND "question" ILIKE $2 OFFSET $3 LIMIT $4', [userId, `%${query}%`, skip, limit]),
      pool.query(`SELECT COUNT(*) FROM "InterviewQuestion" WHERE ${questionWhere}`, questionParams),
    ]);

    const questions = questionsResult.rows;
    const companyQuestions = companyQuestionsResult.rows;
    const total = parseInt(totalResult.rows[0].count, 10);

    await pool.query(
      'INSERT INTO "InterviewSearchLog" ("userId", "query", "category", "results") VALUES ($1, $2, $3, $4)',
      [userId, query, category || "questions", questions.length]
    );

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

    const [totalQuestionsResult, totalMCQsResult, totalCodingResult, totalSessionsResult, totalNotesResult, progressResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "InterviewQuestion" WHERE "userId" = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM "MCQ" WHERE "userId" = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM "CodingProblem" WHERE "userId" = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM "InterviewSession" WHERE "userId" = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM "InterviewNote" WHERE "userId" = $1', [userId]),
      pool.query('SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1', [userId]),
    ]);

    const totalQuestions = parseInt(totalQuestionsResult.rows[0].count, 10);
    const totalMCQs = parseInt(totalMCQsResult.rows[0].count, 10);
    const totalCoding = parseInt(totalCodingResult.rows[0].count, 10);
    const totalSessions = parseInt(totalSessionsResult.rows[0].count, 10);
    const totalNotes = parseInt(totalNotesResult.rows[0].count, 10);
    const progress = progressResult.rows[0];

    const categoryBreakdownResult = await pool.query(
      'SELECT "category", COUNT(*)::int AS "_count" FROM "InterviewQuestion" WHERE "userId" = $1 GROUP BY "category"',
      [userId]
    );
    const categoryBreakdown = categoryBreakdownResult.rows;

    const difficultyBreakdownResult = await pool.query(
      'SELECT "difficulty", COUNT(*)::int AS "_count" FROM "InterviewQuestion" WHERE "userId" = $1 GROUP BY "difficulty"',
      [userId]
    );
    const difficultyBreakdown = difficultyBreakdownResult.rows;

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
      await pool.query(
        'INSERT INTO "InterviewRecommendation" ("userId", "type", "title", "description", "priority", "reason") VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, rec.type || "topic", rec.title || "", rec.description, rec.priority || 0, rec.reason]
      );
    }

    const allRecommendationsResult = await pool.query(
      'SELECT * FROM "InterviewRecommendation" WHERE "userId" = $1 AND "isCompleted" = false ORDER BY "priority" DESC',
      [userId]
    );
    const allRecommendations = allRecommendationsResult.rows;

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

    const progressResult = await pool.query('SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1', [userId]);
    const progress = progressResult.rows[0];
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
    const conditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    if (type) { conditions.push('"type" = $2'); params.push(type); }

    const whereClause = conditions.join(' AND ');
    const conversationsResult = await pool.query(
      `SELECT *, (SELECT COUNT(*)::int FROM "AIInterviewMessage" WHERE "AIInterviewMessage"."conversationId" = "AIInterviewConversation"."id") AS "_count_messages" FROM "AIInterviewConversation" WHERE ${whereClause} ORDER BY "isPinned" DESC, "updatedAt" DESC`,
      params
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

export const getInterviewConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const id = req.params.id as string;
    const conversationResult = await pool.query('SELECT * FROM "AIInterviewConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const messagesResult = await pool.query(
      'SELECT * FROM "AIInterviewMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [id]
    );
    conversation.messages = messagesResult.rows;

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
    const conversationResult = await pool.query('SELECT * FROM "AIInterviewConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query('DELETE FROM "AIInterviewConversation" WHERE "id" = $1', [id]);
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

    await pool.query('DELETE FROM "AIInterviewConversation" WHERE "userId" = $1', [userId]);
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
    const conversationResult = await pool.query('SELECT * FROM "AIInterviewConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const updatedResult = await pool.query(
      'UPDATE "AIInterviewConversation" SET "isPinned" = NOT "isPinned" WHERE "id" = $1 RETURNING *',
      [id]
    );
    const updated = updatedResult.rows[0];

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

    const conversationResult = await pool.query('SELECT * FROM "AIInterviewConversation" WHERE "id" = $1 LIMIT 1', [id]);
    const conversation = conversationResult.rows[0];

    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    if (conversation.userId !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

    const messagesResult = await pool.query(
      'SELECT * FROM "AIInterviewMessage" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC',
      [id]
    );
    conversation.messages = messagesResult.rows;

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
