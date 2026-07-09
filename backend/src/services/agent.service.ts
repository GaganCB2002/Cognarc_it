import { GoogleGenAI } from '@google/genai';
import { prisma } from '../server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AGENT_MODEL = "gemini-2.5-flash";

const AGENT_SYSTEM_INSTRUCTION = `You are StudyBot Pro — an AI agent integrated into the StudyTrack learning platform. You can answer questions AND execute actions in the application.

## CAPABILITIES
You have two modes:
1. **Answer questions** — Provide expert advice on careers, coding, learning, etc.
2. **Execute actions** — When the user wants to do something (add calendar events, create tasks, write notes, etc.), call the appropriate function.

## AVAILABLE FUNCTIONS
When the user asks you to DO something, call the appropriate function with the correct parameters. Always ask for confirmation before executing destructive actions. Extract dates, times, and details naturally from the user's language.

## IMPORTANT RULES
- When the user asks a general question, just answer it directly (don't call functions)
- When the user wants to perform an action, call the appropriate function
- For date/time parsing: "today" = current date, "tomorrow" = next day, "next week" = 7 days from now
- If the user is ambiguous, ask clarifying questions before calling functions
- Keep responses concise and helpful`;

const functionDeclarations: any = [
  {
    name: "add_calendar_event",
    description: "Add an event to the user's calendar",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        startTime: { type: "string", description: "Start time in ISO 8601 format (e.g. 2026-07-09T14:00:00Z)" },
        endTime: { type: "string", description: "End time in ISO 8601 format" },
        description: { type: "string", description: "Event description" },
        eventType: { type: "string", enum: ["LEARNING", "CODING", "TASK", "MEETING", "REVISION", "GOAL", "OTHER"], description: "Type of event" },
        color: { type: "string", description: "Hex color for the event" },
      },
      required: ["title", "startTime"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task in the task manager",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], description: "Task priority" },
        dueDate: { type: "string", description: "Due date in ISO 8601 format" },
        category: { type: "string", description: "Task category (e.g. Learning, Work, Personal)" },
      },
      required: ["title"],
    },
  },
  {
    name: "create_note",
    description: "Create a new note",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Note title" },
        content: { type: "string", description: "Note content" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for the note" },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "get_current_date_time",
    description: "Get the current date and time. Call this when the user says 'today', 'tomorrow', 'now', or any relative time reference.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

async function executeFunctionCall(name: string, args: Record<string, unknown>, userId: string): Promise<Record<string, unknown>> {
  switch (name) {
    case "get_current_date_time": {
      const now = new Date();
      return {
        currentDateTime: now.toISOString(),
        currentDate: now.toISOString().split("T")[0],
        dayOfWeek: now.toLocaleString("en-US", { weekday: "long" }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    case "add_calendar_event": {
      const event = await prisma.calendarEvent.create({
        data: {
          userId,
          title: String(args.title || ""),
          description: String(args.description || ""),
          eventType: String(args.eventType || "OTHER"),
          color: String(args.color || "#06B6D4"),
          startTime: new Date(String(args.startTime)),
          endTime: args.endTime ? new Date(String(args.endTime)) : undefined,
          tags: [],
        },
      });
      return { success: true, eventId: event.id, title: event.title, startTime: event.startTime.toISOString() };
    }

    case "create_task": {
      const task = await prisma.task.create({
        data: {
          userId,
          title: String(args.title || ""),
          description: String(args.description || ""),
          priority: String(args.priority || "MEDIUM") as any,
          dueDate: args.dueDate ? new Date(String(args.dueDate)) : undefined,
          category: String(args.category || ""),
        },
      });
      return { success: true, taskId: task.id, title: task.title };
    }

    case "create_note": {
      const note = await prisma.note.create({
        data: {
          userId,
          title: String(args.title || ""),
          content: String(args.content || ""),
          tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
        },
      });
      return { success: true, noteId: note.id, title: note.title };
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

export const agentService = {
  async processMessage(messages: { role: string; content: string }[], userId: string): Promise<string> {
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    const newMessage = messages[messages.length - 1]?.content || "";

    let turnCount = 0;
    const maxTurns = 10;

    let currentParts: any[] = [{ text: newMessage }];

    while (turnCount < maxTurns) {
      turnCount++;

      const chat = ai.chats.create({
        model: AGENT_MODEL,
        history,
        systemInstruction: AGENT_SYSTEM_INSTRUCTION,
      } as any);

      const response = await chat.sendMessage({
        message: currentParts,
        config: {
          tools: [{ functionDeclarations }],
          temperature: 0.3,
        },
      } as any);

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts) {
        return response.text || "No response from AI";
      }

      const parts = candidate.content.parts;
      const hasFunctionCall = parts.some(p => p.functionCall);

      if (!hasFunctionCall) {
        const textParts = parts.filter(p => p.text).map(p => p.text).filter(Boolean);
        return textParts.join("\n") || "I processed your request.";
      }

      const functionResponseParts: { text?: string; functionResponse?: any }[] = [];

      for (const part of parts) {
        if (part.functionCall) {
          const fc = part.functionCall;
          const name = fc.name || "";
          const args = fc.args || {};
          const id = fc.id;

          try {
            const result = await executeFunctionCall(name, args, userId);
            functionResponseParts.push({
              functionResponse: {
                name,
                response: result,
                id: id || undefined,
              },
            });
          } catch (err: any) {
            functionResponseParts.push({
              functionResponse: {
                name,
                response: { error: err.message || "Function execution failed" },
                id: id || undefined,
              },
            });
          }
        } else if (part.text) {
          functionResponseParts.push({ text: part.text });
        }
      }

      if (functionResponseParts.length > 0) {
        history.push({ role: "user", parts: currentParts } as any);
        history.push({ role: "model", parts: parts as any });
        currentParts = functionResponseParts;
      }
    }

    return "I've completed the operation but may need more information. Please let me know if you need anything else.";
  },
};
