<div align="center">

# 💎 StudyTrack 💎
### ✨ AI Developer Learning OS ✨

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00FF99&center=true&vCenter=true&width=600&lines=Deep+work+tracker;AI+tutor+%26+curriculum+planner;Productivity+analytics+platform;Built+with+Next.js+16+%2B+Gemini+AI)](https://git.io/typing-svg)

🔸 **Next.js 16** 🔹 **Express 5** 🔸 **PostgreSQL** 🔹 **Gemini AI** 🔸 **Prisma** 🔸

</div>

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Complete Project File Structure](#-complete-project-file-structure)
- [Data Flow Pipeline](#-data-flow-pipeline)
- [Database Schema (25 Models)](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Module Deep Dives](#-module-deep-dives)
- [Quick Start Guide](#-quick-start-guide)
- [Browser Extension & Desktop Agent](#-browser-extension--desktop-agent)

---

## 🏗 Architecture Overview

StudyTrack is a full-stack, AI-driven learning operating system built for developers. The architecture separates the client interface (Next.js 16) from the robust backend API (Node.js/Express 5) and uses a PostgreSQL database via Prisma ORM with 25 interconnected models.

```mermaid
graph TB
    subgraph Clients["CLIENT LAYER"]
        WEB[Next.js 16 App<br/>React 19 + Tailwind CSS 4]
        EXT[Chrome Extension<br/>MV3 Manifest]
        DESKTOP[Node.js Desktop Agent<br/>active-win + axios]
    end

    subgraph Network["NETWORK"]
        HTTP[REST API via HTTPS]
        WS[WebSocket via Socket.IO]
        TELE[Telemetry Pipeline]
    end

    subgraph Backend["BACKEND LAYER - Express 5"]
        AUTH[Auth Middleware<br/>JWT + Clerk]
        MULTER[Multer Upload<br/>100MB limit]
        CONTROLLERS[Controllers<br/>16 controllers]
        SERVICES[Services<br/>20 services]
        AI[Gemini AI<br/>gemini-2.5-flash]
        STORAGE[Storage Service<br/>Local / S3 / GitHub / Google Drive]
    end

    subgraph Data["DATA LAYER"]
        PRISMA[Prisma ORM<br/>7.x]
        PG[(PostgreSQL<br/>25 models)]
        REDIS[In-Memory Cache]
    end

    WEB --> HTTP
    WEB --> WS
    EXT --> TELE
    DESKTOP --> TELE
    HTTP --> AUTH
    AUTH --> CONTROLLERS
    CONTROLLERS --> SERVICES
    CONTROLLERS --> MULTER
    SERVICES --> AI
    SERVICES --> STORAGE
    SERVICES --> PRISMA
    PRISMA --> PG
    TELE --> AUTH
    TELE --> CONTROLLERS
    WS --> AUTH

    style WEB fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px,color:#fff
    style EXT fill:#1a1a2e,stroke:#60A5FA,stroke-width:2px,color:#fff
    style DESKTOP fill:#1a1a2e,stroke:#A78BFA,stroke-width:2px,color:#fff
    style PG fill:#16213e,stroke:#4ADE80,stroke-width:2px,color:#fff
    style AI fill:#16213e,stroke:#F87171,stroke-width:2px,color:#fff
```

### End-to-End User Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (Next.js)
    participant B as Backend (Express)
    participant DB as PostgreSQL
    participant AI as Gemini AI
    participant S as Storage (Local/GDrive)

    U->>F: 1. Register / Login
    F->>B: POST /api/auth/register | login
    B->>DB: Create User / Verify credentials
    B-->>F: JWT Token
    Note over U,F: Authentication Complete

    U->>F: 2. Upload File (PDF/Image/Video)
    F->>B: POST /api/upload (FormData)
    B->>S: Save file to storage
    B->>DB: Create Document + Resource records
    B-->>F: File metadata response
    Note over U,F: File Uploaded

    U->>F: 3. View PDF
    F->>B: GET /api/upload/:id
    B->>S: Stream file bytes
    B-->>F: Binary file data (blob URL)
    F->>F: Render with @react-pdf-viewer
    Note over U,F: PDF Rendered

    U->>F: 4. Request AI Summary
    F->>B: GET /api/upload/:id/text
    B->>S: Read file from storage
    B->>B: Extract text (pdf-parse)
    B-->>F: Extracted text
    F->>B: POST /api/ai/summary
    B->>AI: Send text to Gemini
    AI-->>B: Summary + Key Concepts + MCQs
    B-->>F: AI-generated study materials
    Note over U,F: AI Analysis Complete

    U->>F: 5. Save External Link
    F->>B: POST /api/resources
    B->>B: Validate URL format
    B->>DB: Create Resource (type: LINK)
    B-->>F: Link saved
    Note over U,F: Link Saved - opens in new tab on click

    U->>F: 6. Track Study Session
    F->>B: POST /api/tracking
    B->>DB: Create TrackingSession
    B-->>F: Session started
    Note over U,F: Deep Work Tracking Active

    EXT->>B: 7. Send Browser Telemetry
    B->>DB: Store BrowserTelemetry
    Note over EXT,B: Background collection every 30s

    DESKTOP->>B: 8. Send Desktop Telemetry
    B->>DB: Store DesktopTelemetry
    Note over DESKTOP,B: Background collection every 30s
```

---

## 📂 Complete Project File Structure

### Backend (`/backend`) — Express 5 + TypeScript + Prisma

```
backend/
├── prisma/
│   ├── schema.prisma              # 25 Models + 15 Enums
│   ├── migrate.sql                # Full migration SQL
│   └── seed.ts                    # Development seed data
│
├── src/
│   ├── server.ts                  # Entry point + Socket.IO + CORS + Rate limiting
│   ├── bootstrap.ts               # Env configuration
│   │
│   ├── config/
│   │   └── googleDrive.ts         # Google Drive JWT auth config
│   │
│   ├── constants/
│   │   └── upload.constants.ts    # Allowed MIME types, max file size (100MB)
│   │
│   ├── controllers/               # 16 controllers - HTTP request handlers
│   │   ├── ai.controller.ts       # Chat, Summary, Quiz, RAG endpoints
│   │   ├── authController.ts      # Register, Login, OTP, Face Login
│   │   ├── uploadController.ts    # Upload, Get, Download, Preview, Delete
│   │   ├── resourceController.ts  # CRUD for external links/resources
│   │   ├── noteController.ts      # Notes CRUD
│   │   ├── sessionController.ts   # Study sessions
│   │   ├── taskController.ts      # Task management
│   │   ├── trackingController.ts  # Deep work tracking
│   │   ├── reportController.ts    # Report generation
│   │   ├── calendarController.ts  # Calendar events
│   │   ├── analyticsController.ts # Charts and metrics
│   │   ├── insightsController.ts  # AI insights
│   │   ├── exportController.ts    # Data export (PDF/CSV)
│   │   ├── userController.ts      # Profile, settings
│   │   ├── telemetry.controller.ts# Browser + Desktop telemetry
│   │   └── webhookController.ts   # Clerk webhooks
│   │
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication guard
│   │   ├── upload.ts              # Multer config + MIME type mapping
│   │   └── lifelog.ts             # API transaction logger
│   │
│   ├── routes/                    # 17 route files
│   │   ├── auth.ts                # /api/auth/*
│   │   ├── upload.ts              # /api/upload/*
│   │   ├── resources.ts           # /api/resources/*
│   │   ├── ai.routes.ts           # /api/ai/*
│   │   ├── notes.ts               # /api/notes/*
│   │   ├── tasks.ts               # /api/tasks/*
│   │   ├── sessions.ts            # /api/sessions/*
│   │   ├── tracking.routes.ts     # /api/tracking/*
│   │   ├── reports.routes.ts      # /api/reports/*
│   │   ├── calendar.routes.ts     # /api/calendar/*
│   │   ├── analytics.routes.ts    # /api/analytics/*
│   │   ├── insights.routes.ts     # /api/insights/*
│   │   ├── export.routes.ts       # /api/export/*
│   │   ├── projects.routes.ts     # /api/projects/*
│   │   ├── telemetry.routes.ts    # /api/telemetry/*
│   │   ├── users.ts               # /api/users/*
│   │   └── webhooks.ts            # /api/webhooks (raw body)
│   │
│   ├── services/                  # 20 services - core business logic
│   │   ├── ai.service.ts          # Prompt engineering, AI orchestration
│   │   ├── gemini.service.ts      # Direct Google Gemini SDK calls
│   │   ├── storage.service.ts     # Multi-provider storage abstraction
│   │   ├── googleDrive.service.ts # Google Drive API (upload/download/list)
│   │   ├── githubStorage.service.ts# GitHub API storage
│   │   ├── queue.service.ts       # Async job queue
│   │   ├── pdf.service.ts         # PDF text extraction (pdf-parse)
│   │   ├── pdfReport.service.ts   # PDF report generation (PDFKit)
│   │   ├── tracking.service.ts    # Session tracking logic
│   │   ├── lifelog.service.ts     # API audit log
│   │   ├── project-indexer.service.ts# Codebase indexing for RAG
│   │   ├── agent.service.ts       # AI agent orchestration
│   │   ├── insights.service.ts    # Analytics insights
│   │   ├── analytics.service.ts   # Data aggregation
│   │   ├── report.service.ts      # Report generation
│   │   ├── calendar.service.ts    # Calendar logic
│   │   ├── export.service.ts      # Export formats
│   │   ├── email.service.ts       # Email sending (Nodemailer)
│   │   ├── otp.service.ts         # OTP generation + verification
│   │   └── captcha.service.ts     # Captcha verification
│   │
│   ├── data/
│   │   └── project-context.ts     # Centralized AI context string
│   │
│   └── utils/
│       ├── helpers.ts             # JWT generation/verification
│       ├── fileValidation.ts      # File type + size validation
│       └── fileNaming.ts          # Unique filename generation
│
├── uploads/                       # Local file storage (gitignored)
├── .env                           # Environment variables
├── package.json
├── tsconfig.json
└── render.yaml                    # Render deployment config
```

### Frontend (`/frontend`) — Next.js 16 + React 19 + Tailwind CSS 4

```
frontend/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── globals.css            # Global styles + Tailwind
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Landing page
│   │   │
│   │   ├── (auth)/                # Authentication routes
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx     # Multi-tab login (Password/OTP/Face)
│   │   │   ├── register/page.tsx  # Registration
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   └── (dashboard)/           # Protected application routes
│   │       ├── layout.tsx         # Dashboard layout + Sidebar + ChatBot
│   │       ├── dashboard/page.tsx # Main dashboard (stats, activity, calendar)
│   │       ├── pdf-intelligence/
│   │       │   ├── page.tsx       # PDF list + AI features grid
│   │       │   └── view/[id]/page.tsx  # Full PDF viewer with highlights
│   │       ├── knowledge-vault/page.tsx # File library with image/video/doc viewers
│   │       ├── video-intelligence/page.tsx # Video library + player
│   │       ├── ai-assistant/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── notes/page.tsx
│   │       ├── tasks/page.tsx
│   │       ├── tracking/page.tsx
│   │       ├── lifelog/page.tsx
│   │       ├── reports/page.tsx
│   │       ├── profile/page.tsx
│   │       ├── settings/page.tsx
│   │       ├── chat/page.tsx
│   │       ├── curriculum/page.tsx
│   │       ├── diagnostics/page.tsx
│   │       ├── productivity/page.tsx
│   │       ├── trends/page.tsx
│   │       ├── career/page.tsx
│   │       ├── unauthorized/page.tsx
│   │       └── admin/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                    # Reusable primitives
│   │   │   ├── Button.tsx         # 5 variants + 3 sizes
│   │   │   ├── Card.tsx           # Glassmorphic card
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Sidebar.tsx       # Navigation sidebar
│   │   │
│   │   └── dashboard/             # Domain-specific components
│   │       ├── UploadModal.tsx    # Drag-drop file upload queue
│   │       ├── ImageViewer.tsx    # Full image viewer (zoom/rotate/fs)
│   │       ├── VideoViewer.tsx    # HTML5 video player (PiP/speed/seek)
│   │       ├── DocumentViewer.tsx # Office docs + text preview
│   │       ├── SidebarSessionPanel.tsx
│   │       ├── LiveActivityWidget.tsx
│   │       ├── DocumentIntelPanel.tsx
│   │       └── ChatBotWidget.tsx  # Floating RAG chatbot
│   │
│   ├── lib/
│   │   ├── api.ts                 # API client with JWT refresh + FormData
│   │   ├── auth-context.tsx       # Auth state management
│   │   ├── utils.ts               # cn() helper (clsx + tailwind-merge)
│   │   └── useActivityTracker.ts
│   │
│   ├── store/
│   │   └── sidebarStore.ts        # Zustand sidebar state
│   │
│   └── proxy.ts                   # Dev proxy configuration
│
├── extension/                     # Chrome extension + Desktop agent
│   ├── browser/                   # Chrome MV3 Extension
│   │   ├── manifest.json
│   │   ├── background.js         # Telemetry collection + URL tracking
│   │   ├── popup.html / popup.js # User-facing popup
│   │   ├── options.html / options.js
│   │   └── icons/
│   └── desktop/                   # Node.js Desktop Agent
│       ├── index.js              # Active window tracking
│       └── package.json
│
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🔄 Data Flow Pipeline

### File Upload → Storage → Preview Pipeline

```mermaid
flowchart LR
    subgraph Upload["UPLOAD"]
        A[User selects file] --> B[Drag-drop / File picker]
        B --> C[Client-side validation<br/>type + size]
        C --> D[FormData POST<br/>/api/upload]
    end

    subgraph BackendProcess["BACKEND PROCESSING"]
        E[Multer parses multipart] --> F[Validate MIME type<br/>+ extension]
        F --> G{Storage Provider?}
        G -->|LOCAL| H[saveToLocal<br/>./uploads/users/...]
        G -->|GOOGLE_DRIVE| I[googleapis Drive<br/>create + permission]
        G -->|GITHUB| J[Octokit<br/>repo commit]
        G -->|S3| K[AWS SDK<br/>putObject]

        H --> L[Create Document<br/>+ Resource in DB]
        I --> L
        J --> L
        K --> L

        L --> M{is PDF?}
        M -->|Yes| N[Enqueue AI_PROCESS<br/>async job]
        M -->|No| O[Done]
    end

    subgraph Preview["PREVIEW / VIEW"]
        P[User opens file] --> Q{File Type?}
        Q -->|PDF| R[Blob URL fetch<br/>@react-pdf-viewer]
        Q -->|Image| S[ImageViewer component<br/>zoom + rotate + fs]
        Q -->|Video| T[VideoViewer component<br/>play + seek + PiP]
        Q -->|Office Doc| U[Google Docs Viewer iframe]
        Q -->|Text| V[Preformatted text render]
        Q -->|Other| W[Download button]
    end

    subgraph AI["AI ANALYSIS"]
        N --> X[pdftoextract text<br/>via pdf-parse]
        X --> Y[Send to Gemini AI]
        Y --> Z[Generate Summary / MCQs<br/>Flashcards / Study Guide]
        Z --> AA[Store in DocumentIntelligence]
    end

    Upload --> BackendProcess --> Preview
    BackendProcess --> AI
```

### Telemetry Collection Pipeline

```mermaid
sequenceDiagram
    participant U as User Browser
    participant EXT as Chrome Extension
    participant D as Desktop Agent
    participant B as Backend API
    participant DB as PostgreSQL

    Note over EXT: Page changes detected
    EXT->>EXT: Track active tab URL + title + domain
    EXT->>EXT: Accumulate duration per domain

    loop Every 30 seconds
        EXT->>B: POST /api/telemetry/browser
        B->>DB: INSERT BrowserTelemetry
        B-->>EXT: 200 OK
    end

    Note over D: Active window changes
    D->>D: Capture activeApp + windowTitle
    D->>D: Measure focus duration

    loop Every 30 seconds
        D->>B: POST /api/telemetry/desktop
        B->>DB: INSERT DesktopTelemetry
        B-->>D: 200 OK
    end

    U->>F: View analytics dashboard
    F->>B: GET /api/analytics/insights
    B->>DB: Aggregate telemetry data
    B-->>F: Charts + breakdowns
```

---

## 🗄 Database Schema (25 Models)

### Complete Prisma Schema — All Models & Relationships

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#f5f5f5', 'primaryBorderColor': '#FFCF70', 'lineColor': '#FFCF70', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460', 'fontSize': '12px'}}}%%
erDiagram
    User |o--|| Profile: has
    User |o--|| LearningStreak: has
    User ||--o{ Session: has
    User ||--o{ LoginHistory: has
    User ||--o{ Otp: generates
    User ||--o{ ActivityLog: logs
    User ||--o{ StudySession: studies
    User ||--o{ Task: creates
    User ||--o{ Note: writes
    User ||--o{ Resource: owns
    User ||--o{ Collection: organizes
    User ||--o{ Notification: receives
    User ||--o{ Document: uploads
    User ||--o{ TrackingSession: tracks
    User ||--o{ CalendarEvent: schedules
    User ||--o{ Report: generates
    User ||--o{ ExportLog: exports
    User ||--o{ BrowserTelemetry: browses
    User ||--o{ DesktopTelemetry: uses
    User ||--o{ AIConversation: chats
    User ||--o{ DailySummary: summarizes
    User ||--|| NotificationPreference: configures
    TrackingSession ||--o{ ActivityEvent: contains
    TrackingSession ||--o{ Report: reports
    TrackingSession ||--o{ BrowserTelemetry: tracks
    TrackingSession ||--o{ DesktopTelemetry: tracks
    Document ||--o| DocumentIntelligence: analyzed_by
    Document |o--|| Resource: linked_to
    Note ||--o| NoteIntelligence: analyzed_by
    Resource }o--|| Collection: grouped_in
    AIConversation ||--o{ AIMessage: contains

    User {
        string id PK
        string email UK
        string name
        string password "NULL for OAuth"
        string avatar
        enum role "SUPER_ADMIN, ADMIN, STUDENT, MENTOR, PREMIUM_USER, GUEST"
        boolean isApproved
        datetime emailVerified
        string otpCode
        string faceData
        enum provider "LOCAL, GOOGLE, GITHUB, MICROSOFT"
        string providerId
        string clerkId UK
        string refreshToken
        json settings
        datetime createdAt
        datetime updatedAt
    }

    Profile {
        string id PK
        string userId FK "1:1"
        string bio
        string targetRole
        string currentLevel
        int weeklyHours
        string careerGoals
        json skills
        string timezone
        string githubUrl
        string linkedinUrl
        string portfolioUrl
    }

    LearningStreak {
        string id PK
        string userId FK "1:1"
        int currentStreak
        int longestStreak
        date lastActiveDate
    }

    Session {
        string id PK
        string userId FK
        string token UK
        string device
        string ip
        datetime lastActive
        datetime expiresAt
    }

    LoginHistory {
        string id PK
        string userId FK
        string device
        string ip
        string browser
        string os
        string location
        datetime createdAt
    }

    Otp {
        string id PK
        string userId FK
        string email
        string code
        string type "LOGIN, PASSWORD_RESET"
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    Document {
        string id PK
        string userId FK
        string originalName
        string mimeType
        int size
        enum storageProvider "LOCAL, S3, CLOUDINARY, GITHUB, GOOGLE_DRIVE"
        string storageKey UK
        string publicUrl
        enum resourceType "PDF, VIDEO, LINK, CODE, IMAGE, AUDIO, OTHER"
        enum status "UPLOADING, READY, FAILED, DELETED"
        string folder
        string[] tags
        json metadata
        string resourceId FK "1:1 nullable"
        datetime createdAt
        datetime updatedAt
    }

    Resource {
        string id PK
        string userId FK
        string title
        enum type "PDF, VIDEO, LINK, CODE, IMAGE, AUDIO, OTHER"
        string url "external link"
        string fileKey "storage reference"
        int fileSize
        string mimeType
        string[] tags
        string collectionId FK "nullable"
        boolean isFavorite
        boolean isUpload
        datetime createdAt
        datetime updatedAt
    }

    Collection {
        string id PK
        string userId FK
        string name
        string description
        string color
        string icon
        datetime createdAt
        datetime updatedAt
    }

    TrackingSession {
        string id PK
        string userId FK
        enum status "ACTIVE, PAUSED, COMPLETED, CANCELLED"
        string deviceId
        string deviceName
        string projectName
        datetime startTime
        datetime endTime
        datetime pausedAt
        int totalPauseMs
        datetime lastActivity
        datetime createdAt
        datetime updatedAt
    }

    ActivityEvent {
        string id PK
        string trackingSessionId FK
        string userId FK
        string eventType "PAGE_VIEW, TASK_DONE, NOTE_CREATED..."
        enum category "LEARNING, CODING, READING, VIDEO..."
        string module
        string entityId
        string entityType
        string label
        int duration
        json metadata
        datetime createdAt
    }

    CalendarEvent {
        string id PK
        string userId FK
        string title
        string description
        string eventType
        string color
        datetime startTime
        datetime endTime
        boolean isAllDay
        boolean isRecurring
        enum recurrenceType "DAILY, WEEKLY, MONTHLY..."
        json recurrenceRule
        datetime recurrenceEnd
        string timezone
        string location
        string[] tags
        json metadata
        datetime createdAt
        datetime updatedAt
    }

    Note {
        string id PK
        string userId FK
        string title
        string content
        string[] tags
        string folderId
        boolean isPinned
        datetime createdAt
        datetime updatedAt
    }

    Task {
        string id PK
        string userId FK
        string title
        string description
        enum priority "LOW, MEDIUM, HIGH, CRITICAL"
        enum status "TODO, IN_PROGRESS, DONE"
        datetime dueDate
        string category
        json checklist
        datetime createdAt
        datetime updatedAt
    }

    Report {
        string id PK
        string userId FK
        string trackingSessionId FK
        enum type "SESSION_SUMMARY, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM"
        string title
        string summary
        int durationSeconds
        float productivityScore
        float focusScore
        json metrics, chartData, recommendations, insights
        string[] technologies
        string[] topics
        datetime createdAt
    }

    AIConversation {
        string id PK
        string userId FK
        string title
        string documentId
        datetime createdAt
        datetime updatedAt
    }

    AIMessage {
        string id PK
        string conversationId FK
        string role "user, model"
        string content
        datetime createdAt
    }

    DocumentIntelligence {
        string id PK
        string documentId FK "1:1"
        string summary
        json chapterSummaries, keyConcepts, topics
        json interviewQuestions, mcqs, flashcards
        json mindMapData, revisionChecklist
        datetime createdAt
        datetime updatedAt
    }

    NoteIntelligence {
        string id PK
        string noteId FK "1:1"
        string summary
        json keywords
        datetime createdAt
        datetime updatedAt
    }

    BrowserTelemetry {
        string id PK
        string userId FK
        string trackingSessionId FK
        string url
        string title
        string domain
        int duration
        string category
        datetime timestamp
    }

    DesktopTelemetry {
        string id PK
        string userId FK
        string trackingSessionId FK
        string activeApp
        string windowTitle
        string processName
        int duration
        boolean isIdle
        string category
        datetime timestamp
    }

    Notification {
        string id PK
        string userId FK
        string title
        string body
        enum type "REMINDER, ACHIEVEMENT, SYSTEM, MENTOR"
        boolean isRead
        string actionUrl
        datetime createdAt
    }

    NotificationPreference {
        string id PK
        string userId FK "1:1"
        boolean studyReminders
        boolean revisionReminders
        boolean taskReminders
        boolean meetingReminders
        boolean goalReminders
        enum[] channels "IN_APP, EMAIL, PUSH"
        string quietHoursStart
        string quietHoursEnd
        string timezone
    }

    ExportLog {
        string id PK
        string userId FK
        enum format "PDF, EXCEL, CSV, JSON"
        string entityType
        string entityId
        string fileName
        int fileSize
        string storageKey
        datetime createdAt
    }

    DailySummary {
        string id PK
        string userId FK
        date date UK "per user per day"
        string summary
        json recommendations
        json metrics
        datetime createdAt
    }
```

### Entity Groups

| Group | Models | Purpose |
|-------|--------|---------|
| **Core Identity** | User, Profile, LearningStreak | User accounts, extended profiles, gamification streaks |
| **Auth & Security** | Session, LoginHistory, Otp | JWT sessions, login audit, OTP verification |
| **Learning** | StudySession, Task, Note | Study logging, kanban tasks, markdown notes |
| **Resources & Files** | Resource, Collection, Document | File storage, external links, organizational collections |
| **Deep Work Tracking** | TrackingSession, ActivityEvent | Focused session tracking with micro-activity events |
| **Calendar** | CalendarEvent | Personal calendar with recurring events |
| **AI Intelligence** | AIConversation, AIMessage, DocumentIntelligence, NoteIntelligence | Chat history, cached AI analysis results |
| **Reporting** | Report, ExportLog, DailySummary | Generated reports, export history, daily summaries |
| **Telemetry** | BrowserTelemetry, DesktopTelemetry | Activity tracking from extension + desktop agent |
| **Alerts & Prefs** | Notification, NotificationPreference | In-app/email notifications and user preferences |
| **Audit** | ActivityLog | Comprehensive action audit trail |

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create account (Local, Captcha optional) |
| POST | `/login` | Login with password |
| POST | `/login-otp` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP and login |
| POST | `/face-login` | Login with face recognition |
| POST | `/refresh-token` | Refresh JWT access token |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### File Management (`/api/upload`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-files` | List user's uploaded files |
| POST | `/` | Upload single file (FormData) |
| POST | `/multiple` | Upload multiple files (up to 10) |
| GET | `/:id` | Stream file inline |
| GET | `/:id/download` | Force file download |
| GET | `/:id/preview` | Preview (redirect GDrive or stream) |
| GET | `/:id/text` | Extract text content |
| POST | `/:id/replace` | Replace file content |
| PATCH | `/:id/rename` | Rename file |
| PATCH | `/:id/metadata` | Update folder, tags, favorites |
| DELETE | `/:id` | Soft-delete file |

### Resources / External Links (`/api/resources`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List resources (links, bookmarks) |
| GET | `/:id` | Get resource by ID |
| POST | `/` | Create resource (validates URL) |
| PUT | `/:id` | Update resource metadata |
| DELETE | `/:id` | Delete resource |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat with Gemini AI |
| POST | `/summary` | Generate document summary |
| POST | `/quiz` | Generate MCQs from text |
| POST | `/explain` | Explain selected text |
| POST | `/agent` | AI agent operations |

### Tracking (`/api/tracking`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/start` | Start tracking session |
| POST | `/stop` | Stop tracking session |
| POST | `/pause` | Pause tracking |
| POST | `/resume` | Resume tracking |
| GET | `/active` | Get active session |
| GET | `/history` | Get session history |

### Telemetry (`/api/telemetry`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/browser` | Record browser activity |
| POST | `/desktop` | Record desktop activity |
| GET | `/insights` | Get telemetry insights |

---

## 🧩 Module Deep Dives

### PDF Intelligence Module

```mermaid
flowchart TB
    subgraph PDFFrontend["FRONTEND"]
        PL[PDF List Page<br/>/pdf-intelligence]
        PV[PDF Viewer Page<br/>/pdf-intelligence/view/[id]]
        AIF[AI Feature Grid<br/>Summary, MCQs, Flashcards]

        PL -->|Select doc| PV
        PV -->|Extract text| AIF
    end

    subgraph PDFBackend["BACKEND"]
        UC[uploadController]
        PS[pdf.service.ts<br/>pdf-parse]
        AIS[ai.service.ts]
        GS[gemini.service.ts]
    end

    subgraph PDFStorage["STORAGE"]
        LS[(Local Disk)]
        GD[(Google Drive)]
        GH[(GitHub)]
    end

    PV -->|GET /upload/:id<br/>blob URL| UC
    UC --> LS
    UC --> GD
    UC --> GH
    PV -->|GET /upload/:id/text| UC
    UC --> PS
    AIF -->|POST /ai/summary| AIS
    AIF -->|POST /ai/quiz| AIS
    AIS --> GS
    GS --> GoogleGemini

    style PV fill:#1a1a2e,stroke:#F87171,stroke-width:2px,color:#fff
    style GS fill:#16213e,stroke:#F87171,stroke-width:2px,color:#fff
```

**Features:**
- Full PDF rendering with `@react-pdf-viewer/core` + `defaultLayoutPlugin`
- Default toolbar: zoom in/out, fit width/page, full screen, rotate, page nav, scroll mode, thumbnail sidebar, search
- Custom toolbar: highlight (12 colors), notes panel, AI actions, study guide generation, document stats
- Export as .txt, download PDF, print, open in new tab
- Error handling: missing file, corrupted PDF, network failure — shows meaningful error messages
- Remembers last page via `defaultLayoutPlugin` internal state

### Knowledge Vault Module

```mermaid
flowchart TB
    subgraph KV["KNOWLEDGE VAULT"]
        GRID[Grid/List View]
        FILT[Filter: ALL, PDF, VIDEO, IMAGE, LINK, FAVORITES]
        SEARCH[Search by name/title/URL]
        UPLOAD[Upload Modal - drag/drop queue]
        ADDURL[Add Link Modal - URL validation]
    end

    subgraph KVViewers["VIEWERS"]
        PV2[PDF Viewer<br/>/pdf-intelligence/view/[id]]
        IV[ImageViewer<br/>zoom + rotate + FS]
        VV[VideoViewer<br/>play + seek + PiP]
        DV[DocumentViewer<br/>Google Docs iframe]
    end

    subgraph KVData["DATA"]
        FILES[GET /upload/my-files]
        RESOURCES[GET /resources]
        YT[YouTube detection + thumbnails]
        FAV[Favicon via Google S2]
        DOM[Domain name extraction]
    end

    KV --> KVData
    KV --> KVViewers

    KVData --> YT
    KVData --> FAV
    KVData --> DOM

    GRID -->|Click PDF| PV2
    GRID -->|Click Image| IV
    GRID -->|Click Video| VV
    GRID -->|Click Office doc| DV
    GRID -->|Click LINK| window.open(_blank)

    style KV fill:#1a1a2e,stroke:#60A5FA,stroke-width:2px,color:#fff
    style YT fill:#16213e,stroke:#F87171,stroke-width:2px,color:#fff
```

**Supported File Types:**

| Category | Formats | Preview Method |
|----------|---------|---------------|
| PDF | `.pdf` | `@react-pdf-viewer` with full toolbar |
| Image | `.jpg, .jpeg, .png, .gif, .svg, .webp, .bmp` | ImageViewer (zoom, rotate, fullscreen, download, share) |
| Video | `.mp4, .webm, .mov, .avi` | VideoViewer (play, pause, seek, PiP, speed 0.25x-2x, fullscreen, download) |
| Office | `.doc, .docx, .xls, .xlsx, .ppt, .pptx` | Google Docs Viewer iframe (with download fallback) |
| Text | `.txt, .csv, .json` | Inline preformatted text |
| Links | Any HTTP/HTTPS URL | Opens in new tab with `noopener,noreferrer` |
| YouTube | `youtube.com/watch`, `youtu.be/` | Thumbnail preview → opens YouTube in new tab |
| Archives | `.zip, .rar, .tar, .gz` | Download only |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Google Gemini API key
- Google Drive service account (optional, for cloud storage)

### 1. Environment Setup

**Backend (`/backend/.env`)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/studytrack"
JWT_SECRET="your-super-secret-key"
FRONTEND_URL="https://cognarc-it.vercel.app"
PORT=5000
GEMINI_API_KEY="your-google-gemini-key"

# Storage (LOCAL, GOOGLE_DRIVE, GITHUB, S3)
STORAGE_PROVIDER="LOCAL"

# Google Drive (optional)
GOOGLE_DRIVE_FOLDER_NAME="Cognarc Storage"
GOOGLE_DRIVE_FOLDER_URL="https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
GOOGLE_DRIVE_FOLDER_ID="YOUR_FOLDER_ID"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
GOOGLE_DRIVE_NESTED_FOLDERS="true"
GOOGLE_DRIVE_PUBLIC_ACCESS="true"
```

**Frontend (`/frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL="https://cognarc-it-1.onrender.com/api"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
```

### 2. Run Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev    # Starts on port 5000
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev    # Starts Next.js dev server
```

### 4. Browser Extension (Optional)
```bash
cd extension/browser
# Load unpacked extension in Chrome:
# chrome://extensions → Load unpacked → select this folder
```

### 5. Desktop Agent (Optional)
```bash
cd extension/desktop
npm install
# Set environment variables and run:
node index.js
```

---

## 🌐 Browser Extension & Desktop Agent

### Chrome Extension (MV3)
- **Manifest**: `extension/browser/manifest.json`
- **Background Script**: Collects browser telemetry (URL, title, domain, duration)
- **Data Flow**: Accumulates active tab duration → sends batch every 30s to `POST /api/telemetry/browser`
- **Auth**: Token-based via config file (`config.js`)
- **Storage**: `chrome.storage.local` for session state

### Desktop Agent (Node.js)
- **Script**: `extension/desktop/index.js`
- **Library**: `active-win` for active window detection
- **Data Flow**: Captures active app + window title → sends every 30s to `POST /api/telemetry/desktop`
- **Session Management**: Tracks `ACTIVE`, `PAUSED`, `IDLE` states
- **Idle Detection**: 5-minute inactivity threshold sends idle state

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **State** | Zustand, React Context |
| **PDF** | @react-pdf-viewer/core 3.12, @react-pdf-viewer/default-layout, @react-pdf-viewer/highlight, pdfjs-dist 3.4 |
| **Charts** | Recharts |
| **Calendar** | react-big-calendar, date-fns |
| **Backend** | Express 5, TypeScript, Prisma 7.x, Socket.IO |
| **Database** | PostgreSQL with Prisma ORM (25 models) |
| **AI** | Google Gemini 2.5 Flash (@google/genai SDK) |
| **Auth** | Clerk + Custom JWT (access + refresh tokens) |
| **Storage** | Local disk, Google Drive API, GitHub API, S3 |
| **Email** | Nodemailer |
| **Telemetry** | Chrome MV3 Extension + Node.js Desktop Agent |
