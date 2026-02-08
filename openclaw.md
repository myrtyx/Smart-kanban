# OpenClaw Integration Guide

This document describes how to integrate **OpenClaw** (Telegram AI agent) with the Smart Kanban backend. OpenClaw accepts free‑form text commands in Telegram, interprets them with AI, and creates tasks via the API.

## 1. Purpose
- User writes a task in Telegram (free‑form text).
- AI parses the intent (task title, priority, status, project, etc.).
- OpenClaw calls the Kanban API to persist the task.

## 2. System Components
1. **Telegram Bot** — receives user messages.
2. **AI Interpreter** — extracts task fields.
3. **OpenClaw Server** — runs on your server and calls the Kanban API.
4. **Kanban API** — Express server (`server.js`) with `data.json` storage and auth.

## 3. Kanban API (Target)
Base URL: same origin in production (API + frontend served by `server.js`).

Required endpoints (authenticated):
- `GET /projects`
- `POST /tasks`
- `PUT /tasks/:id`

Auth:
- `POST /auth/login` to obtain access token (JWT).
- Use `Authorization: Bearer <token>` on API requests.

Create task payload:
```
POST /tasks
Content-Type: application/json

{
  "title": "...",
  "description": "...",
  "status": "todo | in-progress | checking | completed",
  "priority": "none | low | medium | high",
  "projectId": "..."
}
```

## 4. Parsing Strategy (Suggested)
- **title** — required. Use the main clause.
- **description** — optional details.
- **priority** — map words:
  - `urgent`, `high` → `high`
  - `medium`, `normal` → `medium`
  - `low`, `minor` → `low`
  - if missing → `none`
- **status** — map keywords:
  - `todo`, `backlog` → `todo`
  - `doing`, `in progress` → `in-progress`
  - `review`, `checking` → `checking`
  - `done`, `completed` → `completed`
- **project** — match by name via `/projects`.
  - if no match → use Default Project.

## 5. Example Flow
User message:
```
"Fix login page error in project Marketing, high priority"
```

AI output:
```
{
  "title": "Fix login page error",
  "description": "",
  "priority": "high",
  "status": "todo",
  "project": "Marketing"
}
```

OpenClaw steps:
1. GET `/projects`
2. Match `Marketing` → projectId
3. POST `/tasks` with the resolved fields

## 6. Error Handling
- If project is not found → use Default Project.
- If status is invalid → fallback to `todo`.
- If priority is invalid → fallback to `none`.
- If API request fails → report error to user.

---
If you want, I can implement the actual OpenClaw server stub + webhook next.
