# Self-Learning Dashboard & Monitoring System — Architecture Plan

## 1. What This System Does

A web platform where a learner (e.g. an aspiring Java/Python full-stack or DevOps developer) can:
- Upload learning material (PDFs, images, videos, links) in bulk
- Get AI-generated summaries + important Q&A from uploaded PDFs
- Get a personalized daily/weekly/15-day revision schedule (spaced repetition)
- Track tasks: mark things learned, pending, or confused (auto-tagged for review)
- See a live "what's trending in the market" panel for Java/Python full-stack + DevOps skills
- Log in with role-based access (learner, admin, mentor/reviewer)
- All on a system that comfortably handles 100–150 concurrent users

This doc is a blueprint you can hand to Claude Code section-by-section to build.

---

## 2. High-Level Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────┐
│  Frontend    │◄────►│   Backend API     │◄────►│   PostgreSQL        │
│  (React)     │      │   (Node/Nest or   │      │   (users, tasks,    │
│              │      │    Spring Boot)   │      │   files, schedules) │
└─────────────┘      └────────┬─────────┘      └───────────────────┘
                               │
                 ┌─────────────┼──────────────┐
                 ▼             ▼              ▼
          ┌───────────┐ ┌────────────┐ ┌──────────────┐
          │ Object     │ │ Redis      │ │ AI Service    │
          │ Storage    │ │ (queue +   │ │ (Claude API   │
          │ (S3/Minio) │ │  cache)    │ │ for summaries)│
          └───────────┘ └────────────┘ └──────────────┘
                 │
                 ▼
          ┌───────────────┐
          │ Background     │
          │ Worker (BullMQ │
          │ /Celery)       │
          │ - PDF parsing  │
          │ - Reminders    │
          │ - Market scan  │
          └───────────────┘
```

**Why this shape:** the heavy jobs (PDF parsing, AI summarization, sending reminders, market research scraping) must NOT block the web request — they go on a queue and a background worker processes them. This is what lets 100+ users stay snappy at once.

---

## 3. Recommended Tech Stack

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | **React + TypeScript + Tailwind** | Fast dev, huge ecosystem, matches your "interactive landing page" need |
| Backend API | **Node.js (NestJS)** *or* **Spring Boot (Java)** | NestJS if you want speed of build; Spring Boot if this is also a Java-skills showcase for your own portfolio |
| Auth | **JWT + refresh tokens**, roles stored in DB (Learner / Admin / Mentor) | Simple, scalable, no vendor lock-in |
| Database | **PostgreSQL** | Relational integrity for users/tasks/schedules; JSON columns for flexible metadata |
| Cache/Queue | **Redis + BullMQ** (Node) or **Redis + Celery** (Python) | Needed for reminders, background PDF jobs, rate limiting |
| File Storage | **AWS S3** or **Cloudflare R2** (self-host option: MinIO) | PDFs/images/videos should never sit on the app server disk |
| PDF Parsing | **pdf-parse / pdfplumber** for text extraction, then Claude API for summarization + Q&A generation | Two-step: extract text → send to AI |
| AI Summarization | **Claude API** (Sonnet-class model) via your Anthropic API key | Summaries, key-question generation, "what to revise" suggestions |
| Notifications/Reminders | **node-cron / Celery beat** for scheduling + **email (Resend/SendGrid)** + optional **web push** | Daily/weekly/15-day revision reminders |
| Market Research module | **Scheduled job** using web search (SerpAPI or Claude with web search) that refreshes a cached "current in-demand skills" panel weekly | Avoids querying live on every page load |
| Deployment | **Docker Compose** for dev; **Render / Railway / AWS ECS** for prod | 100–150 concurrent users comfortably fits on a single mid-tier instance + managed Postgres |
| Monitoring | **Prometheus + Grafana** or hosted (Better Stack, Sentry for errors) | Since you called this a "monitoring system," this matters |

---

## 4. Core Modules

### 4.1 Auth & RBAC
- `users` table: id, email, password_hash, role (`learner`, `mentor`, `admin`), created_at
- Roles gate: learners see only their own data; mentors see assigned learners; admins see everything
- JWT access token (short-lived) + refresh token (httpOnly cookie)

### 4.2 File Upload & Multi-file Support
- Upload endpoint accepts PDF, image, video, or a pasted link
- Files go straight to S3/R2 via a pre-signed URL (don't proxy big files through your API server)
- A `materials` table tracks: id, user_id, type, s3_key/url, status (`uploaded → processing → summarized`)
- Multiple files per "topic" or "course" grouping

### 4.3 PDF Summarization + Question Generation (the AI core)
Pipeline when a PDF is uploaded:
1. Background worker downloads it, extracts text (chunk if large)
2. Sends chunks to Claude API with a prompt like: *"Summarize this section, list 5 key concepts, generate 5 exam-style questions"*
3. Stitches results into: **Summary**, **Key Topics**, **Important Questions**, **Suggested Revision Date**
4. Stores structured result in `summaries` table linked to the material

### 4.4 Task & Spaced-Repetition Revision Engine
This is your "daily/weekly/every-15-days" system — classic **spaced repetition**:
- Each learned topic gets a `next_review_date`
- Suggested default intervals: **1 day → 3 days → 7 days → 15 days → 30 days** (adjust based on whether the user marks it "confused" or "confident")
- A daily job checks all users' due topics and creates that day's task list + sends reminder
- `tasks` table: id, user_id, topic_id, status (`pending/done/confused`), due_date, streak_count

### 4.5 "Confused" Flow
- If a user marks a topic "confused," it:
  - Resets the spaced-repetition interval back down (e.g., to 1 day)
  - Surfaces related sub-topics to relearn (pulled from the original PDF's key-topics list)
  - Optionally re-runs a "simplify this concept" AI call

### 4.6 Market/Skills Panel (Java/Python Full-Stack + DevOps)
- A scheduled weekly job asks the AI (with web search) to compile:
  - Current in-demand skills for Java full-stack, Python full-stack, DevOps roles
  - Notable framework/tool shifts
- Cached result shown on dashboard, refreshed weekly — not generated per user per visit (keeps costs and latency down)

### 4.7a Link-Based Materials
Links (YouTube videos, articles, docs) are just another `materials.type` alongside `pdf`/`image`/`video`:
- User pastes a URL → backend fetches metadata (title, thumbnail, og:description)
- If it's an article/page, the same text-extraction → AI-summarization pipeline in 4.3 applies
- If it's a video link, only metadata + optional transcript (via YouTube captions API, if available) goes to the summarizer
- Stored in `materials` with `source_url_or_s3_key` = the link itself (no file to upload)

### 4.7b Device & Browser Time-Tracking ("Study Hours" Report)
This is a **separate component from the web app** — a website cannot see how long you spend in another tab or app just by visiting it. To get this, you need one of two approaches:

**Option A — Browser Extension (recommended, matches "Chrome or Brave" ask)**
- Both Chrome and Brave are Chromium-based, so **one Manifest V3 extension** works on both (and Edge too)
- Extension tracks: active tab URL/domain, time-in-focus, tab-switch events, idle detection (`chrome.idle` API)
- Every few minutes it batches this into an event and POSTs it to your backend (`/api/usage-events`), tagged with the logged-in user's token
- Backend aggregates into a `usage_logs` table → daily/weekly "time spent per site/app" report shown on the dashboard
- **Requires the user to install the extension and log in once** — it cannot silently run on its own

**Option B — Native desktop agent (only if you need tracking outside the browser too, e.g. VS Code, terminal)**
- A lightweight background app (Electron or a simple OS-level script) that logs active-window titles
- Much heavier to build and maintain than an extension; only worth it if "the whole device" genuinely means non-browser apps too

**Important consent note:** tracking someone's full browsing activity is sensitive even on their own device — the extension should be opt-in, show a visible icon/badge while active, and let the user pause tracking or delete logs. This also matters if you later add a "mentor sees my hours" feature — mentors should only see aggregated study-time, not raw browsing history.

**Data model addition:**
```
usage_logs   (id, user_id, domain, app_name, seconds_spent, date, source)  -- source: 'extension' | 'agent'
daily_reports(id, user_id, date, total_active_seconds, top_sites_json, study_vs_distraction_split)
```

**Report shown in dashboard:** total active hours today, breakdown by site/app, a simple "study time vs. other time" split (you can classify domains like docs/PDF-viewer/your-own-app as "study" and everything else as "other").

### 4.7c Hard-Work Calendar & 24-Hour Inactivity Auto-Review
A calendar view that logs every entry the user makes (a task done, a note, a material uploaded, a topic marked confident/confused) with an exact timestamp — this becomes the user's day-by-day "work log."

**How entries are saved:**
- Every user action (add task, log study session, mark topic status) writes a row to `work_log` with `entered_at` (date + time)
- The calendar view groups these by day so the user can see "what I actually did" on any given date, not just what's scheduled

**The 24-hour inactivity trigger:**
- A scheduled job runs hourly and checks: *"has this user logged zero entries in the last 24 hours?"*
- If true, it pulls everything the user **did** enter in their last active window (the most recent day with entries) and runs it through the AI pipeline to produce:
  1. **A summary** of what was covered that day (topics touched, materials uploaded, tasks completed)
  2. **A mixed question set** generated from that content — a deliberate mix of types: multiple-choice, short-answer/conceptual, and scenario-based ("how would you use X in a real project")
  3. **Model answers** for every question, so the user gets a self-check reference immediately, not just a quiz with no key
- This whole package is delivered as a notification + a "Catch-up Review" card on the dashboard, framed as *"You've been quiet for a day — here's what you covered, test yourself, and here are the answers"* rather than a guilt-trip nag

**Why this design:** it turns silence into a gentle re-engagement moment instead of a punitive streak-break message, and it reuses the same AI-summarization pipeline from 4.3 — no new AI logic needed, just a new trigger condition.

**Data model addition:**
```
work_log        (id, user_id, entry_type, reference_id, entered_at)
                 -- entry_type: 'task_done' | 'material_upload' | 'topic_status' | 'note'
catchup_reviews (id, user_id, period_start, period_end, summary_text,
                 questions_json, answers_json, generated_at, delivered_at)
```

**`questions_json` structure (example):**
```json
[
  { "type": "mcq", "question": "...", "options": ["A","B","C","D"], "answer": "B" },
  { "type": "short_answer", "question": "...", "answer": "..." },
  { "type": "scenario", "question": "...", "answer": "..." }
]
```

### 4.7 Landing Page
- Fully static, marketing-style: hero section, feature highlights, sign-up CTA
- Should be a separate lightweight route so it loads instantly (no auth calls)

### 4.8 Dashboard (post-login)
- Today's tasks, upcoming revisions, upload area, market-trends panel, progress stats (streaks, topics mastered)

---

## 5. Minimal Database Schema (starting point)

```
users            (id, email, password_hash, role, created_at)
materials        (id, user_id, type, source_url_or_s3_key, title, status, created_at)
summaries        (id, material_id, summary_text, key_topics[], questions[], created_at)
topics           (id, material_id, name, mastery_level, next_review_date)
tasks            (id, user_id, topic_id, due_date, status, created_at)
reminders        (id, user_id, type, scheduled_at, sent_at)
market_snapshots (id, role_type, content_json, generated_at)
usage_logs       (id, user_id, domain, app_name, seconds_spent, date, source)
daily_reports    (id, user_id, date, total_active_seconds, top_sites_json, study_vs_distraction_split)
work_log         (id, user_id, entry_type, reference_id, entered_at)
catchup_reviews  (id, user_id, period_start, period_end, summary_text, questions_json, answers_json, generated_at, delivered_at)
```

---

## 6. Scaling to 100–150 Concurrent Users

You don't need microservices at this scale — a well-structured **monolith + queue worker** handles it easily:
- 1 API server instance (2–4 vCPU) comfortably serves 100+ concurrent users for typical CRUD/dashboard traffic
- Heavy AI/PDF work is offloaded to the queue so it never blocks web requests
- Postgres connection pooling (PgBouncer) if you later scale up
- Rate-limit the AI summarization endpoint per user (e.g., max 5 concurrent PDF jobs) so one user can't hog the queue

---

## 7. Suggested Build Order (for Claude Code sessions)

1. **Scaffold**: repo, Docker Compose (Postgres + Redis), basic NestJS/Spring Boot skeleton, React app shell
2. **Auth + RBAC**: signup/login, JWT, role middleware
3. **File upload**: S3 integration, `materials` table, multi-file upload UI
4. **AI pipeline**: PDF text extraction + Claude summarization worker
5. **Task/revision engine**: spaced-repetition logic, daily task generation job
6. **Reminders**: email/push scheduling, plus the 24-hour inactivity job that triggers catch-up reviews
7. **Market panel**: weekly cached AI+web-search job
8. **Landing page + dashboard polish**
9. **Browser extension** (Manifest V3, Chrome + Brave) for time-tracking, wired to `/api/usage-events`
10. **Load test** with a tool like k6 targeting 100–150 simulated users

---

## 8. What I'd Need From You Next
When you're ready to build, we can go module-by-module in Claude Code, starting with the scaffold. Just say which module to start with, and whether you want the backend in **Node/NestJS** or **Java/Spring Boot**.
