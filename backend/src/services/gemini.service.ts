import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[GEMINI] GEMINI_API_KEY not set — AI features will fail with 500 errors');
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

function safeParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error('[GEMINI] Failed to parse AI response as JSON:', text.substring(0, 200));
    return fallback;
  }
}

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

    let fileState = await ai.files.get({ name: file.name });
    let retries = 0;
    const MAX_RETRIES = 60;
    while (fileState.state === 'PROCESSING' && retries < MAX_RETRIES) {
      console.log(`Waiting for file processing: ${file.name}...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      fileState = await ai.files.get({ name: file.name });
      retries++;
    }

    if (retries >= MAX_RETRIES) {
      throw new Error(`Gemini file processing timed out after ${MAX_RETRIES * 5} seconds: ${file.name}`);
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
    return safeParse(response.text, { summary: "", chapterSummaries: [], keyConcepts: [], topics: [], interviewQuestions: [], mcqs: [], flashcards: [], mindMapData: [], revisionChecklist: [] });
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
    return safeParse(response.text, { summary: "", chapterSummaries: [], keyConcepts: [], topics: [], interviewQuestions: [], mcqs: [], flashcards: [], mindMapData: [], revisionChecklist: [] });
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
    return safeParse(response.text, { summary: "", keywords: [] });
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
   * Detects if an image contains a human face.
   */
  async detectFace(imageBase64: string): Promise<{ hasFace: boolean; message: string }> {
    const text = 'Analyze this image. Does it contain a clear human face? Reply with ONLY valid JSON: {"hasFace": true/false, "message": "reason"}';

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        { text },
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
      ],
      config: { responseMimeType: 'application/json' },
    });

    if (!response.text) return { hasFace: false, message: 'No response from AI' };
    return safeParse(response.text, { hasFace: false, message: 'Failed to parse AI response' });
  },

  /**
   * Verifies a face image against a stored reference image.
   * Checks: 1) Is there a face visible? 2) Eyes are open (liveness)? 
   * 3) Does it match the reference face?
   */
  async verifyFace(liveImageBase64: string, referenceImageBase64: string): Promise<{ match: boolean; eyesOpen: boolean; faceDetected: boolean; message: string; matchScore: number }> {
    const prompt = `You are a face verification system. Analyze the two images provided.
- The first image (LIVE) is a real-time webcam capture of a person trying to log in.
- The second image (REFERENCE) is the stored reference photo of the authorized user.

You must return ONLY valid JSON in this exact format:
{
  "faceDetected": true/false,
  "eyesOpen": true/false,
  "match": true/false,
  "matchScore": 0-100,
  "confidence": "high/medium/low",
  "message": "Brief explanation of the result"
}

Rules:
- "faceDetected": true only if a clear human face is visible in the LIVE image
- "eyesOpen": true only if the person's eyes are clearly open (not blinking/closed) in the LIVE image
- "match": true only if the two faces are the SAME PERSON with matchScore >= 90
- "matchScore": a number from 0 to 100 representing how confident you are the faces match (100 = identical, 0 = completely different)
- Be strict about the match - only return true if matchScore >= 90`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: liveImageBase64,
          }
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: referenceImageBase64,
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error("No response from Gemini");
    const parsed = safeParse(response.text, { match: false, eyesOpen: false, faceDetected: false, message: 'Failed to parse AI response', matchScore: 0, confidence: 'low' });
    if (parsed.matchScore !== undefined && parsed.matchScore < 90) {
      parsed.match = false;
    }
    return parsed;
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
    return safeParse(response.text, { summary: '', recommendations: [], metrics: { totalActiveMinutes: 0, tasksCompleted: 0, documentsRead: 0 } });
  }
};