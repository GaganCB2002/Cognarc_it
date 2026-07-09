<div align="center">
  
# 💎 StudyTrack 💎
### ✨ AI Developer Learning OS ✨

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00FF99&center=true&vCenter=true&width=600&lines=Deep+work+tracker;AI+tutor+%26+curriculum+planner;Productivity+analytics+platform;Built+with+Next.js+16+%2B+Gemini+AI)](https://git.io/typing-svg)

🔸 **Next.js 16** 🔹 **Express 5** 🔸 **PostgreSQL** 🔹 **Gemini AI** 🔸

</div>

---

## 🏗 Architecture & Project Flow

StudyTrack is a full-stack, AI-driven learning operating system built for developers. The architecture separates the client interface (Next.js) from the robust backend API (Node.js/Express) and uses a PostgreSQL database via Prisma ORM.

```mermaid
graph TD
    subgraph Frontend [Next.js 16 App Router]
        UI[React Components]
        Store[Zustand / Context]
        API_Client[API Fetch Wrapper]
        
        UI --> Store
        UI --> API_Client
    end
    
    subgraph Backend [Express 5 API]
        Controllers[Controllers]
        Services[Services & AI]
        Prisma[Prisma ORM]
        
        Controllers --> Services
        Services --> Prisma
    end
    
    subgraph Database
        Postgres[(PostgreSQL)]
    end
    
    API_Client -- HTTP/REST --> Controllers
    API_Client -- Socket.IO --> Backend
    Prisma -- SQL --> Postgres
```

### End-to-End User Flow
1. **Authentication:** 
   - User registers via `/register` (optionally verified via Captcha).
   - User logs in using a Password or OTP at `/login`.
   - **Face Login**: Users can enroll their face in `/settings`. Upon next login, MediaPipe verifies "Liveness" (by requiring 3 eye blinks), captures the image, and the backend verifies the face against the database using Google Gemini AI.
2. **Dashboard & Tracking:**
   - Authenticated users access the Dashboard (`/dashboard`) to view Live Activity, study stats, and calendar previews.
   - Users can track deep work sessions in `/tracking`.
3. **Knowledge & AI:**
   - **PDF Intelligence:** Users upload PDFs. The Gemini API provides full summaries, study questions, and MCQs.
   - **Project-Aware RAG:** A floating ChatBot uses Retrieval-Augmented Generation (RAG) to scan the entire codebase and answer specific questions.

---

## 📂 Full Project File Structure

### Backend (`/backend`)
```text
D:\Cognarc it\backend\
├── prisma/
│   └── schema.prisma             # PostgreSQL schema with 25 models
├── src/
│   ├── server.ts                 # Express entry point + WebSockets setup
│   ├── controllers/              # Handles incoming HTTP requests
│   │   ├── ai.controller.ts      # AI RAG & Chat endpoints
│   │   ├── authController.ts     # Login, Register, Face Auth
│   │   ├── noteController.ts     # Markdown notes management
│   │   ├── uploadController.ts   # Document & file handling
│   │   └── ... (16 controllers)
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication guard
│   │   └── upload.ts             # Multer setup for file parsing
│   ├── routes/                   # Express route definitions
│   │   ├── ai.routes.ts          
│   │   ├── auth.ts               
│   │   └── ... (17 routes)
│   ├── services/                 # Core business logic and external APIs
│   │   ├── ai.service.ts         # Prompts & AI Orchestration
│   │   ├── gemini.service.ts     # Direct Google Gemini integration
│   │   ├── project-indexer.service.ts # File indexing for RAG chatbot
│   │   └── ... (Storage, Email, etc.)
│   ├── data/
│   │   └── project-context.ts    # Centralized context string for AI agent
│   └── utils/
│       └── helpers.ts            # JWT generation, token utilities
└── .env                          # Backend environment variables
```

### Frontend (`/frontend`)
```text
D:\Cognarc it\frontend\
├── src/
│   ├── app/                      # Next.js App Router Pages
│   │   ├── (auth)/               
│   │   │   ├── login/page.tsx    # Multi-tab login (Password, OTP, Face)
│   │   │   ├── reset-password/   
│   │   │   └── forgot-password/  
│   │   ├── (dashboard)/          # Protected User Routes
│   │   │   ├── admin/            # Admin controls
│   │   │   ├── analytics/        # Charts and study trends
│   │   │   ├── pdf-intelligence/ # AI-driven document analysis
│   │   │   ├── profile/          # User stats and settings
│   │   │   ├── settings/         # Theme, notifications, Face Enrollment
│   │   │   ├── tracking/         # Study/work session tracking
│   │   │   └── ... (20 total routes)
│   │   ├── layout.tsx            # Global providers (Auth, Theme)
│   │   └── page.tsx              # Landing Page
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # Buttons, Inputs, Cards, Badges
│   │   ├── dashboard/            # Specialized widgets (ChatBot, Activity)
│   │   └── calendar/             # Scheduling UI components
│   ├── lib/
│   │   ├── api.ts                # Axios wrapper with auto-JWT attachment
│   │   └── auth-context.tsx      # Auth State & Session Management
│   └── store/
│       └── sidebarStore.ts       # Zustand state management
└── .env.local                    # Frontend environment variables
```

---

## 🗄️ Database Design (Prisma / PostgreSQL)

The database consists of **25 interconnected models** providing robust tracking, analytics, and AI context.

```mermaid
erDiagram
    User ||--o{ TrackingSession : "tracks"
    User ||--o{ Task : "manages"
    User ||--o{ Note : "writes"
    User ||--o{ Document : "uploads"
    User ||--o{ CalendarEvent : "schedules"
    User ||--o{ AIConversation : "participates"
    
    TrackingSession ||--o{ ActivityEvent : "contains"
    
    Document ||--o| DocumentIntelligence : "analyzed by"
    Note ||--o| NoteIntelligence : "analyzed by"
    
    AIConversation ||--o{ AIMessage : "contains"
    
    User {
        String id PK
        String email
        String role
        Boolean isApproved
        String faceData
    }
    
    TrackingSession {
        String id PK
        String status
        DateTime startTime
        DateTime endTime
    }
    
    Document {
        String id PK
        String originalName
        String storageKey
    }
    
    DocumentIntelligence {
        String id PK
        String summary
        Json mcqs
        Json flashcards
    }
```

### Core Entities

1. **User & Auth**
   - `User`: Handles core identity, storing `email`, `password`, `faceData` (for Face Login), and `role`.
   - `Profile`: Extended user metadata (bio, target role, skills, weekly goals).
   - `Session` & `LoginHistory`: Audit trails for authentication events.
   - `Otp`: Manages short-lived, one-time passwords for secure logins.

2. **Tracking & Analytics**
   - `TrackingSession`: A primary block of deep-work time. Holds `status`, `startTime`, and total pause duration.
   - `ActivityEvent`: Micro-events tracking individual actions (e.g., viewing a page, completing a task) inside a `TrackingSession`.
   - `Report`: AI-generated and metric-driven reports based on daily or session-based tracking.
   
3. **Knowledge & Resources**
   - `Document`: Represents uploaded files (PDFs, Images). Contains cloud `storageKey` and status.
   - `Note`: Markdown-based study notes. 
   - `Task`: Kanban-style to-do items.

4. **AI Intelligence**
   - `AIConversation` & `AIMessage`: Stores user chat history with the StudyBot.
   - `DocumentIntelligence`: Holds cached Gemini API results for a `Document`, including `summary`, `mcqs`, and `interviewQuestions`.
   - `NoteIntelligence`: Holds AI-generated keywords and summaries for user `Notes`.

---

## 🤖 AI Integration Details

The platform heavily utilizes **Google Gemini** (via `gemini-2.5-flash` and `gemini-2.5-pro`):

- **Face Verification**: The backend takes a Base64 image from the webcam, compares it to the database `faceData`, and prompts Gemini to ensure it is the same person, has eyes open, and is a real human face.
- **Project Query (RAG)**: The `project-indexer.service.ts` indexes the entire codebase. When a user asks the floating ChatBot a question, it retrieves relevant source files and feeds them to Gemini for context-aware developer answers.
- **PDF Summarization**: When viewing a document, the AI analyzes the text to generate comprehensive Study Guides, Flashcards, and MCQs automatically.

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Create a `.env` in `/backend` and `.env.local` in `/frontend`.

**Backend (`/backend/.env`)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/studytrack"
JWT_SECRET="your-super-secret-key"
FRONTEND_URL="http://localhost:3000"
PORT=5000
GEMINI_API_KEY="your-google-gemini-key"
```

**Frontend (`/frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 2. Run Backend
```bash
cd backend
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to start using the OS.
