# StudyTrack — AI Developer Learning OS

**StudyTrack** is a comprehensive, AI-powered learning management system for developers. It helps organize study materials, track learning progress, monitor browsing/desktop activity, generate AI summaries and quizzes, and maintain learning streaks — all within a single platform.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Browser Extension](#8-browser-extension)
9. [Desktop Agent](#9-desktop-agent)
10. [System Workflow](#10-system-workflow)
11. [Local Development Setup](#11-local-development-setup)
12. [Deployment](#12-deployment)
13. [Security](#13-security)

---

## 1. System Flow Diagram (High Level)

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0A0A0A', 'primaryColor': '#1a1a2e', 'primaryTextColor': '#f5f5f5', 'primaryBorderColor': '#FFCF70', 'lineColor': '#FFCF70', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460', 'fontSize': '14px'}}}%%
flowchart TB
  subgraph Client["<b><font color=#FFCF70>CLIENT LAYER</font></b>"]
    direction TB
    WEB[("🌐 <b>Next.js 16</b><br/>Frontend App")]
    EXT[("🧩 <b>Chrome MV3</b><br/>Browser Extension")]
    DKA[("💻 <b>Desktop Agent</b><br/>Node.js active-win")]
  end

  subgraph API["<b><font color=#4ADE80>API LAYER - Express 5</font></b>"]
    direction TB
    AUTH[("🔐 <b>Auth</b><br/>JWT + bcrypt")]
    CRUD[("📦 <b>CRUD</b><br/>Resources/Sessions<br/>Tasks/Notes")]
    UPLD[("📤 <b>Upload</b><br/>Multer - 50MB")]
    TELE[("📡 <b>Telemetry</b><br/>Browser + Desktop")]
    AI[("🤖 <b>AI Service</b><br/>Summary/Quiz/Chat")]
  end

  subgraph DB["<b><font color=#60A5FA>DATA LAYER</font></b>"]
    PGSQL[("🐘 <b>PostgreSQL</b><br/>15 Tables")]
    PRISMA[("🔗 <b>Prisma ORM</b><br/>Type-safe queries")]
    FILES[("📁 <b>File Storage</b><br/>Local Disk")]
  end

  WEB -->|HTTP JSON| AUTH
  WEB -->|HTTP JSON| CRUD
  WEB -->|HTTP JSON| UPLD
  WEB -->|HTTP JSON| AI
  EXT -->|POST /api/telemetry| TELE
  DKA -->|POST /api/telemetry| TELE
  AUTH -->|Prisma| PGSQL
  CRUD -->|Prisma| PGSQL
  UPLD -->|Write| FILES
  TELE -->|Prisma| PGSQL

  style WEB fill:#1a1a2e,stroke:#FFCF70,stroke-width:3px,color:#fff
  style EXT fill:#1a1a2e,stroke:#A78BFA,stroke-width:3px,color:#fff
  style DKA fill:#1a1a2e,stroke:#F87171,stroke-width:3px,color:#fff
  style PGSQL fill:#0f3460,stroke:#60A5FA,stroke-width:3px,color:#fff
  style PRISMA fill:#0f3460,stroke:#60A5FA,stroke-width:2px,color:#fff
  style FILES fill:#0f3460,stroke:#60A5FA,stroke-width:2px,color:#fff
```

---

## 1. Overview

### The Problem

Developers consume learning material from dozens of sources — YouTube, PDFs, documentation, coding platforms. It is difficult to:

- Track **what** you studied and **for how long**
- Retain knowledge without a spaced-repetition system
- Measure **actual productive study time** vs passive browsing
- Get personalized revision schedules and practice questions

### The Solution

StudyTrack solves this with a **four-component system**:

1. **Web Dashboard** (Next.js 16 + Tailwind) — Landing page, auth, curriculum, tasks, notes, resources, analytics, AI mentor chat.
2. **REST API Backend** (Express 5 + Prisma + PostgreSQL) — JWT-authenticated CRUD, file uploads, telemetry ingestion, AI endpoints.
3. **Browser Extension** (Chrome MV3) — Tracks active tabs, measures per-domain duration, categorizes browsing, sends telemetry.
4. **Desktop Agent** (Node.js + active-win) — Polls active window every 5s, categorizes apps, sends telemetry.

---

## 2. Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0A0A0A', 'primaryColor': '#1a1a2e', 'primaryTextColor': '#f5f5f5', 'primaryBorderColor': '#FFCF70', 'lineColor': '#FFCF70', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460', 'fontSize': '14px'}}}%%
flowchart LR
  subgraph Frontend["<b><font color=#FFCF70>FRONTEND</font></b>"]
    LP[("🏠 Landing Page")]
    AUTHF[("🔐 Auth")]
    DASH[("📊 Dashboard")]
    CURR[("📚 Curriculum")]
    CHAT[("💬 AI Chat")]
    TRND[("📈 Trends")]
  end

  subgraph Backend["<b><font color=#4ADE80>BACKEND - Express 5</font></b>"]
    direction TB
    MW[("🛡️ Middleware<br/>Helmet/CORS/RateLimit")]
    CTRL[("🎮 Controllers<br/>Auth/Users/Sessions/Tasks<br/>Notes/Resources/Upload<br/>Telemetry/AI")]
    SRV[("⚙️ Services<br/>AI | Analytics | PDF")]
  end

  subgraph DB["<b><font color=#60A5FA>DATABASE</font></b>"]
    PG[("🐘 PostgreSQL<br/>15 Tables")]
  end

  subgraph Extension["<b><font color=#A78BFA>EXTENSIONS</font></b>"]
    BE[("🧩 Browser Ext<br/>Chrome MV3")]
    DA[("💻 Desktop Agent<br/>active-win")]
  end

  Frontend -->|HTTP + JWT| Backend
  Backend -->|Prisma ORM| DB
  BE -->|POST /telemetry| Backend
  DA -->|POST /telemetry| Backend
  MW --> CTRL
  CTRL --> SRV

  style LP fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style AUTHF fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style DASH fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style CURR fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style CHAT fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style TRND fill:#1a1a2e,stroke:#FFCF70,stroke-width:2px
  style PG fill:#0f3460,stroke:#60A5FA,stroke-width:3px
  style BE fill:#1a1a2e,stroke:#A78BFA,stroke-width:2px
  style DA fill:#1a1a2e,stroke:#F87171,stroke-width:2px
```

### Component Interaction

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0A0A0A'}}}%%
sequenceDiagram
    participant U as 👤 User
    participant F as 🌐 Next.js Frontend
    participant B as ⚡ Express Backend
    participant P as 🐘 PostgreSQL
    participant E as 🧩 Browser Ext
    participant D as 💻 Desktop Agent

    Note over U,D: StudyTrack Full Interaction Flow

    U->>F: Visits Landing Page
    U->>F: Registers / Logins
    F->>B: POST /api/auth/login {email, password}
    B->>P: Verify credentials
    P-->>B: User found
    B-->>F: JWT Token
    F->>F: Store token in localStorage

    U->>F: Dashboard / Tasks / Notes / Resources
    F->>B: GET /api/... (with JWT Bearer)
    B->>B: authenticate() middleware
    B->>P: Prisma query
    P-->>B: Data
    B-->>F: JSON Response

    Note over E,D: Background Telemetry Collection
    loop Every tab switch
        E->>E: Calculate duration
        E->>B: POST /api/telemetry/browser
        B->>P: INSERT BrowserTelemetry
    end

    loop Every 5 seconds
        D->>D: Poll active window
        alt Window changed
            D->>B: POST /api/telemetry/desktop
            B->>P: INSERT DesktopTelemetry
        end
    end

    U->>F: View Analytics / Trends
    F->>B: GET /api/telemetry/stats
    B->>B: analytics.service.ts
    B->>P: Aggregate queries
    P-->>B: Aggregated data
    B->>B: Generate AI profile
    B-->>F: Stats + Insights

    U->>F: AI Mentor Chat
    F->>B: POST /api/ai/chat {messages}
    B->>B: chatWithTutor()
    B-->>F: AI Response
```

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.10 (App Router), React 19.2.4, TypeScript |
| Styling | Tailwind CSS v4, custom design tokens, dark theme |
| Animations | Framer Motion 12.42.2 |
| Icons/Charts | Lucide React 1.23.0, Recharts 3.9.2 |
| State/Data | Zustand 5.0.14, TanStack React Query 5 |
| Backend | Node.js, Express 5.2.1, TypeScript |
| ORM | Prisma 7.8.0 (PrismaPg adapter) |
| Database | PostgreSQL |
| Auth | jsonwebtoken 9, bcryptjs, Passport (Google/GitHub OAuth stubbed) |
| File Upload | Multer (local disk, 50MB limit) |
| PDF Parsing | pdf-parse 2.4.5 |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| Browser Ext | Chrome Manifest V3 (vanilla JS) |
| Desktop Agent | Node.js + active-win + axios |
| Deployment | Render.com (Blueprint + managed Postgres) |

---

## 4. Project Structure

```
backend/
  .env                        # DATABASE_URL, JWT_SECRET, etc.
  prisma/schema.prisma        # 15 models, 7 enums
  src/
    server.ts                 # Express bootstrap, middleware, routes
    controllers/              # 9 request handlers
      authController.ts       # register, login, getMe, updateProfile, logout
      userController.ts       # list, get, delete users + stats
      uploadController.ts     # upload, get, delete files
      resourceController.ts   # CRUD resources
      sessionController.ts    # CRUD study sessions
      taskController.ts       # CRUD tasks + stats
      noteController.ts       # CRUD notes + pin toggle
      telemetry.controller.ts # browser/desktop telemetry + stats
      ai.controller.ts        # summary, quiz, chat
    middleware/
      auth.ts                 # authenticate + optionalAuth (JWT)
      upload.ts               # Multer config (MIME validation, 50MB)
    routes/                   # 9 Express router files
    services/
      ai.service.ts           # Mocked AI (summary, quiz, chat, insights)
      analytics.service.ts    # Telemetry aggregation + AI profile
      pdf.service.ts          # PDF text extraction
    utils/helpers.ts          # JWT generate/verify
    uploads/                  # images/, pdfs/, videos/, other/

frontend/
  src/
    app/
      globals.css             # Tailwind theme tokens
      layout.tsx              # Root layout
      page.tsx                # Landing page (hero, features, curriculum)
      (auth)/                 # Route group: login, register (centered card)
      (dashboard)/            # Route group: dashboard, curriculum, chat, trends
    components/
      ui/                     # Button, Card, Badge, Input, Avatar, Sidebar
      dashboard/              # DocumentIntelPanel
    lib/
      api.ts                  # JWT-aware fetch wrapper (get, post, put, patch, delete, upload)
      utils.ts                # cn() helper (clsx + tailwind-merge)

extension/
  browser/                    # Chrome MV3 extension
    manifest.json             # tabs, storage, idle permissions
    background.js             # Tab tracking service worker
    popup.html/js             # Monitor status popup
    options.html/js           # API URL + auth token config
  desktop/                    # Node.js desktop agent
    index.js                  # active-win polling (5s interval)

developer-learning-os/        # Partial duplicate/backup
```

---

## 5. Database Design

The complete database schema, seed data, and ERD diagrams are available in the [`database/`](./database) folder:

| File | Description |
|------|-------------|
| [`database/schema.sql`](./database/schema.sql) | Full PostgreSQL schema (15 tables, 7 enums, triggers, views, indexes) |
| [`database/seed.sql`](./database/seed.sql) | Sample development data |
| [`database/ERD.md`](./database/ERD.md) | Entity Relationship Diagrams (Mermaid) |
| [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) | Prisma ORM schema (used at runtime) |

### Entity Relationship Overview

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#f5f5f5', 'primaryBorderColor': '#FFCF70', 'lineColor': '#FFCF70', 'secondaryColor': '#16213e', 'tertiaryColor': '#0f3460', 'background': '#0A0A0A'}}}%%
erDiagram
  User {
    uuid id PK
    string email UK
    string name
    string password "NULL for OAuth"
    string avatar
    enum role "STUDENT | ADMIN | MENTOR..."
    datetime emailVerified
    enum provider "LOCAL | GOOGLE | GITHUB..."
    string providerId
    string refreshToken
    json settings
    datetime createdAt
    datetime updatedAt
  }

  Profile {
    uuid id PK
    uuid userId FK "1:1"
    string bio
    string targetRole
    string currentLevel
    int weeklyHours
    string careerGoals
    json skills
    string timezone
  }

  LearningStreak {
    uuid id PK
    uuid userId FK "1:1"
    int currentStreak
    int longestStreak
    date lastActiveDate
  }

  Session {
    uuid id PK
    uuid userId FK
    string token UK
    string device
    string ip
    datetime lastActive
    datetime expiresAt
  }

  LoginHistory {
    uuid id PK
    uuid userId FK
    string device
    string ip
    string browser
    string os
    string location
    datetime createdAt
  }

  ActivityLog {
    uuid id PK
    uuid userId FK
    string action
    string entity
    uuid entityId
    json metadata
    datetime createdAt
  }

  StudySession {
    uuid id PK
    uuid userId FK
    string topic
    int duration "seconds"
    enum type "GENERAL | CODING | READING..."
    string notes
    datetime createdAt
  }

  Task {
    uuid id PK
    uuid userId FK
    string title
    string description
    enum priority "LOW | MEDIUM | HIGH | CRITICAL"
    enum status "TODO | IN_PROGRESS | DONE"
    datetime dueDate
    string category
    json checklist
    datetime createdAt
    datetime updatedAt
  }

  Note {
    uuid id PK
    uuid userId FK
    string title
    string content
    string[] tags
    string folderId
    boolean isPinned
    datetime createdAt
    datetime updatedAt
  }

  Collection {
    uuid id PK
    uuid userId FK
    string name
    string description
    string color
    string icon
    datetime createdAt
    datetime updatedAt
  }

  Resource {
    uuid id PK
    uuid userId FK
    string title
    enum type "PDF | VIDEO | LINK | CODE..."
    string url
    string fileKey
    string[] tags
    uuid collectionId FK "NULLable"
    boolean isFavorite
    datetime createdAt
    datetime updatedAt
  }

  Notification {
    uuid id PK
    uuid userId FK
    string title
    string body
    enum type "REMINDER | ACHIEVEMENT..."
    boolean isRead
    string actionUrl
    datetime createdAt
  }

  BrowserTelemetry {
    uuid id PK
    uuid userId FK
    string url
    string title
    string domain
    int duration "seconds"
    string category "Documentation | Programming..."
    datetime timestamp
  }

  DesktopTelemetry {
    uuid id PK
    uuid userId FK
    string activeApp
    string windowTitle
    string processName
    int duration "seconds"
    boolean isIdle
    string category "IDE | Terminal | Browser..."
    datetime timestamp
  }

  User ||--o| Profile : "has 1:1"
  User ||--o| LearningStreak : "has 1:1"
  User ||--o{ Session : "has 1:M"
  User ||--o{ LoginHistory : "has 1:M"
  User ||--o{ ActivityLog : "has 1:M"
  User ||--o{ StudySession : "logs 1:M"
  User ||--o{ Task : "creates 1:M"
  User ||--o{ Note : "writes 1:M"
  User ||--o{ Resource : "owns 1:M"
  User ||--o{ Collection : "organizes 1:M"
  User ||--o{ Notification : "receives 1:M"
  User ||--o{ BrowserTelemetry : "browses 1:M"
  User ||--o{ DesktopTelemetry : "uses 1:M"
  Collection ||--o{ Resource : "groups 1:M"
```

### Entity Group Diagram

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#0a0a0a', 'primaryTextColor': '#f5f5f5', 'lineColor': '#FFCF70', 'background': '#0A0A0A'}}}%%
flowchart TB
  subgraph Core["<b><font color=#FFCF70>CORE</font></b>"]
    U[("👤 <b>User</b>")]
    P[("📋 <b>Profile</b> 1:1")]
    LS[("🔥 <b>LearningStreak</b> 1:1")]
  end

  subgraph Auth["<b><font color=#60A5FA>AUTH & AUDIT</font></b>"]
    S[("🔑 <b>Session</b>")]
    LH[("📜 <b>LoginHistory</b>")]
    AL[("📝 <b>ActivityLog</b>")]
  end

  subgraph Learning["<b><font color=#4ADE80>LEARNING</font></b>"]
    SS[("📚 <b>StudySession</b>")]
    T[("✅ <b>Task</b>")]
    N[("📓 <b>Note</b>")]
  end

  subgraph Resources["<b><font color=#FBBF24>RESOURCES</font></b>"]
    R[("📄 <b>Resource</b>")]
    C[("📁 <b>Collection</b>")]
  end

  subgraph Alerts["<b><font color=#F87171>ALERTS</font></b>"]
    NOTIF[("🔔 <b>Notification</b>")]
  end

  subgraph Telemetry["<b><font color=#A78BFA>TELEMETRY</font></b>"]
    BT[("🌐 <b>BrowserTelemetry</b>")]
    DT[("🖥️ <b>DesktopTelemetry</b>")]
  end

  U --> P
  U --> LS
  U --> S
  U --> LH
  U --> AL
  U --> SS
  U --> T
  U --> N
  U --> R
  U --> C
  U --> NOTIF
  U --> BT
  U --> DT
  C --> R

  style U fill:#1a1a2e,stroke:#FFCF70,stroke-width:3px,color:#fff
  style P fill:#16213e,stroke:#4ADE80,stroke-width:2px,color:#fff
  style LS fill:#16213e,stroke:#4ADE80,stroke-width:2px,color:#fff
  style S fill:#1a1a2e,stroke:#60A5FA,stroke-width:2px,color:#fff
  style LH fill:#1a1a2e,stroke:#60A5FA,stroke-width:2px,color:#fff
  style AL fill:#1a1a2e,stroke:#60A5FA,stroke-width:2px,color:#fff
  style SS fill:#1a1a2e,stroke:#4ADE80,stroke-width:2px,color:#fff
  style T fill:#1a1a2e,stroke:#4ADE80,stroke-width:2px,color:#fff
  style N fill:#1a1a2e,stroke:#4ADE80,stroke-width:2px,color:#fff
  style R fill:#1a1a2e,stroke:#FBBF24,stroke-width:2px,color:#fff
  style C fill:#1a1a2e,stroke:#FBBF24,stroke-width:2px,color:#fff
  style NOTIF fill:#1a1a2e,stroke:#F87171,stroke-width:2px,color:#fff
  style BT fill:#1a1a2e,stroke:#A78BFA,stroke-width:2px,color:#fff
  style DT fill:#1a1a2e,stroke:#A78BFA,stroke-width:2px,color:#fff
```

### 5.1 Enums

```prisma
enum Role              { SUPER_ADMIN ADMIN MENTOR STUDENT PREMIUM_USER GUEST }
enum AuthProvider      { LOCAL GOOGLE GITHUB MICROSOFT }
enum SessionType       { GENERAL CODING READING VIDEO QUIZ }
enum Priority          { LOW MEDIUM HIGH CRITICAL }
enum TaskStatus        { TODO IN_PROGRESS DONE }
enum ResourceType      { PDF VIDEO LINK CODE IMAGE OTHER }
enum NotificationType  { REMINDER ACHIEVEMENT SYSTEM MENTOR }
```

### 5.2 Full Model Reference

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id @default(uuid())` | PK |
| email | `String @unique` | Login email |
| name | `String` | Display name |
| password | `String?` | bcrypt hashed; null for OAuth users |
| avatar | `String?` | Avatar URL |
| role | `Role @default(STUDENT)` | Access control |
| emailVerified | `DateTime?` | Verification timestamp |
| provider | `AuthProvider @default(LOCAL)` | Auth method |
| providerId | `String?` | OAuth provider user ID |
| refreshToken | `String?` | JWT refresh token |
| settings | `Json?` | Flexible preferences |

Relations: Session[], LoginHistory[], Profile?, LearningStreak?, StudySession[], Task[], Note[], Resource[], Collection[], Notification[], ActivityLog[], BrowserTelemetry[], DesktopTelemetry[]

#### Session
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| token | `String @unique` | JWT token hash |
| device | `String?` | Device info |
| ip | `String?` | IP address |
| lastActive | `DateTime` | Default now() |
| expiresAt | `DateTime` | Session expiry |

#### LoginHistory
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| device/ip/browser/os/location | `String?` | Login metadata |
| createdAt | `DateTime` | Default now() |

#### Profile (1:1 with User)
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String @unique` | FK -> User (Cascade) |
| bio/targetRole/currentLevel/careerGoals/timezone | `String?` | Extended profile |
| weeklyHours | `Int?` | Target weekly hours |
| skills | `Json?` | Skills array |

#### LearningStreak (1:1 with User)
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String @unique` | FK -> User (Cascade) |
| currentStreak | `Int @default(0)` | Current consecutive days |
| longestStreak | `Int @default(0)` | Best streak |
| lastActiveDate | `DateTime?` | Last day with activity |

#### StudySession
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| topic | `String` | Subject studied |
| duration | `Int` | Seconds |
| type | `SessionType` | GENERAL, CODING, READING, VIDEO, QUIZ |
| notes | `String?` | Session notes |
| createdAt | `DateTime` | Default now() |

#### Task
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| title | `String` | Task title |
| description | `String?` | Details |
| priority | `Priority @default(MEDIUM)` | LOW/MEDIUM/HIGH/CRITICAL |
| status | `TaskStatus @default(TODO)` | TODO/IN_PROGRESS/DONE |
| dueDate | `DateTime?` | Due date |
| category | `String?` | e.g. "System Design" |
| checklist | `Json?` | Subtask array |
| createdAt/updatedAt | `DateTime` | Auto timestamps |

#### Note
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| title | `String` | Note title |
| content | `String` | Markdown body |
| tags | `String[]` | Postgres text array |
| folderId | `String?` | Folder grouping |
| isPinned | `Boolean @default(false)` | Pin to top |
| createdAt/updatedAt | `DateTime` | Auto timestamps |

#### Resource
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| title | `String` | Resource title |
| type | `ResourceType` | PDF/VIDEO/LINK/CODE/IMAGE/OTHER |
| url | `String?` | External URL |
| fileKey | `String?` | Storage key |
| tags | `String[]` | Text array |
| collectionId | `String?` | FK -> Collection (SetNull) |
| isFavorite | `Boolean` | Default false |
| createdAt/updatedAt | `DateTime` | Auto timestamps |

#### Collection
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| name | `String` | Collection name |
| description/color/icon | `String?` | Display metadata |
| createdAt/updatedAt | `DateTime` | Auto timestamps |

Relations: Resource[] (1:M)

#### Notification
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| title/body | `String` | Notification content |
| type | `NotificationType` | REMINDER/ACHIEVEMENT/SYSTEM/MENTOR |
| isRead | `Boolean @default(false)` | Read status |
| actionUrl | `String?` | Deep link |
| createdAt | `DateTime` | Default now() |

#### ActivityLog
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| action | `String` | e.g. "TASK_CREATED" |
| entity | `String` | e.g. "Task" |
| entityId | `String` | Entity UUID |
| metadata | `Json?` | Arbitrary data |
| createdAt | `DateTime` | Default now() |

#### BrowserTelemetry
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| url | `String` | Full URL |
| title | `String?` | Page title |
| domain | `String` | Hostname |
| duration | `Int` | Seconds spent |
| category | `String?` | Documentation/Programming/AI Tools/Social Media/General |
| timestamp | `DateTime` | Default now() |

#### DesktopTelemetry
| Field | Type | Notes |
|-------|------|-------|
| id | `String @id` | PK |
| userId | `String` | FK -> User (Cascade) |
| activeApp | `String` | App name |
| windowTitle | `String` | Window title |
| processName | `String?` | Executable name |
| duration | `Int` | Seconds spent |
| isIdle | `Boolean` | Default false |
| category | `String?` | IDE/Terminal/Browser/General |
| timestamp | `DateTime` | Default now() |

### 5.3 Entity Relationships

```
User (1) ---- (1) Profile
User (1) ---- (1) LearningStreak
User (1) ---- (M) Session
User (1) ---- (M) LoginHistory
User (1) ---- (M) ActivityLog
User (1) ---- (M) StudySession
User (1) ---- (M) Task
User (1) ---- (M) Note
User (1) ---- (M) Resource --- (M:1) Collection (1) ---- (M) Resource
User (1) ---- (M) Notification
User (1) ---- (M) BrowserTelemetry
User (1) ---- (M) DesktopTelemetry
```

All foreign keys use `onDelete: Cascade` except Resource -> Collection which uses `onDelete: SetNull`.

---

## 6. Backend API Reference

Base URL: `http://localhost:5000` (dev) / `https://studytrack-api.onrender.com` (prod)
Auth: `Authorization: Bearer <jwt_token>`

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account (email, password, name) -> token + user |
| POST | `/login` | No | Login (email, password) -> token + user |
| POST | `/logout` | Yes | Clear auth cookie |
| GET | `/me` | Yes | Current user (includes Profile + LearningStreak) |
| PUT | `/profile` | Yes | Update name/avatar |

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List all (admin) |
| GET | `/stats` | Yes | User statistics |
| GET | `/:id` | Yes | Get by ID |
| DELETE | `/:id` | Yes | Delete (admin) |

### Resources (`/api/resources`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/` | Yes | List/Create |
| GET/PUT/DELETE | `/:id` | Yes | CRUD single |

POST body: `{ title, type, url?, fileKey?, tags?, collectionId? }`

### Sessions (`/api/sessions`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/` | Yes | List/Create |
| GET | `/today` | Yes | Today's sessions |
| GET/PUT/DELETE | `/:id` | Yes | CRUD single |

POST body: `{ topic, duration (seconds), type?, notes? }`

### Tasks (`/api/tasks`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/` | Yes | List/Create |
| GET | `/stats` | Yes | Task completion stats |
| GET/PUT/DELETE | `/:id` | Yes | CRUD single |

POST body: `{ title, description?, priority?, status?, dueDate?, category?, checklist? }`

### Notes (`/api/notes`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/` | Yes | List/Create |
| GET/PUT/DELETE | `/:id` | Yes | CRUD single |
| PATCH | `/:id/pin` | Yes | Toggle pin |

POST body: `{ title, content, tags?, folderId? }`

### Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Upload file (multipart, max 50MB) |
| GET | `/:id` | Yes | File metadata |
| DELETE | `/:id` | Yes | Delete from disk |

Accepted types: jpeg/png/gif/webp (images), pdf (PDFs), mp4/webm/mov (videos)

### Telemetry (`/api/telemetry`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/browser` | Optional | Log browser event |
| POST | `/desktop` | Optional | Log desktop event |
| GET | `/stats` | Optional | Aggregated analytics |

Browser body: `{ url, title?, domain, duration, category? }`
Desktop body: `{ activeApp, windowTitle, processName?, duration, isIdle, category? }`

Stats response includes: sessionIntensity, deepHours, profileType, profileDesc, coreProficiencies[], topSessions[], activityPulse[28], interviewQuestions[]

### AI (`/api/ai`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/summary` | No | Generate summary + key topics from text |
| POST | `/quiz` | No | Generate quiz from text |
| POST | `/chat` | No | Chat with AI tutor |

> Note: AI service currently returns mocked responses. Replace with real OpenAI/Gemini calls in `backend/src/services/ai.service.ts`.

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | `{ status: "ok", timestamp }` |

---

## 7. Frontend Architecture

### 7.1 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero video, features grid, curriculum preview, CTA) |
| `/login` | Login form with test auto-fill, Google/GitHub OAuth buttons |
| `/register` | Registration form |
| `/dashboard` | Dashboard home (stats grid, today's plan, AI recs, activity feed) |
| `/dashboard/curriculum` | 5-module curriculum viewer with progress bars |
| `/dashboard/chat` | AI Mentor Chat interface |
| `/dashboard/trends` | Mastery analytics with charts, activity pulse, learner profile |

### 7.2 UI Components

| Component | Variants | Description |
|-----------|----------|-------------|
| Button | primary/secondary/outline/ghost, sm/md/lg | Styled buttons |
| Card | — | Container with border + bg |
| Badge | default/outline/success/warning/danger | Status labels |
| Input | label, error | Form inputs |
| Avatar | name, src, size | User avatar with initials |
| Sidebar | activeItem | Dashboard navigation |
| DocumentIntelPanel | — | AI document analysis UI |

### 7.3 Design System (Dark Theme)

```
--color-st-bg-primary:     #0A0A0A  (main background)
--color-st-bg-secondary:   #111111  (elevated surfaces)
--color-st-bg-card:        #141414  (cards)
--color-st-bg-elevated:    #1A1A1A  (hover/active)
--color-st-border:         #222222  (borders)
--color-st-accent:         #FFCF70  (amber/gold accent)
--color-st-accent-hover:   #E5B254
--color-st-text-primary:   #F5F5F5
--color-st-text-secondary: #999999
--color-st-text-muted:     #666666
--color-st-success:        #4ADE80
--color-st-warning:        #FBBF24
--color-st-danger:         #F87171
```

Font: Geist Sans (primary), Inter (fallback)

### 7.4 API Client (`src/lib/api.ts`)

The `ApiClient` class wraps `fetch` with:
- JWT token management (localStorage)
- Automatic `Authorization: Bearer` header
- JSON serialization / FormData auto-detection
- Error parsing (JSON error messages)
- Methods: `get`, `post`, `put`, `patch`, `delete`, `uploadFile`

---

## 8. Browser Extension

### Architecture

**manifest.json** — Manifest V3, permissions: `tabs`, `storage`, `idle`. Host permissions for localhost and render.com.

**background.js** (Service Worker):
1. Reads `apiUrl` and `userId` from `chrome.storage.sync`
2. Listens to `tabs.onActivated` (tab switch), `tabs.onUpdated` (navigation), `idle.onStateChanged` (idle/lock)
3. On each tab switch, calculates duration and POSTs to `/api/telemetry/browser`

**Domain Categorization:**
- `developer.mozilla.org`, `docs.microsoft.com`, `react.dev` -> **Documentation**
- `github.com`, `stackoverflow.com`, `leetcode.com` -> **Programming**
- `chat.openai.com`, `claude.ai`, `gemini.google.com` -> **AI Tools**
- `twitter.com`, `reddit.com`, `facebook.com`, `youtube.com` -> **Social Media**
- Everything else -> **General**

**popup.html/js** — Shows monitoring status, current domain, links to options.

**options.html/js** — Configurable API URL and auth token, persisted via `chrome.storage.sync`.

---

## 9. Desktop Agent

**`extension/desktop/index.js`** — A Node.js process that:
1. Polls the active window every 5 seconds using `active-win`
2. Categorizes the app: IDE (VS Code, IntelliJ, etc.), Terminal (cmd, powershell, bash), Browser (chrome, edge, firefox), or General
3. When the active window changes, POSTs duration data to `/api/telemetry/desktop`

Run with: `STUDYTRACK_API_URL="..." node index.js` (defaults to localhost:5000)

---

## 10. System Workflow

### 10.1 User Journey

```
1. LANDING PAGE -> Views hero video, features, curriculum -> Clicks Sign In / Register
2. AUTH         -> POST /api/auth/register or /login -> Receives JWT token
3. DASHBOARD    -> Stats grid (hours, tasks, focus, pomodoro)
                   Today's Plan (task list with priorities)
                   AI Recommendations
                   Recent Activity feed
4. CURRICULUM   -> 5 modules (Foundations, Frontend, Backend, System Design, DevOps)
                   Each with topic count and progress %
5. TASKS        -> CRUD tasks with priority/status/dueDate/category
6. SESSIONS     -> Log study periods with topic/duration/type
7. RESOURCES    -> Upload files or save links, organize in collections
8. NOTES        -> Markdown notes with tags, pinning, folder grouping
9. AI CHAT      -> Conversational tutor, document summaries, quiz generation
10. TRENDS      -> Activity pulse heatmap, deep hours, learner profile, interview Q&A
```

### 10.2 Complete Data Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': '#0A0A0A', 'primaryColor': '#1a1a2e', 'primaryTextColor': '#f5f5f5', 'lineColor': '#FFCF70'}}}%%
flowchart LR
  subgraph Input["<b><font color=#4ADE80>INPUT SOURCES</font></b>"]
    direction TB
    BRW[("🧩 <b>Browser Extension</b><br/>Tab tracking")]
    DKT[("💻 <b>Desktop Agent</b><br/>Window tracking")]
    MAN[("👤 <b>Manual Entry</b><br/>Sessions/Tasks/Notes")]
    UPLD[("📤 <b>File Upload</b><br/>PDFs/Images/Videos")]
  end

  subgraph Process["<b><font color=#FFCF70>PROCESSING</font></b>"]
    direction TB
    TELEM[("📡 <b>Telemetry Ingestion</b><br/>BrowserTelemetry<br/>DesktopTelemetry")]
    ANALYTICS[("📊 <b>Analytics Engine</b><br/>Aggregation<br/>28-day Pulse<br/>Deep Hours")]
    AI[("🤖 <b>AI Service</b><br/>Summaries<br/>Quizzes<br/>Chat<br/>Profiles")]
    CRUD[("📦 <b>CRUD Operations</b><br/>Sessions/Tasks<br/>Notes/Resources")]
  end

  subgraph Store["<b><font color=#60A5FA>STORAGE</font></b>"]
    PG[("🐘 <b>PostgreSQL</b><br/>15 Tables")]
    FL[("📁 <b>Disk Storage</b><br/>uploads/images<br/>uploads/pdfs<br/>uploads/videos")]
  end

  subgraph Output["<b><font color=#F87171>OUTPUT / DISPLAY</font></b>"]
    DASH[("📊 <b>Dashboard</b><br/>Stats + Streaks")]
    TREND[("📈 <b>Trends Page</b><br/>Activity Pulse<br/>Profile + Insights")]
    CHAT[("💬 <b>AI Chat</b><br/>Mentor Q&A")]
    CURR[("📚 <b>Curriculum</b><br/>Progress + Tasks")]
  end

  BRW --> TELEM
  DKT --> TELEM
  TELEM --> PG
  MAN --> CRUD
  CRUD --> PG
  UPLD --> FL
  UPLD --> CRUD
  PG --> ANALYTICS
  PG --> AI
  PG --> DASH
  PG --> TREND
  PG --> CURR
  ANALYTICS --> TREND
  AI --> CHAT
  AI --> TREND

  style BRW fill:#1a1a2e,stroke:#A78BFA,stroke-width:2px,color:#fff
  style DKT fill:#1a1a2e,stroke:#F87171,stroke-width:2px,color:#fff
  style PG fill:#0f3460,stroke:#60A5FA,stroke-width:3px,color:#fff
```

### 10.3 Telemetry Pipeline

```
Browser Extension / Desktop Agent
  |
  | Tab switch/window change: POST /api/telemetry/browser or /desktop
  | { url, title, domain, duration, category }
  v
Telemetry Controller -> Prisma CRETE -> BrowserTelemetry / DesktopTelemetry tables
  |
  | (on demand via GET /api/telemetry/stats)
  v
Analytics Service:
  1. Aggregate deep hours (IDE + Terminal + Documentation categories)
  2. Calculate session intensity
  3. Group by app/domain for top sessions
  4. Build 28-day activity pulse array (0-3 scale)
  5. Generate AI learner profile + interview questions
```

### 10.4 AI Pipeline

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': '#0A0A0A'}}}%%
sequenceDiagram
    participant U as 👤 User
    participant F as 🌐 Frontend
    participant C as 🎮 AI Controller
    participant S as ⚙️ AI Service
    participant L as 🤖 LLM (future)

    Note over U,L: AI Feature Interactions

    U->>F: Uploads document / pastes text
    F->>C: POST /api/ai/summary { text }
    C->>S: generateSummary(text)
    S->>S: Simulate 1.5s processing
    S-->>C: { summary, keyTopics }
    C-->>F: Summary + Key Topics
    F-->>U: Display results

    U->>F: Requests practice quiz
    F->>C: POST /api/ai/quiz { text }
    C->>S: generateQuiz(text)
    S-->>C: [{ question, options, answer, explanation }]
    C-->>F: Quiz questions
    F-->>U: Interactive quiz UI

    U->>F: Asks question in AI Chat
    F->>C: POST /api/ai/chat { messages }
    C->>S: chatWithTutor(messages)
    alt Contains "mutex"
        S-->>C: Detailed mutex explanation with code
    else Contains "deadlock"
        S-->>C: Deadlock explanation with prevention tips
    else General question
        S-->>C: Generic mentoring response
    end
    C-->>F: AI reply
    F-->>U: Display in chat UI

    Note over S: Currently mocked. To integrate real LLM:<br/>Replace ai.service.ts with OpenAI/Gemini SDK
```

```
POST /api/ai/summary { text } -> generateSummary(text) -> { summary, keyTopics }
POST /api/ai/quiz    { text } -> generateQuiz(text)    -> [{ question, options, answer, explanation }]
POST /api/ai/chat    { messages } -> chatWithTutor()   -> { reply }

Currently mocked (simulated 1-1.5s delay). To integrate real LLM:
  Replace ai.service.ts with OpenAI/Gemini SDK calls.
```

### 10.5 Authentication Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'background': '#0A0A0A'}}}%%
sequenceDiagram
    participant U as 👤 User
    participant F as 🌐 Next.js Frontend
    participant A as 🔐 Auth Middleware
    participant B as 🎮 Auth Controller
    participant P as 🐘 PostgreSQL

    Note over U,P: Registration Flow
    U->>F: Fills registration form
    F->>B: POST /api/auth/register { name, email, password }
    B->>P: Check if email exists
    alt Email exists
        P-->>B: User found
        B-->>F: 409 Conflict
        F-->>U: "Email already registered"
    else New email
        P-->>B: Not found
        B->>B: bcrypt.hash(password, 12)
        B->>P: INSERT User
        P-->>B: Created user
        B->>B: Generate JWT token
        B-->>F: 201 { token, user }
        F->>F: Store token in localStorage
        F-->>U: Redirect to /dashboard
    end

    Note over U,P: Login Flow
    U->>F: Enters email + password
    F->>B: POST /api/auth/login { email, password }
    B->>P: SELECT user WHERE email = ?
    alt Not found
        P-->>B: Empty
        B-->>F: 401 Invalid credentials
    else Found
        P-->>B: User with hashed password
        B->>B: bcrypt.compare(password, hash)
        alt Wrong password
            B-->>F: 401 Invalid credentials
        else Correct
            B->>B: Generate JWT (userId payload)
            B-->>F: 200 { token, user }
            F->>F: Store token
            F-->>U: Redirect to /dashboard
        end
    end

    Note over U,P: Authenticated Request
    U->>F: Access dashboard
    F->>A: GET /api/sessions (Bearer token)
    A->>A: verifyToken(token)
    alt Invalid/expired
        A-->>F: 401
        F-->>U: Redirect to login
    else Valid
        A->>F: Attach user to req
        Note over F: Proceed with controller logic
    end
```

### 10.6 Deployment Workflow (Render)

```
GitHub Push -> Render Blueprint (render.yaml)
  |
  |-- studytrack-api (Web Service)
  |     Build: npm install -> prisma generate -> tsc
  |     Start: node dist/server.js
  |     Env: DATABASE_URL (from managed DB), JWT_SECRET (auto-gen)
  |
  |-- studytrack-web (Web Service)
  |     Build: npm install -> next build
  |     Start: next start
  |     Env: NEXT_PUBLIC_API_URL (pointing to API service)
  |
  |-- studytrack-db (Managed PostgreSQL, free plan)
```

---

## 11. Local Development Setup

### Prerequisites
- Node.js 18+, npm, PostgreSQL

### Quick Start
```bash
# From project root:
run.bat        # Launches backend (port 5000) + frontend (port 3000)
```

### Manual Setup
```bash
# Backend
cd backend
npm install
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev    # http://localhost:5000

# Frontend
cd ../frontend
npm install
npm run dev    # http://localhost:3000

# Desktop Agent (optional)
cd ../extension/desktop
npm install
node index.js

# Browser Extension (optional):
# Chrome -> chrome://extensions -> Developer mode -> Load unpacked
# Select extension/browser/ directory
```

### Environment Variables (`backend/.env`)
```
DATABASE_URL="prisma+postgres://user:pass@host:port/db?sslmode=require"
JWT_SECRET="your_secret_key"
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

---

## 12. Deployment (Render)

The `render.yaml` blueprint creates three resources:

| Service | Plan | Purpose |
|---------|------|---------|
| studytrack-api | Web (free) | Express backend |
| studytrack-web | Web (free) | Next.js frontend |
| studytrack-db | PostgreSQL (free) | Managed database |

Deploy steps:
1. Push code to GitHub
2. Render.com -> New Blueprint -> Connect repo
3. Render reads `render.yaml`, creates all resources
4. After first deploy, run `npx prisma db push` on backend shell

---

## 13. Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs, 12 rounds |
| JWT auth | Bearer header + httpOnly cookie options |
| HTTP security | Helmet (CSP, HSTS, X-Frame-Options) |
| CORS | Whitelisted origin via FRONTEND_URL env |
| Rate limiting | express-rate-limit on /api/* |
| Input validation | express-validator |
| File validation | MIME whitelist, 50MB limit |
| SQL injection | Prisma ORM (parameterized queries) |
| XSS | Helmet + React auto-escaping |
| Cookie security | httpOnly, secure (prod), sameSite: strict |
| Error handling | No stack traces in production responses |
| Privacy | Only aggregated stats exposed; no raw browsing history |
