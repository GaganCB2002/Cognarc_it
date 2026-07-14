-- Cognarc It PostgreSQL Schema
-- Generated from Prisma Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "TrackingSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EventCategory" AS ENUM ('LEARNING', 'CODING', 'READING', 'VIDEO', 'QUIZ', 'TASK', 'NOTE', 'AI_ASSISTANT', 'DOCUMENT', 'RESOURCE', 'CALENDAR', 'MEETING', 'BREAK', 'IDLE', 'OTHER');
CREATE TYPE "CalendarViewType" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'MULTI_YEAR', 'TIMELINE', 'AGENDA', 'HEATMAP');
CREATE TYPE "RecurrenceType" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "ReportType" AS ENUM ('SESSION_SUMMARY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'STUDENT', 'PREMIUM_USER', 'GUEST');
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB', 'MICROSOFT');
CREATE TYPE "SessionType" AS ENUM ('GENERAL', 'CODING', 'READING', 'VIDEO', 'QUIZ');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'LINK', 'CODE', 'IMAGE', 'AUDIO', 'OTHER');
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3', 'CLOUDINARY', 'GITHUB', 'GOOGLE_DRIVE', 'SUPABASE');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'DELETED');
CREATE TYPE "NotificationType" AS ENUM ('REMINDER', 'ACHIEVEMENT', 'SYSTEM', 'MENTOR');

-- Users
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'STUDENT' NOT NULL,
  "isApproved" BOOLEAN DEFAULT false NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  "otpCode" TEXT,
  "otpExpiresAt" TIMESTAMPTZ,
  avatar TEXT,
  "refreshToken" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE "Profile" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id),
  bio TEXT,
  "targetRole" TEXT,
  "currentLevel" TEXT,
  "weeklyHours" INT,
  timezone TEXT,
  skills JSONB,
  "careerGoals" TEXT,
  "githubUrl" TEXT,
  "linkedinUrl" TEXT,
  "portfolioUrl" TEXT,
  resume TEXT,
  "jobDescription" TEXT
);

CREATE TABLE "LearningStreak" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id),
  "currentStreak" INT DEFAULT 0 NOT NULL,
  "longestStreak" INT DEFAULT 0 NOT NULL,
  "lastActiveDate" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Study Sessions
CREATE TABLE "StudySession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration INT NOT NULL,
  type "SessionType" DEFAULT 'GENERAL' NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tasks
CREATE TABLE "Task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority "Priority" DEFAULT 'MEDIUM' NOT NULL,
  status "TaskStatus" DEFAULT 'TODO' NOT NULL,
  "dueDate" TIMESTAMPTZ,
  category TEXT,
  checklist JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "Task"("userId", status);
CREATE INDEX ON "Task"("userId", priority);
CREATE INDEX ON "Task"("userId", "dueDate");

-- Notes
CREATE TABLE "Note" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "folderId" TEXT,
  "isPinned" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "Note"("userId", "createdAt");
CREATE INDEX ON "Note"("userId", "isPinned");
CREATE INDEX ON "Note"("folderId");

-- Resources
CREATE TABLE "Resource" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  type "ResourceType" NOT NULL,
  url TEXT,
  "fileKey" TEXT,
  "fileSize" INT,
  "mimeType" TEXT,
  tags TEXT[] DEFAULT '{}',
  "collectionId" UUID REFERENCES "Collection"(id) ON DELETE SET NULL,
  "isFavorite" BOOLEAN DEFAULT false NOT NULL,
  "isUpload" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "Resource"("userId");
CREATE INDEX ON "Resource"("userId", type);
CREATE INDEX ON "Resource"("userId", "isFavorite");

-- Collections
CREATE TABLE "Collection" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type "NotificationType" NOT NULL,
  "isRead" BOOLEAN DEFAULT false NOT NULL,
  "actionUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "Notification"("userId", "createdAt");
CREATE INDEX ON "Notification"("userId", "isRead");
CREATE INDEX ON "Notification"("userId", "isRead", "createdAt");

-- ActivityLog
CREATE TABLE "ActivityLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tracking Sessions
CREATE TABLE "TrackingSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  status "TrackingSessionStatus" DEFAULT 'ACTIVE' NOT NULL,
  "deviceId" TEXT,
  "deviceName" TEXT,
  "projectName" TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ,
  "pausedAt" TIMESTAMPTZ,
  "totalPauseMs" INT DEFAULT 0 NOT NULL,
  "lastActivity" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "TrackingSession"("userId");
CREATE INDEX ON "TrackingSession"("userId", status);
CREATE INDEX ON "TrackingSession"("userId", "startTime");
CREATE INDEX ON "TrackingSession"("deviceId");

-- Activity Events
CREATE TABLE "ActivityEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "trackingSessionId" UUID NOT NULL REFERENCES "TrackingSession"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  category "EventCategory" DEFAULT 'OTHER' NOT NULL,
  module TEXT,
  "entityId" TEXT,
  "entityType" TEXT,
  label TEXT,
  duration INT DEFAULT 0 NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "ActivityEvent"("trackingSessionId");
CREATE INDEX ON "ActivityEvent"("userId");
CREATE INDEX ON "ActivityEvent"("userId", "createdAt");
CREATE INDEX ON "ActivityEvent"("userId", category);
CREATE INDEX ON "ActivityEvent"("eventType");
CREATE INDEX ON "ActivityEvent"("createdAt");

-- Calendar Events
CREATE TABLE "CalendarEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "eventType" TEXT NOT NULL,
  color TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ,
  "isAllDay" BOOLEAN DEFAULT false NOT NULL,
  "isRecurring" BOOLEAN DEFAULT false NOT NULL,
  "recurrenceType" "RecurrenceType",
  "recurrenceRule" JSONB,
  "recurrenceEnd" TIMESTAMPTZ,
  timezone TEXT,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "CalendarEvent"("userId");
CREATE INDEX ON "CalendarEvent"("userId", "startTime");
CREATE INDEX ON "CalendarEvent"("userId", "eventType");
CREATE INDEX ON "CalendarEvent"("startTime", "endTime");

-- Reports
CREATE TABLE "Report" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "trackingSessionId" UUID REFERENCES "TrackingSession"(id) ON DELETE SET NULL,
  type "ReportType" NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  "durationSeconds" INT DEFAULT 0 NOT NULL,
  "productivityScore" FLOAT,
  "focusScore" FLOAT,
  metrics JSONB,
  "chartData" JSONB,
  recommendations JSONB,
  insights JSONB,
  technologies TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "Report"("userId");
CREATE INDEX ON "Report"("userId", "createdAt");
CREATE INDEX ON "Report"("trackingSessionId");

-- Export Logs
CREATE TABLE "ExportLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  format "ExportFormat" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "fileName" TEXT NOT NULL,
  "fileSize" INT,
  "storageKey" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "ExportLog"("userId");
CREATE INDEX ON "ExportLog"("userId", "createdAt");

-- Notification Preferences
CREATE TABLE "NotificationPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT UNIQUE NOT NULL,
  "studyReminders" BOOLEAN DEFAULT true NOT NULL,
  "revisionReminders" BOOLEAN DEFAULT true NOT NULL,
  "taskReminders" BOOLEAN DEFAULT true NOT NULL,
  "meetingReminders" BOOLEAN DEFAULT true NOT NULL,
  "goalReminders" BOOLEAN DEFAULT true NOT NULL,
  channels "NotificationChannel"[] DEFAULT '{IN_APP}',
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  timezone TEXT
);

-- Documents
CREATE TABLE "Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  size INT NOT NULL,
  "storageProvider" "StorageProvider" DEFAULT 'LOCAL' NOT NULL,
  "storageKey" TEXT UNIQUE NOT NULL,
  "publicUrl" TEXT,
  "resourceType" "ResourceType" NOT NULL,
  status "DocumentStatus" DEFAULT 'READY' NOT NULL,
  folder TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "resourceId" UUID UNIQUE REFERENCES "Resource"(id) ON DELETE SET NULL
);
CREATE INDEX ON "Document"("userId");
CREATE INDEX ON "Document"("userId", "resourceType");
CREATE INDEX ON "Document"("storageKey");

-- Browser Telemetry
CREATE TABLE "BrowserTelemetry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "trackingSessionId" UUID REFERENCES "TrackingSession"(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT,
  domain TEXT NOT NULL,
  duration INT NOT NULL,
  category TEXT,
  "timestamp" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "BrowserTelemetry"("trackingSessionId", "userId", "timestamp");
CREATE INDEX ON "BrowserTelemetry"("userId", "timestamp");
CREATE INDEX ON "BrowserTelemetry"("trackingSessionId", category);

-- Desktop Telemetry
CREATE TABLE "DesktopTelemetry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "trackingSessionId" UUID REFERENCES "TrackingSession"(id) ON DELETE SET NULL,
  "activeApp" TEXT NOT NULL,
  "windowTitle" TEXT NOT NULL,
  "processName" TEXT,
  duration INT NOT NULL,
  "isIdle" BOOLEAN DEFAULT false NOT NULL,
  category TEXT,
  "timestamp" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "DesktopTelemetry"("trackingSessionId", "userId", "timestamp");
CREATE INDEX ON "DesktopTelemetry"("userId", "timestamp");
CREATE INDEX ON "DesktopTelemetry"("trackingSessionId", category);

-- AI Conversation
CREATE TABLE "AIConversation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat' NOT NULL,
  "documentId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "AIConversation"("userId");
CREATE INDEX ON "AIConversation"("documentId");

CREATE TABLE "AIMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "AIConversation"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "AIMessage"("conversationId");

-- Document Intelligence
CREATE TABLE "DocumentIntelligence" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" UUID UNIQUE NOT NULL REFERENCES "Document"(id) ON DELETE CASCADE,
  summary TEXT,
  "chapterSummaries" JSONB,
  "keyConcepts" JSONB,
  topics JSONB,
  "interviewQuestions" JSONB,
  mcqs JSONB,
  flashcards JSONB,
  "mindMapData" JSONB,
  "revisionChecklist" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Note Intelligence
CREATE TABLE "NoteIntelligence" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "noteId" UUID UNIQUE NOT NULL REFERENCES "Note"(id) ON DELETE CASCADE,
  summary TEXT,
  keywords JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Daily Summary
CREATE TABLE "DailySummary" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB,
  metrics JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("userId", date)
);
CREATE INDEX ON "DailySummary"("userId");

-- Interview Questions
CREATE TABLE "InterviewQuestion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'Intermediate' NOT NULL,
  category TEXT NOT NULL,
  type TEXT DEFAULT 'Theory' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "companyFrequency" JSONB,
  "similarQuestions" JSONB,
  "relatedTopics" TEXT[] DEFAULT '{}',
  "isAIGenerated" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "InterviewQuestion"("userId");
CREATE INDEX ON "InterviewQuestion"(category);
CREATE INDEX ON "InterviewQuestion"(difficulty);
CREATE INDEX ON "InterviewQuestion"("userId", category);

-- Company Questions
CREATE TABLE "CompanyQuestion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT,
  experience TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'Intermediate' NOT NULL,
  technology TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "CompanyQuestion"("userId");
CREATE INDEX ON "CompanyQuestion"(company);
CREATE INDEX ON "CompanyQuestion"(difficulty);

-- AI Interview Conversation
CREATE TABLE "AIInterviewConversation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT DEFAULT 'New Interview Chat' NOT NULL,
  type TEXT DEFAULT 'qa' NOT NULL,
  "isPinned" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "AIInterviewConversation"("userId");
CREATE INDEX ON "AIInterviewConversation"("userId", type);

CREATE TABLE "AIInterviewMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "AIInterviewConversation"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "AIInterviewMessage"("conversationId");

-- User Saved Items
CREATE TABLE "UserSavedItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  label TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("userId", "itemType", "itemId")
);
CREATE INDEX ON "UserSavedItem"("userId");
CREATE INDEX ON "UserSavedItem"("userId", "itemType");

-- User Bookmarks
CREATE TABLE "UserBookmark" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  label TEXT,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("userId", "itemType", "itemId")
);
CREATE INDEX ON "UserBookmark"("userId");
CREATE INDEX ON "UserBookmark"("userId", "itemType");

-- MCQ
CREATE TABLE "MCQ" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  "correctAnswer" INT NOT NULL,
  explanation TEXT,
  category TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT DEFAULT 'Medium' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "timeLimit" INT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "MCQ"("userId");
CREATE INDEX ON "MCQ"(category);
CREATE INDEX ON "MCQ"(difficulty);

CREATE TABLE "MCQAttempt" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "mcqId" UUID NOT NULL REFERENCES "MCQ"(id) ON DELETE CASCADE,
  "selectedAnswer" INT,
  "isCorrect" BOOLEAN,
  "timeTaken" INT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "MCQAttempt"("userId");
CREATE INDEX ON "MCQAttempt"("mcqId");

-- Coding Problems
CREATE TABLE "CodingProblem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  examples JSONB,
  constraints TEXT,
  difficulty TEXT DEFAULT 'Medium' NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  "sampleTestCases" JSONB,
  "hiddenTestCases" JSONB,
  "timeLimit" INT,
  "memoryLimit" INT,
  "isAIGenerated" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "CodingProblem"("userId");
CREATE INDEX ON "CodingProblem"(difficulty);
CREATE INDEX ON "CodingProblem"(category);

CREATE TABLE "CodingSubmission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "problemId" UUID NOT NULL REFERENCES "CodingProblem"(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL,
  "passedTests" INT DEFAULT 0 NOT NULL,
  "totalTests" INT DEFAULT 0 NOT NULL,
  runtime INT,
  memory INT,
  "aiReview" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "CodingSubmission"("userId");
CREATE INDEX ON "CodingSubmission"("problemId");
CREATE INDEX ON "CodingSubmission"(status);

-- Interview Sessions
CREATE TABLE "InterviewSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'in-progress' NOT NULL,
  difficulty TEXT DEFAULT 'Intermediate' NOT NULL,
  questions JSONB,
  "currentQuestionIndex" INT DEFAULT 0 NOT NULL,
  "totalQuestions" INT DEFAULT 0 NOT NULL,
  context TEXT,
  "timeLimit" INT,
  "timeTaken" INT,
  "technicalScore" FLOAT,
  "communicationScore" FLOAT,
  "confidenceScore" FLOAT,
  "overallScore" FLOAT,
  feedback TEXT,
  "improvementSuggestions" JSONB,
  "startedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "InterviewSession"("userId");
CREATE INDEX ON "InterviewSession"("userId", type);
CREATE INDEX ON "InterviewSession"("userId", status);

-- Interview Notes
CREATE TABLE "InterviewNote" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "isPinned" BOOLEAN DEFAULT false NOT NULL,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "InterviewNote"("userId");
CREATE INDEX ON "InterviewNote"("userId", type);
CREATE INDEX ON "InterviewNote"("userId", "isPinned");

-- User Interview Progress
CREATE TABLE "UserInterviewProgress" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT UNIQUE NOT NULL,
  "questionsSolved" INT DEFAULT 0 NOT NULL,
  "mcqsCompleted" INT DEFAULT 0 NOT NULL,
  "codingProblemsSolved" INT DEFAULT 0 NOT NULL,
  "interviewSessions" INT DEFAULT 0 NOT NULL,
  "averageScore" FLOAT,
  "weakTopics" JSONB,
  "strongTopics" JSONB,
  "dailyProgress" JSONB,
  "weeklyProgress" JSONB,
  "monthlyProgress" JSONB,
  "learningStreak" INT DEFAULT 0 NOT NULL,
  "longestStreak" INT DEFAULT 0 NOT NULL,
  "lastActiveDate" TIMESTAMPTZ,
  "totalStudyTime" INT DEFAULT 0 NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Interview Recommendations
CREATE TABLE "InterviewRecommendation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INT DEFAULT 0 NOT NULL,
  reason TEXT,
  "isCompleted" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "InterviewRecommendation"("userId");
CREATE INDEX ON "InterviewRecommendation"("userId", type);
CREATE INDEX ON "InterviewRecommendation"("userId", "isCompleted");

-- Interview Search Logs
CREATE TABLE "InterviewSearchLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  query TEXT NOT NULL,
  category TEXT,
  results INT DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "InterviewSearchLog"("userId");
CREATE INDEX ON "InterviewSearchLog"("userId", "createdAt");

-- ============================================================================
-- Login Tracking & User Sessions (Clerk Integration)
-- ============================================================================

-- User Login Tracking: stores every login event with a unique hash
CREATE TABLE "UserLogin" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "loginHash" TEXT NOT NULL,
  "loginCount" INT DEFAULT 0 NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "loginMethod" TEXT DEFAULT 'clerk' NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "loggedInAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "lastActiveAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON "UserLogin"("userId");
CREATE INDEX ON "UserLogin"("userId", "loginHash");
CREATE INDEX ON "UserLogin"("userId", "loggedInAt");

-- User Login Stats: aggregated login statistics per user
CREATE TABLE "UserLoginStats" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT UNIQUE NOT NULL,
  "totalLogins" INT DEFAULT 0 NOT NULL,
  "lastLoginAt" TIMESTAMPTZ,
  "lastIpAddress" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);
