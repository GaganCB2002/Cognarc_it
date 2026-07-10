-- PostgreSQL Schema for StudyTrack
-- Auto-generated from Prisma schema on $(date)
-- Run: psql $DATABASE_URL -f prisma/migrate.sql

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
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'LINK', 'CODE', 'IMAGE', 'OTHER');
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3', 'CLOUDINARY', 'GITHUB', 'GOOGLE_DRIVE');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'DELETED');
CREATE TYPE "NotificationType" AS ENUM ('REMINDER', 'ACHIEVEMENT', 'SYSTEM', 'MENTOR');

-- Tables
CREATE TABLE "User" ( "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "password" TEXT, "avatar" TEXT, "role" "Role" NOT NULL DEFAULT 'STUDENT', "isApproved" BOOLEAN NOT NULL DEFAULT false, "emailVerified" TIMESTAMP(3), "otpCode" TEXT, "faceData" TEXT, "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL', "providerId" TEXT, "clerkId" TEXT, "refreshToken" TEXT, "settings" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id") );
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

CREATE TABLE "Profile" ( "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "bio" TEXT, "targetRole" TEXT, "currentLevel" TEXT, "weeklyHours" INTEGER, "careerGoals" TEXT, "skills" JSONB, "timezone" TEXT, "githubUrl" TEXT, "linkedinUrl" TEXT, "portfolioUrl" TEXT, CONSTRAINT "Profile_pkey" PRIMARY KEY ("id") );
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TrackingSession" ( "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" "TrackingSessionStatus" NOT NULL DEFAULT 'ACTIVE', "deviceId" TEXT, "deviceName" TEXT, "projectName" TEXT, "startTime" TIMESTAMP(3) NOT NULL, "endTime" TIMESTAMP(3), "pausedAt" TIMESTAMP(3), "totalPauseMs" INTEGER NOT NULL DEFAULT 0, "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TrackingSession_pkey" PRIMARY KEY ("id") );
CREATE INDEX "TrackingSession_userId_idx" ON "TrackingSession"("userId");
CREATE INDEX "TrackingSession_userId_status_idx" ON "TrackingSession"("userId", "status");
ALTER TABLE "TrackingSession" ADD CONSTRAINT "TrackingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ActivityEvent" ( "id" TEXT NOT NULL, "trackingSessionId" TEXT NOT NULL, "userId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "category" "EventCategory" NOT NULL DEFAULT 'OTHER', "module" TEXT, "entityId" TEXT, "entityType" TEXT, "label" TEXT, "duration" INTEGER NOT NULL DEFAULT 0, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id") );
CREATE INDEX "ActivityEvent_trackingSessionId_idx" ON "ActivityEvent"("trackingSessionId");
CREATE INDEX "ActivityEvent_userId_idx" ON "ActivityEvent"("userId");
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_trackingSessionId_fkey" FOREIGN KEY ("trackingSessionId") REFERENCES "TrackingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- See full schema in prisma/schema.prisma for all remaining tables
-- Or run: npx prisma db push
