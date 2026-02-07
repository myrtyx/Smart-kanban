# Smart Kanban — Developer Documentation

This document explains how Smart Kanban is structured internally, how data flows, how drag‑and‑drop is wired, and how to extend the system safely. The app uses a lightweight Node.js API with a local JSON database (`db.json`) and a single‑account token login.

## 1. Architecture Overview
The app is a **single‑page React application** built with Vite and Tailwind CSS. It uses local state (React hooks) for UI and data management and persists projects/tasks to a Node.js backend (Express) that stores data in `db.json`.

Key architectural choices:
- **Local backend** — data is stored in `db.json` on disk via Express API.
- **Single source of truth** — `App.jsx` holds all main state and passes down handlers.
- **Pure UI components** — `Sidebar`, `KanbanBoard`, `TaskCard`, `Modal` are mostly presentational.
- **DnD** — drag logic is controlled at the `DndContext` level.
- **Token login** — API access requires a login token stored in `localStorage`.

## 2. File Map
```
server.js             # Express API (JSON file persistence + auth)
db.json               # Local database file

src/
  hooks/
    useKanbanApi.js   # API integration + auth + polling
  components/
    KanbanBoard.jsx   # Column layout + per‑column task list
    Modal.jsx         # Generic modal layout + close button
    Sidebar.jsx       # Project navigation + actions
    TaskCard.jsx      # Draggable task card
  App.jsx             # State, handlers, modals, API integration
  index.css           # Tailwind + global theme
  main.jsx            # React entrypoint
```

## 3. Data Model
### Project
```
{
  id: string,
  name: string,
  color: string, // hex
  isDefault: boolean
}
```

### Task
```
{
  id: string,
  title: string,
  description: string,
  status: "todo" | "in-progress" | "checking" | "completed",
  priority: "none" | "low" | "medium" | "high",
  projectId: string
}
```

## 4. Auth Model
- Single account (no registration).
- Login via `POST /login` returns a token.
- Token stored in `localStorage` and sent as `Authorization: Bearer <token>`.
- Credentials are read from `.env` on the server.

## 5. Persistence
Persistence is handled by the Express API in `server.js`, which reads/writes `db.json`.

Initial load behavior on server start:
- If `db.json` is empty → create **Default Project** and demo tasks.
- Otherwise → keep existing records.

## 6. API Endpoints
Base URL: `http://localhost:3001`
If `VITE_API_URL` is set without a port, the frontend automatically appends `:3001`.

- `POST /login` — login and receive token
- `GET /health` — health check (no auth)
- `GET /projects` — list projects
- `POST /projects` — create project
- `PUT /projects/:id` — update project (name/color)
- `DELETE /projects/:id` — delete project (blocked for Default Project)
- `GET /tasks` — list tasks
- `POST /tasks` — create task
- `PUT /tasks/:id` — update task
- `DELETE /tasks/:id` — delete task

## 7. API Integration Hook
`useKanbanApi` (in `src/hooks/useKanbanApi.js`) is the single integration point for the frontend.

It exposes:
- `projects`, `tasks`, `loading`, `error`
- `login`, `logout`
- `createProject`, `updateProject`, `deleteProject`
- `createTask`, `updateTask`, `deleteTask`

Polling/refresh:
- Polls every 5 seconds (silent refresh).
- Refreshes when the browser tab becomes visible again.

## 8. Drag & Drop
### Setup
- DnD root is created in `App.jsx` via `DndContext`.
- `PointerSensor` handles drag activation.
- `DragOverlay` renders the floating card.

### Task card
Each `TaskCard` is a draggable source using `useDraggable({ id })`.

### Drop targets
Each column is a droppable zone via `useDroppable({ id: statusId })`.

### Drop behavior
When the drag ends:
- If dropped on a valid column, the task’s `status` is updated via API.
- Tasks are updated in state → UI re‑renders immediately.

## 9. UI Components in Detail
### Sidebar.jsx
- Lists projects
- Handles switching project filter
- Buttons for adding/editing projects

### KanbanBoard.jsx
- Builds four columns from `STATUSES`
- Each column:
  - Lists tasks
  - Shows empty state
  - Shows the **Add Task** button at the bottom

### TaskCard.jsx
- Draggable task
- Shows title, optional description
- Shows priority badge and project name
- Edit and delete actions appear on hover

### Modal.jsx
Reusable modal wrapper with title + close button. All modals are composed on top of it.

## 10. Project Modals
### Add Project
- Name + color (palette + custom picker)
- On submit → adds to `projects` and selects it

### Edit Projects
- Inline edit for project names
- Color palette + custom picker
- Delete project button (disabled for Default Project)
- On delete → tasks for that project are also removed

## 11. Task Modals
### Add / Edit Task
- Title (required)
- Description (optional)
- Project select (custom dropdown)
- Priority select (No status / Low / Medium / High)
- Status select (custom dropdown)

Modal is used for both creation and editing:
- If `editingTask` exists → updates the matching task
- Otherwise → creates new task with selected column status

## 12. Extending the Project
### A. Add new status
1. Extend `STATUSES` in `App.jsx`.
2. Update any UI labels as needed.
3. Drag‑and‑drop will automatically work (status IDs are used as droppable targets).

### B. Add new priority
1. Extend priority options in the custom dropdown in `TaskModal`.
2. Update `TaskCard.jsx` badge styles.

### C. Add search
1. Add query state in `App.jsx`.
2. Filter tasks in `filteredTasks` before grouping.

### D. Add task ordering within columns
1. Replace `@dnd-kit/core` with `@dnd-kit/sortable`.
2. Maintain `order` field on tasks.

## 13. Styling System
Tailwind is used directly in JSX. Global styles live in `src/index.css`:
- Google fonts are imported
- Base body styles are set
- Scrollbar styles are customized

## 14. Known Constraints
- Data is stored locally in `db.json` (no cloud sync).
- No cross‑device sync.
- Drag‑drop does not reorder tasks within a column (only status change).

## 15. Local Development
```
npm install
npm run dev
```

## 16. Build
```
npm run build
```

## 17. Deployment Checklist (Step‑by‑Step)
Use this sequence to avoid **fail to fetch** / **unauthorized** errors.

### A. Prerequisites
1. Node.js >= 20.19 (or 22.12+).
2. Two processes: **API server** and **frontend** must both run.

### B. Configure Environment
1. **Backend `.env`** (server runtime):
```
KANBAN_USERNAME=polina
KANBAN_PASSWORD=Polina2004
```
2. **Frontend `.env`** (Vite build/runtime):
```
VITE_API_URL=http://YOUR_API_HOST:3001
```
Notes:
- `VITE_API_URL` must be reachable **from the browser**.
- If running on a remote server, it must be the public IP or domain.

### C. Start the API
1. From project root:
```
npm run server
```
2. Verify:
```
curl http://YOUR_API_HOST:3001/projects
```
Expected: `401 Unauthorized` (this is correct without token).

### D. Login (Get Token)
1. Send login request:
```
curl -X POST http://YOUR_API_HOST:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"polina","password":"Polina2004"}'
```
2. Response example:
```
{ "token": "..." }
```

### E. Verify Token Works
```
curl http://YOUR_API_HOST:3001/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: JSON array of projects.

### F. Start Frontend
1. Build or dev:
```
npm run dev
```
2. Open the Vite URL (default `http://localhost:5173`).

### G. Common Errors (Fast Fixes)
- **fail to fetch**
  - `VITE_API_URL` is wrong or unreachable from browser.
  - API server not running or blocked by firewall.
  - Use server’s public IP/domain, not `localhost`, when accessing from another machine.

- **unauthorized**
  - Login failed or token missing.
  - Wrong `KANBAN_USERNAME` / `KANBAN_PASSWORD` on server.
  - API restarted and old token became invalid → log in again.

- **CORS**
  - If API is on a different domain, ensure it’s reachable (current server allows all origins).

### H. Recommended Production Flow
1. Start API first (`npm run server`).
2. Build frontend with correct `VITE_API_URL`.
3. Serve frontend (Vite preview, static host, or Nginx).

---
If you need additional architectural details (e.g., state diagrams, data flow charts, or a plugin API), extend this document accordingly.
