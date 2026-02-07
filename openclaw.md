# OpenClaw Integration Guide

This document describes how to integrate **OpenClaw** (Telegram AI agent) with the Smart Kanban backend. OpenClaw accepts free‑form text commands in Telegram, interprets them with AI, authenticates, and creates tasks via the API.

## 1. Purpose
OpenClaw serves as a human‑friendly entry point to your Kanban system:
- User writes a task in Telegram (free‑form text).
- AI parses the intent (task title, priority, status, project, etc.).
- OpenClaw logs in to the API to get a token.
- OpenClaw calls the Kanban API to persist the task.

## 2. System Components
1. **Telegram Bot** — receives user messages.
2. **AI Interpreter** — extracts task fields (title, description, priority, status, project).
3. **OpenClaw Server** — runs on your server, holds the bot token, calls the Kanban API.
4. **Kanban API** — Express server (`server.js`) with token auth and `db.json` storage.

## 3. Authentication Flow
The API requires a Bearer token.

### Login request
```
POST /login
Content-Type: application/json

{
  "username": "polina",
  "password": "Polina2004"
}
```

### Login response
```
{ "token": "<token>" }
```

### Authorized requests
Use the token in `Authorization` header:
```
Authorization: Bearer <token>
```

## 4. Kanban API (Target)
Base URL: `http://localhost:3001` (override in production)
If `VITE_API_URL` is set without a port, the frontend will use `:3001` automatically.

Required endpoints:
- `GET /projects`
- `POST /tasks`
- `PUT /tasks/:id`

Create task payload:
```
POST /tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "...",
  "description": "...",
  "status": "todo | in-progress | checking | completed",
  "priority": "none | low | medium | high",
  "projectId": "..."
}
```

## 5. Parsing Strategy (Suggested)
When a message is received, extract the following:

- **title** — required. Use the main clause of the message.
- **description** — optional. Use any extra sentence or details.
- **priority** — map common words:
  - `urgent`, `high` → `high`
  - `medium`, `normal` → `medium`
  - `low`, `minor` → `low`
  - if missing → `none`
- **status** — map pipeline keywords:
  - `todo`, `backlog` → `todo`
  - `doing`, `in progress` → `in-progress`
  - `review`, `checking` → `checking`
  - `done`, `completed` → `completed`
- **project** — try to match by name against `/projects` list.
  - if no match → use Default Project.

## 6. Example Flow
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
1. POST `/login` → get token
2. GET `/projects`
3. Match `Marketing` → projectId
4. POST `/tasks` with the resolved fields

## 7. Error Handling
- If project is not found → use Default Project.
- If status is invalid → fallback to `todo`.
- If priority is invalid → fallback to `none`.
- If API request fails → send error message back to Telegram.
- If token expires or is missing → re‑login.

## 8. Security Notes
- Do not expose the Kanban API publicly without HTTPS.
- If running OpenClaw remotely, protect API with a firewall or private network.
- Store Telegram bot token in environment variables.

## 9. Suggested Extensions
- Add `/tasks` search by title for updates.
- Allow OpenClaw to move tasks by ID.
- Add `/projects` creation from Telegram.
- Add user‑based routing (per Telegram user).

## 10. Minimal Pseudocode
```
onMessage(text):
  intent = ai.parse(text)
  token = POST /login
  projects = GET /projects (auth)
  projectId = match(intent.project, projects) || defaultProjectId
  payload = {
    title: intent.title,
    description: intent.description,
    status: normalizeStatus(intent.status),
    priority: normalizePriority(intent.priority),
    projectId
  }
  POST /tasks payload (auth)
```

---
If you want, I can implement the actual OpenClaw server stub + webhook next.
