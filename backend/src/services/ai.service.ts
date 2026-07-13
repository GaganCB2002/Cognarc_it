import { geminiService, ai } from "./gemini.service";
import { CAREER_COACH_CONTEXT } from "../data/project-context";

function safeParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error('[AI] Failed to parse AI response as JSON:', text.substring(0, 200));
    return fallback;
  }
}

export const generateSummary = async (text: string) => {
  try {
    const result = await geminiService.generateDocumentIntelligenceFromText(text);
    return {
      summary: result.summary,
      keyTopics: result.topics,
      mcqs: result.mcqs,
      interviewQuestions: result.interviewQuestions,
    };
  } catch (err) {
    console.error('[AI] generateSummary error:', err);
    return { summary: "", keyTopics: [], mcqs: [], interviewQuestions: [] };
  }
};

export const generateQuiz = async (text: string) => {
  try {
    const result = await geminiService.generateDocumentIntelligenceFromText(text);
    return result.mcqs.map((mcq: any, index: number) => ({
      id: `q${index + 1}`,
      ...mcq
    }));
  } catch (err) {
    console.error('[AI] generateQuiz error:', err);
    return [];
  }
};

export const chatWithTutor = async (messages: { role: string; content: string }[], documentFileUri?: string) => {
  try {
    const history = messages.slice(0, -1).map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content
    }));
    const newMessage = messages[messages.length - 1]?.content || "";
    
    return await geminiService.chat(history, newMessage, documentFileUri);
  } catch (err) {
    console.error('[AI] chatWithTutor error:', err);
    return "I apologize, but I encountered an error processing your request. Please try again.";
  }
};

export const chatWithCareerCoach = async (messages: { role: string; content: string }[]) => {
  try {
    const history = messages.slice(0, -1).map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content
    }));
    const newMessage = messages[messages.length - 1]?.content || "";
    return await geminiService.chat(history, newMessage, undefined, CAREER_COACH_CONTEXT);
  } catch (err) {
    console.error('[AI] chatWithCareerCoach error:', err);
    return "I apologize, but I encountered an error processing your request. Please try again.";
  }
};

export const generateAIInsights = async (topics: string[]) => {
  try {
    const prompt = `Based on these study topics: ${topics.join(", ")}, generate a JSON profile of the user.
  Return ONLY valid JSON matching this schema:
  {
    "profileType": "string",
    "profileDesc": "string",
    "coreProficiencies": ["string"],
    "interviewQuestions": ["string"]
  }`;
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    if (response.text) {
      return safeParse(response.text, {
        profileType: "Unknown Profile",
        profileDesc: "Could not generate profile.",
        coreProficiencies: [],
        interviewQuestions: []
      });
    }
    
    return {
      profileType: "Unknown Profile",
      profileDesc: "Could not generate profile.",
      coreProficiencies: [],
      interviewQuestions: []
    };
  } catch (err) {
    console.error('[AI] generateAIInsights error:', err);
    return {
      profileType: "Unknown Profile",
      profileDesc: "Could not generate profile.",
      coreProficiencies: [],
      interviewQuestions: []
    };
  }
};