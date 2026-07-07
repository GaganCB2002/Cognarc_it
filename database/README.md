# StudyTrack Database

This directory contains the complete **PostgreSQL database** design for the StudyTrack platform.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Full database schema with 15 tables, 7 enums, triggers, views, and indexes |
| `seed.sql` | Sample data for development/testing (3 users, sessions, tasks, notes, etc.) |
| `ERD.md` | Entity Relationship Diagrams (Mermaid format with color coding) |

## Quick Start

```bash
# Apply schema
psql -U postgres -d studytrack -f schema.sql

# Load seed data
psql -U postgres -d studytrack -f seed.sql
```

## Schema Overview

- **7 Enums** — Role, AuthProvider, SessionType, Priority, TaskStatus, ResourceType, NotificationType
- **16 Tables** — User, Profile, LearningStreak, Session, LoginHistory, ActivityLog, StudySession, Task, Note, Resource, Collection, Notification, Document, BrowserTelemetry, DesktopTelemetry
- **7 Enums** — Role, AuthProvider, SessionType, Priority, TaskStatus, ResourceType, NotificationType, StorageProvider, DocumentStatus
- **5 Auto-update Triggers** — For `updatedAt` timestamp columns
- **3 Views** — UserDashboard, DailyStudySummary, TelemetryInsights
- **30+ Indexes** — Optimized for query performance on foreign keys, status fields, and JSON arrays

## Entity Groups

| Group | Tables | Purpose |
|-------|--------|---------|
| Core | User, Profile, LearningStreak | User accounts, extended profiles, gamification |
| Auth & Audit | Session, LoginHistory, ActivityLog | Login tracking, security, audit trail |
| Learning | StudySession, Task, Note | Study logging, task management, note-taking |
| Resources | Resource, Collection | Material storage and organization |
| Alerts | Notification | Push/email notifications |
| Telemetry | BrowserTelemetry, DesktopTelemetry | Activity tracking data |
