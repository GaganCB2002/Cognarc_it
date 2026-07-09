import { GoogleGenAI } from '@google/genai';
import { geminiService } from "./gemini.service";
import { PROJECT_SYSTEM_CONTEXT, CAREER_COACH_CONTEXT } from "../data/project-context";

export const generateSummary = async (text: string) => {
  const result = await geminiService.generateDocumentIntelligenceFromText(text);
  return {
    summary: result.summary,
    keyTopics: result.topics,
  };
};

export const generateQuiz = async (text: string) => {
  const result = await geminiService.generateDocumentIntelligenceFromText(text);
  return result.mcqs.map((mcq: any, index: number) => ({
    id: `q${index + 1}`,
    ...mcq
  }));
};

export const chatWithTutor = async (messages: { role: string; content: string }[], documentFileUri?: string) => {
  // Extract history (all except last)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role as 'user' | 'model',
    content: m.content
  }));
  const newMessage = messages[messages.length - 1]?.content || "";
  
  return await geminiService.chat(history, newMessage, documentFileUri, PROJECT_SYSTEM_CONTEXT);
};

export const askProjectQuestion = async (question: string) => {
  return await geminiService.generateWithContext(question, PROJECT_SYSTEM_CONTEXT);
};

export const chatWithCareerCoach = async (messages: { role: string; content: string }[]) => {
  const history = messages.slice(0, -1).map(m => ({
    role: m.role as 'user' | 'model',
    content: m.content
  }));
  const newMessage = messages[messages.length - 1]?.content || "";
  return await geminiService.chat(history, newMessage, undefined, CAREER_COACH_CONTEXT);
};

export const generateAIInsights = async (topics: string[]) => {
  // Using gemini to get a proper profile
  const prompt = `Based on these study topics: ${topics.join(", ")}, generate a JSON profile of the user.
  Return ONLY valid JSON matching this schema:
  {
    "profileType": "string",
    "profileDesc": "string",
    "coreProficiencies": ["string"],
    "interviewQuestions": ["string"]
  }`;
  
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  
  if (response.text) {
    return JSON.parse(response.text);
  }
  
  return {
    profileType: "Unknown Profile",
    profileDesc: "Could not generate profile.",
    coreProficiencies: [],
    interviewQuestions: []
  };
};