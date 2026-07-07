/**
 * AI Service for StudyTrack
 * 
 * This service currently uses mocked responses.
 * To integrate with a real LLM (OpenAI/Gemini), you would replace these mocks
 * with calls to the respective SDKs (e.g. `openai.chat.completions.create`).
 */

export const generateSummary = async (text: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    summary: "This document covers advanced topics in software engineering, specifically focusing on memory models, mutextes, and concurrent programming paradigms. It explains how to safely manage shared state across multiple threads without causing race conditions or deadlocks.",
    keyTopics: ["Mutexes", "Memory Models", "Concurrency", "Race Conditions", "Deadlocks"],
  };
};

export const generateQuiz = async (text: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      id: "q1",
      question: "What is the primary purpose of a Mutex?",
      options: [
        "To speed up execution",
        "To prevent multiple threads from accessing a shared resource simultaneously",
        "To allocate memory dynamically",
        "To manage network connections"
      ],
      correctAnswer: 1,
      explanation: "A Mutex (Mutual Exclusion) ensures that only one thread can access a critical section of code or shared resource at any given time, preventing race conditions."
    },
    {
      id: "q2",
      question: "Which scenario is most likely to cause a deadlock?",
      options: [
        "Two threads reading from the same file",
        "One thread acquiring a lock and releasing it immediately",
        "Two threads each holding a lock the other needs, and waiting for it",
        "A thread sleeping for a long duration"
      ],
      correctAnswer: 2,
      explanation: "A deadlock occurs when two or more threads are blocked forever, each waiting for a lock that the other thread holds."
    }
  ];
};

export const chatWithTutor = async (messages: { role: string, content: string }[]) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

  let response = "That's an excellent question. As your mentor, I recommend breaking this down into smaller components. Let's look at the foundational concepts first.";

  if (lastUserMessage.includes("mutex")) {
    response = "A Mutex (Mutual Exclusion) is crucial for thread safety. Imagine it as a key to a room. Only the thread with the key can enter the room (execute the critical section). When it leaves, it returns the key for another thread to use. \n\n```java\nLock lock = new ReentrantLock();\nlock.lock();\ntry {\n  // Critical section\n} finally {\n  lock.unlock();\n}\n```";
  } else if (lastUserMessage.includes("deadlock")) {
    response = "Deadlocks are the bane of concurrent programming! They happen when you have a circular wait condition. The best way to avoid them is to always acquire locks in a consistent, globally defined order across all threads.";
  }

  return response;
};

export const generateAIInsights = async (topics: string[]) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mainTopic = topics[0] || "Software Engineering";
  
  return {
    profileType: "The Scholar-Practitioner",
    profileDesc: `Your study patterns suggest a focus on high-level integration and infrastructure resilience. You don't just learn syntax; you analyze how ${mainTopic} systems survive within the modern application lifecycle. Your approach is structured, architectural, and obsessed with optimization.`,
    coreProficiencies: [
      mainTopic.toUpperCase().replace(/\s+/g, '_') + "_TUNING",
      "ORCHESTRATION",
      "SYSTEM_ARCHITECTURE",
      "CLOUD_DESIGN"
    ],
    interviewQuestions: [
      `How does ${mainTopic} affect container resource allocation strategies?`,
      `Why should we prefer Multi-stage builds for ${mainTopic} microservices?`,
      `What is the performance impact of network latency on high-throughput ${mainTopic} applications?`
    ]
  };
};
