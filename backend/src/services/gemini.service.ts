import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Note: Ensure GEMINI_API_KEY is defined in your .env file.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const JSON_MODEL = "gemini-2.5-flash";
const TEXT_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-pro";

export const geminiService = {
  /**
   * Uploads a file to Gemini's File API and waits for it to be processed.
   * Useful for PDFs, Audio, Video, and Images.
   */
  async uploadFile(filePath: string, mimeType: string, displayName?: string) {
    console.log(`Uploading file to Gemini API: ${filePath}`);
    
    // Convert absolute path to a local file stream or path that genai accepts.
    const file = await ai.files.upload({
      file: filePath,
      config: {
        mimeType,
        displayName,
      }
    });

    if (!file.name) {
      throw new Error("Failed to get file name from Gemini");
    }

    console.log(`Uploaded file as ${file.name}`);

    // Wait until the file is active (some videos/PDFs take time to process)
    let fileState = await ai.files.get({ name: file.name });
    while (fileState.state === 'PROCESSING') {
      console.log(`Waiting for file processing: ${file.name}...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      fileState = await ai.files.get({ name: file.name });
    }

    if (fileState.state === 'FAILED') {
      throw new Error(`Gemini failed to process the file: ${file.name}`);
    }

    if (!fileState.uri || !fileState.name) {
       throw new Error(`Gemini file is missing URI or name`);
    }

    return {
      uri: fileState.uri,
      name: fileState.name
    };
  },

  async deleteFile(name: string) {
    try {
      await ai.files.delete({ name });
      console.log(`Deleted Gemini file: ${name}`);
    } catch (e) {
      console.error(`Failed to delete Gemini file: ${name}`, e);
    }
  },

  /**
   * Extracts a structured JSON summary and intelligence from a text.
   */
  async generateDocumentIntelligenceFromText(text: string) {
    const prompt = `Analyze the following document text and extract structured intelligence.
You must return ONLY valid JSON matching this schema:
{
  "summary": "A comprehensive summary of the document (3-5 paragraphs).",
  "chapterSummaries": [{"chapter": "Title", "summary": "brief summary"}],
  "keyConcepts": ["Concept 1", "Concept 2", ...],
  "topics": ["Topic 1", "Topic 2", ...],
  "interviewQuestions": [{"question": "Q?", "answer": "A"}],
  "mcqs": [{"question": "Q?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}],
  "flashcards": [{"front": "Term", "back": "Definition"}],
  "mindMapData": [{"node": "Root", "children": ["Child 1", "Child 2"]}],
  "revisionChecklist": ["Task 1", "Task 2", ...]
}

Document Text:
"""
${text.substring(0, 500000)}
"""`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text);
  },

  /**
   * Extracts a structured JSON summary and intelligence using the Gemini File API.
   */
  async generateDocumentIntelligenceFromFile(geminiFileUri: string) {
    const prompt = `Analyze the provided document/media and extract structured intelligence.
You must return ONLY valid JSON matching this schema:
{
  "summary": "A comprehensive summary of the document (3-5 paragraphs).",
  "chapterSummaries": [{"chapter": "Title/Timestamp", "summary": "brief summary"}],
  "keyConcepts": ["Concept 1", "Concept 2", ...],
  "topics": ["Topic 1", "Topic 2", ...],
  "interviewQuestions": [{"question": "Q?", "answer": "A"}],
  "mcqs": [{"question": "Q?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}],
  "flashcards": [{"front": "Term", "back": "Definition"}],
  "mindMapData": [{"node": "Root", "children": ["Child 1", "Child 2"]}],
  "revisionChecklist": ["Task 1", "Task 2", ...]
}`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: [
        {
          fileData: {
            fileUri: geminiFileUri,
            mimeType: 'application/pdf', // This is overridden by the actual file type inside the file reference, but typings might require it. We will just pass the URI.
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text);
  },

  /**
   * Extracts note intelligence
   */
  async generateNoteIntelligence(content: string) {
    const prompt = `Analyze the following user note and extract structured intelligence.
You must return ONLY valid JSON matching this schema:
{
  "summary": "A short summary (1-2 sentences).",
  "keywords": ["tag1", "tag2", "tag3"]
}

Note:
"""
${content}
"""`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text);
  },

  /**
   * Chat implementation for a specific conversation
   */
  async chat(history: { role: 'user' | 'model', content: string }[], newMessage: string, documentFileUri?: string, systemInstruction?: string) {
    // Convert generic history to Gemini API format
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const config: any = {
      model: CHAT_MODEL,
      history: formattedHistory,
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const chat = ai.chats.create(config);

    let parts: any[] = [{ text: newMessage }];
    
    if (documentFileUri && history.length === 0) {
       // Attach the file on the very first message of the conversation
       parts.unshift({
         fileData: {
           fileUri: documentFileUri,
           mimeType: 'application/pdf' // dummy, actual is resolved by URI
         }
       });
       parts.unshift({ text: "Please use the attached document as context for this conversation." });
    }

    const response = await chat.sendMessage({ message: parts as any });
    return response.text || "No response";
  },

  /**
   * One-shot generation with system instruction (no history).
   * Useful for project-aware Q&A without maintaining a conversation.
   */
  async generateWithContext(prompt: string, systemInstruction: string) {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text || "No response";
  },

  /**
   * Generates a daily summary based on activity.
   */
  async generateDailySummary(activities: any) {
    const prompt = `You are a learning assistant. The user has completed the following activities today:
${JSON.stringify(activities, null, 2)}

Provide a daily digest in JSON format:
{
  "summary": "A motivating paragraph summarizing their day.",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "metrics": {"totalActiveMinutes": 120, "tasksCompleted": 3, "documentsRead": 1}
}
`;

    const response = await ai.models.generateContent({
      model: JSON_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    return JSON.parse(response.text);
  }
};