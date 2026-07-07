-- =============================================================================
-- StudyTrack - Complete PostgreSQL Database Schema
-- =============================================================================
-- This schema defines 15 tables and 7 enum types for the StudyTrack
-- AI Developer Learning OS platform.
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'MENTOR',
  'STUDENT',
  'PREMIUM_USER',
  'GUEST'
);

CREATE TYPE "AuthProvider" AS ENUM (
  'LOCAL',
  'GOOGLE',
  'GITHUB',
  'MICROSOFT'
);

CREATE TYPE "SessionType" AS ENUM (
  'GENERAL',
  'CODING',
  'READING',
  'VIDEO',
  'QUIZ'
);

CREATE TYPE "Priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "TaskStatus" AS ENUM (
  'TODO',
  'IN_PROGRESS',
  'DONE'
);

CREATE TYPE "ResourceType" AS ENUM (
  'PDF',
  'VIDEO',
  'LINK',
  'CODE',
  'IMAGE',
  'OTHER'
);

CREATE TYPE "NotificationType" AS ENUM (
  'REMINDER',
  'ACHIEVEMENT',
  'SYSTEM',
  'MENTOR'
);

CREATE TYPE "StorageProvider" AS ENUM (
  'LOCAL',
  'S3',
  'CLOUDINARY'
);

CREATE TYPE "DocumentStatus" AS ENUM (
  'UPLOADING',
  'READY',
  'FAILED',
  'DELETED'
);

-- =============================================================================
-- TABLE: User
-- Description: Core user account - supports both LOCAL auth and OAuth providers.
--              Passwords are bcrypt-hashed. OAuth users have password = NULL.
-- =============================================================================

CREATE TABLE "User" (
  id              TEXT            PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email           TEXT            NOT NULL UNIQUE,
  name            TEXT            NOT NULL,
  password        TEXT            NULL,                           -- NULL for OAuth users
  avatar          TEXT            NULL,
  role            "Role"          NOT NULL DEFAULT 'STUDENT',
  emailVerified   TIMESTAMP       NULL,
  provider        "AuthProvider"  NOT NULL DEFAULT 'LOCAL',
  providerId      TEXT            NULL,
  refreshToken    TEXT            NULL,
  settings        JSONB           NULL,                           -- Flexible user preferences
  createdAt       TIMESTAMP       NOT NULL DEFAULT NOW(),
  updatedAt       TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_provider ON "User"(provider);

-- =============================================================================
-- TABLE: Session
-- Description: Active login sessions. Each session stores a JWT token hash
--              with device/IP metadata and expiry date.
-- =============================================================================

CREATE TABLE "Session" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId      TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  device      TEXT        NULL,
  ip          TEXT        NULL,
  lastActive  TIMESTAMP   NOT NULL DEFAULT NOW(),
  expiresAt   TIMESTAMP   NOT NULL
);

CREATE INDEX idx_session_userId ON "Session"(userId);
CREATE INDEX idx_session_token ON "Session"(token);

-- =============================================================================
-- TABLE: LoginHistory
-- Description: Historical record of all login attempts with device,
--              browser, OS, and location data for security auditing.
-- =============================================================================

CREATE TABLE "LoginHistory" (
  id        TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  device    TEXT        NULL,
  ip        TEXT        NULL,
  browser   TEXT        NULL,
  os        TEXT        NULL,
  location  TEXT        NULL,
  createdAt TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loginhistory_userId ON "LoginHistory"(userId);
CREATE INDEX idx_loginhistory_createdAt ON "LoginHistory"(createdAt);

-- =============================================================================
-- TABLE: Profile
-- Description: Extended user profile (1:1 with User). Stores career goals,
--              target role, skills, weekly study targets, and timezone.
-- =============================================================================

CREATE TABLE "Profile" (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId       TEXT        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  bio          TEXT        NULL,
  targetRole   TEXT        NULL,
  currentLevel TEXT        NULL,
  weeklyHours  INTEGER     NULL,
  careerGoals  TEXT        NULL,
  skills       JSONB       NULL,
  timezone     TEXT        NULL
);

CREATE INDEX idx_profile_userId ON "Profile"(userId);

-- =============================================================================
-- TABLE: LearningStreak
-- Description: Tracks consecutive days of learning activity (gamification).
--              Updated daily when user logs any study activity.
-- =============================================================================

CREATE TABLE "LearningStreak" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId         TEXT        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  currentStreak  INTEGER     NOT NULL DEFAULT 0,
  longestStreak  INTEGER     NOT NULL DEFAULT 0,
  lastActiveDate DATE        NULL
);

CREATE INDEX idx_learningstreak_userId ON "LearningStreak"(userId);

-- =============================================================================
-- TABLE: StudySession
-- Description: Logged study periods with topic, duration (seconds), type,
--              and optional notes. The core data source for study analytics.
-- =============================================================================

CREATE TABLE "StudySession" (
  id        TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT          NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  topic     TEXT          NOT NULL,
  duration  INTEGER       NOT NULL,       -- Duration in seconds
  type      "SessionType" NOT NULL DEFAULT 'GENERAL',
  notes     TEXT          NULL,
  createdAt TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_studysession_userId ON "StudySession"(userId);
CREATE INDEX idx_studysession_createdAt ON "StudySession"(createdAt);
CREATE INDEX idx_studysession_topic ON "StudySession"(topic);
CREATE INDEX idx_studysession_type ON "StudySession"(type);

-- =============================================================================
-- TABLE: Task
-- Description: Learning tasks with priority (LOW/MEDIUM/HIGH/CRITICAL),
--              status tracking (TODO/IN_PROGRESS/DONE), due dates, categories,
--              and optional sub-task checklists stored as JSON.
-- =============================================================================

CREATE TABLE "Task" (
  id          TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId      TEXT          NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title       TEXT          NOT NULL,
  description TEXT          NULL,
  priority    "Priority"    NOT NULL DEFAULT 'MEDIUM',
  status      "TaskStatus"  NOT NULL DEFAULT 'TODO',
  dueDate     TIMESTAMP     NULL,
  category    TEXT          NULL,
  checklist   JSONB         NULL,
  createdAt   TIMESTAMP     NOT NULL DEFAULT NOW(),
  updatedAt   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_userId ON "Task"(userId);
CREATE INDEX idx_task_status ON "Task"(status);
CREATE INDEX idx_task_priority ON "Task"(priority);
CREATE INDEX idx_task_dueDate ON "Task"(dueDate);
CREATE INDEX idx_task_category ON "Task"(category);

-- =============================================================================
-- TABLE: Note
-- Description: Personal study notes with markdown content, tags (text array),
--              optional folder grouping, and pin-to-top capability.
-- =============================================================================

CREATE TABLE "Note" (
  id        TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title     TEXT        NOT NULL,
  content   TEXT        NOT NULL,
  tags      TEXT[]      NOT NULL DEFAULT '{}',
  folderId  TEXT        NULL,
  isPinned  BOOLEAN     NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP   NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_userId ON "Note"(userId);
CREATE INDEX idx_note_tags ON "Note" USING GIN(tags);
CREATE INDEX idx_note_isPinned ON "Note"(isPinned);
CREATE INDEX idx_note_folderId ON "Note"(folderId);

-- =============================================================================
-- TABLE: Collection
-- Description: Logical grouping for resources. Users can create collections
--              like "System Design", "Java", "DevOps" to organize materials.
-- =============================================================================

CREATE TABLE "Collection" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId      TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT        NULL,
  color       TEXT        NULL,
  icon        TEXT        NULL,
  createdAt   TIMESTAMP   NOT NULL DEFAULT NOW(),
  updatedAt   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_userId ON "Collection"(userId);

-- =============================================================================
-- TABLE: Resource
-- Description: Learning resources (PDFs, videos, links, code, images).
--              Resources can be uploaded files (fileKey) or external URLs.
--              They belong to a user and optionally to a collection.
-- =============================================================================

CREATE TABLE "Resource" (
  id           TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId       TEXT           NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title        TEXT           NOT NULL,
  type         "ResourceType" NOT NULL,
  url          TEXT           NULL,          -- External URL for LINK type
  fileKey      TEXT           NULL,          -- Storage key for uploaded files
  fileSize     INTEGER       NULL,          -- File size in bytes
  mimeType     TEXT           NULL,          -- MIME type of the file
  tags         TEXT[]         NOT NULL DEFAULT '{}',
  collectionId TEXT           NULL REFERENCES "Collection"(id) ON DELETE SET NULL,
  isFavorite   BOOLEAN        NOT NULL DEFAULT FALSE,
  isUpload     BOOLEAN        NOT NULL DEFAULT FALSE, -- TRUE if this is an uploaded file
  createdAt    TIMESTAMP      NOT NULL DEFAULT NOW(),
  updatedAt    TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resource_userId ON "Resource"(userId);
CREATE INDEX idx_resource_type ON "Resource"(type);
CREATE INDEX idx_resource_collectionId ON "Resource"(collectionId);
CREATE INDEX idx_resource_tags ON "Resource" USING GIN(tags);
CREATE INDEX idx_resource_isFavorite ON "Resource"(isFavorite);
CREATE INDEX idx_resource_isUpload ON "Resource"(isUpload);

-- =============================================================================
-- TABLE: Document
-- Description: Long-term persistent file storage tracking. Each document
--              represents an uploaded file with its storage location,
--              metadata, and status. Files are organized per-user with
--              support for local disk and S3-compatible storage backends.
-- =============================================================================

CREATE TABLE "Document" (
  id              TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId          TEXT             NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  originalName    TEXT             NOT NULL,           -- Original uploaded filename
  mimeType        TEXT             NOT NULL,           -- MIME type
  size            INTEGER          NOT NULL,           -- File size in bytes
  storageProvider "StorageProvider" NOT NULL DEFAULT 'LOCAL',
  storageKey      TEXT             NOT NULL UNIQUE,    -- Relative path or S3 key
  publicUrl       TEXT             NULL,               -- Cached public URL
  resourceType    "ResourceType"   NOT NULL,           -- PDF, VIDEO, IMAGE, etc.
  status          "DocumentStatus" NOT NULL DEFAULT 'READY',
  folder          TEXT             NULL,               -- User-defined folder path
  tags            TEXT[]           NOT NULL DEFAULT '{}',
  metadata        JSONB            NULL,               -- EXIF, PDF page count, video duration, etc.
  resourceId      TEXT             NULL UNIQUE REFERENCES "Resource"(id) ON DELETE SET NULL,
  createdAt       TIMESTAMP        NOT NULL DEFAULT NOW(),
  updatedAt       TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_userId ON "Document"(userId);
CREATE INDEX idx_document_userId_type ON "Document"(userId, resourceType);
CREATE INDEX idx_document_storageKey ON "Document"(storageKey);
CREATE INDEX idx_document_status ON "Document"(status);
CREATE INDEX idx_document_folder ON "Document"(folder);
CREATE INDEX idx_document_tags ON "Document" USING GIN(tags);

-- =============================================================================
-- TABLE: Notification
-- Description: User notifications for reminders, achievements, system alerts,
--              and mentor messages. Supports deep-link action URLs.
-- =============================================================================

CREATE TABLE "Notification" (
  id        TEXT               PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT               NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title     TEXT               NOT NULL,
  body      TEXT               NOT NULL,
  type      "NotificationType" NOT NULL,
  isRead    BOOLEAN            NOT NULL DEFAULT FALSE,
  actionUrl TEXT               NULL,
  createdAt TIMESTAMP          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_userId ON "Notification"(userId);
CREATE INDEX idx_notification_isRead ON "Notification"(isRead);
CREATE INDEX idx_notification_type ON "Notification"(type);
CREATE INDEX idx_notification_createdAt ON "Notification"(createdAt);

-- =============================================================================
-- TABLE: ActivityLog
-- Description: Comprehensive audit trail for all user actions. Logs every
--              create/update/delete operation with entity reference and
--              arbitrary JSON metadata for flexible event tracking.
-- =============================================================================

CREATE TABLE "ActivityLog" (
  id        TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  action    TEXT        NOT NULL,          -- e.g. 'TASK_CREATED', 'NOTE_UPDATED'
  entity    TEXT        NOT NULL,          -- e.g. 'Task', 'Note', 'Resource'
  entityId  TEXT        NOT NULL,          -- UUID of the affected entity
  metadata  JSONB       NULL,              -- Arbitrary action-specific data
  createdAt TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activitylog_userId ON "ActivityLog"(userId);
CREATE INDEX idx_activitylog_action ON "ActivityLog"(action);
CREATE INDEX idx_activitylog_entity ON "ActivityLog"(entity);
CREATE INDEX idx_activitylog_createdAt ON "ActivityLog"(createdAt);

-- =============================================================================
-- TABLE: BrowserTelemetry
-- Description: Browser activity data collected by the Chrome MV3 extension.
--              Stores URL, domain, page title, time spent (seconds), and
--              a category classification (Documentation, Programming, etc.).
-- =============================================================================

CREATE TABLE "BrowserTelemetry" (
  id        TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId    TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  url       TEXT        NOT NULL,
  title     TEXT        NULL,
  domain    TEXT        NOT NULL,
  duration  INTEGER     NOT NULL,          -- Time spent in seconds
  category  TEXT        NULL,              -- Documentation, Programming, AI Tools, Social Media, General
  timestamp TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_browsertelemetry_userId ON "BrowserTelemetry"(userId);
CREATE INDEX idx_browsertelemetry_domain ON "BrowserTelemetry"(domain);
CREATE INDEX idx_browsertelemetry_category ON "BrowserTelemetry"(category);
CREATE INDEX idx_browsertelemetry_timestamp ON "BrowserTelemetry"(timestamp);

-- =============================================================================
-- TABLE: DesktopTelemetry
-- Description: Desktop activity data collected by the Node.js desktop agent.
--              Stores active application, window title, process name, duration,
--              idle status, and category (IDE, Terminal, Browser, General).
-- =============================================================================

CREATE TABLE "DesktopTelemetry" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  userId      TEXT        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  activeApp   TEXT        NOT NULL,
  windowTitle TEXT        NOT NULL,
  processName TEXT        NULL,
  duration    INTEGER     NOT NULL,          -- Time spent in seconds
  isIdle      BOOLEAN     NOT NULL DEFAULT FALSE,
  category    TEXT        NULL,              -- IDE, Terminal, Browser, General
  timestamp   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_desktopelemetry_userId ON "DesktopTelemetry"(userId);
CREATE INDEX idx_desktopelemetry_activeApp ON "DesktopTelemetry"(activeApp);
CREATE INDEX idx_desktopelemetry_category ON "DesktopTelemetry"(category);
CREATE INDEX idx_desktopelemetry_timestamp ON "DesktopTelemetry"(timestamp);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update "updatedAt" timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_updatedAt
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_task_updatedAt
  BEFORE UPDATE ON "Task"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_note_updatedAt
  BEFORE UPDATE ON "Note"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_collection_updatedAt
  BEFORE UPDATE ON "Collection"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_resource_updatedAt
  BEFORE UPDATE ON "Resource"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEW: UserDashboard
-- Description: Consolidated view combining user info with profile and streak.
-- =============================================================================

CREATE OR REPLACE VIEW "UserDashboard" AS
SELECT
  u.id,
  u.email,
  u.name,
  u.avatar,
  u.role,
  u.createdAt,
  p.targetRole,
  p.currentLevel,
  p.weeklyHours,
  p.careerGoals,
  p.skills,
  p.timezone,
  p.bio,
  ls.currentStreak,
  ls.longestStreak,
  ls.lastActiveDate
FROM "User" u
LEFT JOIN "Profile" p ON p.userId = u.id
LEFT JOIN "LearningStreak" ls ON ls.userId = u.id;

-- =============================================================================
-- VIEW: DailyStudySummary
-- Description: Aggregated daily study stats per user.
-- =============================================================================

CREATE OR REPLACE VIEW "DailyStudySummary" AS
SELECT
  userId,
  DATE(createdAt) AS studyDate,
  SUM(duration) AS totalSeconds,
  COUNT(*) AS sessionCount,
  COUNT(DISTINCT topic) AS uniqueTopics,
  COUNT(DISTINCT type) AS typeVariety
FROM "StudySession"
GROUP BY userId, DATE(createdAt);

-- =============================================================================
-- VIEW: TelemetryInsights
-- Description: Combined browser + desktop telemetry for analytics.
-- =============================================================================

CREATE OR REPLACE VIEW "TelemetryInsights" AS
SELECT
  userId,
  'browser' AS source,
  domain AS activityName,
  category,
  SUM(duration) AS totalSeconds,
  DATE(timestamp) AS activityDate
FROM "BrowserTelemetry"
GROUP BY userId, domain, category, DATE(timestamp)
UNION ALL
SELECT
  userId,
  'desktop' AS source,
  activeApp AS activityName,
  category,
  SUM(duration) AS totalSeconds,
  DATE(timestamp) AS activityDate
FROM "DesktopTelemetry"
GROUP BY userId, activeApp, category, DATE(timestamp);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
