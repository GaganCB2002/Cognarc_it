import { ai } from "./gemini.service";
import {
  INTERVIEW_QA_CONTEXT,
  INTERVIEW_MOCK_CONTEXT,
  INTERVIEW_NOTES_CONTEXT,
  INTERVIEW_DIAGRAM_CONTEXT,
  INTERVIEW_EVALUATION_CONTEXT,
} from "../data/interview-context";
import { pool } from "../lib/prisma";

function safeParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("[Interview] Failed to parse AI response as JSON:", text.substring(0, 200));
    return fallback;
  }
}

const JSON_MODEL = "gemini-2.5-flash";

export const interviewService = {
  async askAI(question: string, history: { role: string; content: string }[] = [], userId: string) {
    const contextHistory = history.slice(0, -1).map(m => ({
      role: m.role as "user" | "model",
      content: m.content,
    }));
    const newMessage = history.length > 0 ? history[history.length - 1].content : question;

    const prompt = `Answer this interview question and return ONLY valid JSON matching this schema:
{
  "answer": "Clear, comprehensive answer",
  "explanation": "Detailed explanation of underlying concepts",
  "realWorldExamples": ["Example 1", "Example 2"],
  "bestPractices": ["Practice 1", "Practice 2"],
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "interviewTips": ["Tip 1", "Tip 2"],
  "followUpQuestions": ["Question 1", "Question 2"],
  "relatedConcepts": ["Concept 1", "Concept 2"],
  "difficulty": "Beginner|Intermediate|Advanced|Expert",
  "estimatedFrequency": "Very Common|Common|Moderate|Rare"
}

Question: ${newMessage}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction: INTERVIEW_QA_CONTEXT },
    });

    if (!response.text) throw new Error("No response from AI");

    return safeParse(response.text, {
      answer: response.text,
      explanation: "",
      realWorldExamples: [],
      bestPractices: [],
      commonMistakes: [],
      interviewTips: [],
      followUpQuestions: [],
      relatedConcepts: [],
      difficulty: "Intermediate",
      estimatedFrequency: "Common",
    });
  },

  async generateInterviewQuestions(category: string, difficulty: string, count: number = 5, type: string = "mixed", userContext?: any) {
    const contextBlock = userContext ? `
## USER CONTEXT (use this to personalize questions)
- Target Role: ${userContext.targetRole || "Not specified"}
- Current Level: ${userContext.currentLevel || "Not specified"}
- Skills: ${userContext.skills ? (Array.isArray(userContext.skills) ? userContext.skills.join(", ") : JSON.stringify(userContext.skills)) : "Not specified"}
- Resume: ${userContext.resume || "Not provided"}
- Job Description: ${userContext.jobDescription || "Not provided"}
- Recent Study Notes: ${userContext.notes?.length > 0 ? userContext.notes.map((n: any) => `"${n.title}"`).join(", ") : "None"}
- Uploaded Documents: ${userContext.documents?.length > 0 ? userContext.documents.map((d: any) => `${d.name} (${d.type})`).join(", ") : "None"}

Tailor questions to the user's target role, experience level, and skills. Reference their resume and job description context.` : "";

    const prompt = `Generate ${count} interview questions for the category "${category}" at "${difficulty}" difficulty level.
Type: ${type === "mixed" ? "Mix of theory, practical, scenario, and coding questions" : type + " questions only"}.
${contextBlock}

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "The interview question",
      "type": "Theory|Practical|Scenario|Coding",
      "difficulty": "Beginner|Intermediate|Advanced|Expert",
      "expectedAnswer": "Brief expected answer",
      "topics": ["Topic 1", "Topic 2"],
      "estimatedFrequency": "Very Common|Common|Moderate|Rare",
      "timeToAnswer": "2-3 minutes"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction: INTERVIEW_QA_CONTEXT },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, { questions: [] });
  },

  async generateMCQs(category: string, count: number = 5, difficulty: string = "Medium") {
    const prompt = `Generate ${count} multiple-choice questions for category "${category}" at "${difficulty}" difficulty.

Return ONLY valid JSON matching this schema:
{
  "mcqs": [
    {
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "topic": "Topic name",
      "difficulty": "Easy|Medium|Hard"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, { mcqs: [] });
  },

  async generateCodingProblem(difficulty: string, language: string, topic: string) {
    const prompt = `Generate a coding problem for "${language}" at "${difficulty}" difficulty covering "${topic}".

Return ONLY valid JSON matching this schema:
{
  "title": "Problem title",
  "description": "Detailed problem description",
  "examples": [
    {"input": "Example input", "output": "Expected output", "explanation": "Why this output"}
  ],
  "constraints": "Problem constraints",
  "sampleTestCases": [{"input": "...", "output": "..."}],
  "hiddenTestCases": [{"input": "...", "output": "..."}],
  "timeLimit": 1000,
  "memoryLimit": 256,
  "solutionApproach": "Brief description of optimal approach",
  "complexityAnalysis": "Time and space complexity analysis"
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, {
      title: "",
      description: "",
      examples: [],
      constraints: "",
      sampleTestCases: [],
      hiddenTestCases: [],
      timeLimit: 1000,
      memoryLimit: 256,
      solutionApproach: "",
      complexityAnalysis: "",
    });
  },

  async evaluateMCQAnswer(question: string, userAnswer: string, correctAnswer: string) {
    const prompt = `Evaluate this MCQ attempt.

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Return ONLY valid JSON:
{
  "isCorrect": true/false,
  "userAnswer": "${userAnswer}",
  "correctAnswer": "${correctAnswer}",
  "explanation": "Why the correct answer is right",
  "whyWrong": "Why the user's answer was wrong (if applicable)",
  "topicReview": "What topic to review",
  "difficulty": "Easy|Medium|Hard"
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, {
      isCorrect: false,
      userAnswer,
      correctAnswer,
      explanation: "",
      whyWrong: "",
      topicReview: "",
      difficulty: "Medium",
    });
  },

  async conductMockInterview(question: string, userAnswer: string, userContext?: any) {
    const contextBlock = userContext ? `
## USER CONTEXT
- Target Role: ${userContext.targetRole || "Not specified"}
- Current Level: ${userContext.currentLevel || "Not specified"}
- Resume: ${userContext.resume ? userContext.resume.substring(0, 1500) : "Not provided"}
- Job Description: ${userContext.jobDescription ? userContext.jobDescription.substring(0, 1500) : "Not provided"}

Consider whether the answer aligns with the user's experience level, target role, and resume context when scoring.` : "";

    const prompt = `Evaluate this mock interview response:

Question: ${question}
User's Answer: ${userAnswer}
${contextBlock}

Return ONLY valid JSON matching this schema:
{
  "scores": {
    "technicalAccuracy": 0-10,
    "completeness": 0-10,
    "clarity": 0-10,
    "depthOfKnowledge": 0-10,
    "practicalExperience": 0-10,
    "communication": 0-10
  },
  "overallScore": 0-60,
  "overallRating": "Excellent|Good|Average|Needs Work",
  "strengths": ["Strength 1"],
  "areasForImprovement": ["Area 1"],
  "suggestedAnswer": "What a strong answer would include",
  "keyMissingPoints": ["Point 1"],
  "recommendedResources": ["Resource 1"],
  "followUpQuestions": ["Question 1"]
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction: INTERVIEW_EVALUATION_CONTEXT },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, {
      scores: { technicalAccuracy: 0, completeness: 0, clarity: 0, depthOfKnowledge: 0, practicalExperience: 0, communication: 0 },
      overallScore: 0,
      overallRating: "Needs Work",
      strengths: [],
      areasForImprovement: [],
      suggestedAnswer: "",
      keyMissingPoints: [],
      recommendedResources: [],
      followUpQuestions: [],
    });
  },

  async generateFlowDiagram(topic: string) {
    const prompt = `Generate a flow diagram for "${topic}".

Return ONLY valid JSON matching this schema:
{
  "title": "Diagram title",
  "description": "What this diagram represents",
  "nodes": [
    {"id": "1", "label": "Node label", "type": "process|decision|start|end|database|input|output", "description": "What this node does"}
  ],
  "edges": [
    {"from": "1", "to": "2", "label": "Flow description", "type": "arrow|dashed|bidirectional"}
  ],
  "explanations": {
    "1": "Detailed explanation of node 1"
  }
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction: INTERVIEW_DIAGRAM_CONTEXT },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, { title: "", description: "", nodes: [], edges: [], explanations: {} });
  },

  async generateNotes(topic: string, type: string) {
    const prompt = `Generate ${type} notes for the topic "${topic}".

Return ONLY valid JSON. For type "${type}", use the appropriate schema from the system instructions.`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction: INTERVIEW_NOTES_CONTEXT },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, { title: "", sections: [], summary: "" });
  },

  async generateRecommendations(userId: string) {
    const [progressRes, questionsRes, mcqsRes, codingRes, searchesRes] = await Promise.all([
      pool.query(`SELECT * FROM "UserInterviewProgress" WHERE "userId" = $1 LIMIT 1`, [userId]),
      pool.query(`SELECT * FROM "InterviewQuestion" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [userId]),
      pool.query(`SELECT mcqa.*, mcq.category FROM "MCQAttempt" mcqa JOIN "MCQ" mcq ON mcq.id = mcqa."mcqId" WHERE mcqa."userId" = $1 ORDER BY mcqa."createdAt" DESC LIMIT 50`, [userId]),
      pool.query(`SELECT * FROM "CodingSubmission" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [userId]),
      pool.query(`SELECT * FROM "InterviewSearchLog" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [userId]),
    ]);
    const progress = progressRes.rows[0];
    const recentQuestions = questionsRes.rows;
    const mcqsCompleted = mcqsRes.rows;
    const codingSolved = codingRes.rows;
    const recentSearches = searchesRes.rows;

    const categories = [...new Set(recentQuestions.map((q: any) => q.category).filter(Boolean))];
    const languages = [...new Set(codingSolved.map((s: any) => s.language).filter(Boolean))];
    const searchQueries = recentSearches.map((l: any) => l.query);

    const userProfile = {
      questionsSolved: progress?.questionsSolved || 0,
      mcqsCompleted: progress?.mcqsCompleted || 0,
      codingSolved: progress?.codingProblemsSolved || 0,
      averageScore: progress?.averageScore || 0,
      weakTopics: progress?.weakTopics || [],
      strongTopics: progress?.strongTopics || [],
      recentCategories: categories,
      mcqPerformance: mcqsCompleted.map((a: any) => ({
        category: a.mcq.category,
        correct: a.isCorrect,
      })),
      codingLanguages: languages,
      searchHistory: searchQueries,
    };

    const prompt = `Based on this user's interview preparation data, generate personalized recommendations.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Return ONLY valid JSON matching this schema:
{
  "recommendations": [
    {
      "type": "topic|weak-area|revision|interview-plan|coding-challenge|mcq|article|video",
      "title": "Recommendation title",
      "description": "Why this is recommended",
      "priority": 0-10,
      "reason": "Data-driven reason for this recommendation"
    }
  ],
  "weakAreas": ["Area 1", "Area 2"],
  "suggestedFocus": "What to focus on next",
  "estimatedPreparationLevel": "Beginner|Intermediate|Advanced|Interview Ready"
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, {
      recommendations: [],
      weakAreas: [],
      suggestedFocus: "",
      estimatedPreparationLevel: "Beginner",
    });
  },

  async searchQuestions(query: string, category?: string, difficulty?: string) {
    const params: any[] = [`%${query}%`, `%${query}%`, query.toLowerCase()];
    let extra = "";
    if (category) { extra += ` AND category = $${params.length + 1}`; params.push(category); }
    if (difficulty) { extra += ` AND difficulty = $${params.length + 1}`; params.push(difficulty); }

    const { rows } = await pool.query(
      `SELECT * FROM "InterviewQuestion" WHERE (question ILIKE $1 OR answer ILIKE $2 OR $3 = ANY(tags))${extra} ORDER BY "createdAt" DESC LIMIT 50`,
      params
    );
    return rows;
  },

  async aiCodeReview(code: string, language: string, problemDescription: string) {
    const prompt = `Review this ${language} code for the following problem:

Problem: ${problemDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON matching this schema:
{
  "overallRating": "Excellent|Good|Needs Improvement|Poor",
  "correctness": "Is the solution correct?",
  "codeQuality": "Assessment of code quality, naming, structure",
  "complexity": "Time and space complexity analysis",
  "potentialBugs": ["Bug 1", "Bug 2"],
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "optimizations": ["Optimization 1", "Optimization 2"],
  "bestPractices": ["Best practice 1", "Best practice 2"],
  "securityConcerns": ["Security issue 1"],
  "suggestedImprovements": ["Improvement 1"],
  "refactoredCode": "Optional improved version of the code"
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("No response from AI");
    return safeParse(response.text, {
      overallRating: "Needs Improvement",
      correctness: "",
      codeQuality: "",
      complexity: "",
      potentialBugs: [],
      edgeCases: [],
      optimizations: [],
      bestPractices: [],
      securityConcerns: [],
      suggestedImprovements: [],
      refactoredCode: "",
    });
  },
};
