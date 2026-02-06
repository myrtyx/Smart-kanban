# Smart Kanban

Modern Kanban board built with React (Vite), Tailwind CSS, `@dnd-kit/core`, and a lightweight Node.js API backed by a JSON file.

## Overview
Smart Kanban is a lightweight project/task management UI with four workflow stages. It includes project filtering, task creation/editing, drag‑and‑drop between columns, and persistent storage in the browser so data survives page reloads.

The UI is intentionally minimal and product‑style: soft shadows, rounded cards, and a light background. It supports multiple projects, each with a color that visually tags tasks across the board.

## Features
- 4‑column Kanban board: **To Do**, **In Progress**, **Checking**, **Completed**
- Drag & drop tasks between columns
- Projects sidebar with filters:
  - **All Tasks** view
  - Per‑project view
- Project management:
  - Add project (name + preset/custom color)
  - Edit project name + color
  - Default Project is protected (cannot be deleted)
  - Delete other projects (with confirmation)
- Task management:
  - Create, edit, delete tasks
- Priority badges (No status / Low / Medium / High)
  - Optional description
  - Assign task to a project
  - Status selection in task form
- Backend API with JSON file storage (`db.json`)
- Default data on first launch (so the UI is not empty)
- Confirmation modal before deleting a task or project

## Tech Stack
- **React 19**
- **Vite 7**
- **Tailwind CSS 3**
- **@dnd-kit/core** for drag & drop
- **lucide-react** for icons
- **Express** API (JSON file persistence)

## Project Structure
```
src/
  components/
    KanbanBoard.jsx   # Board layout + columns
    Modal.jsx         # Reusable modal shell
    Sidebar.jsx       # Project list + actions
    TaskCard.jsx      # Task card UI + drag handle
  App.jsx             # State, logic, modals, DnD
  index.css           # Tailwind + base styling
  main.jsx            # App entry
```

## Data Model
### Project
- `id` — unique identifier
- `name` — project name
- `color` — hex color code
- `isDefault` — whether project is protected from deletion

### Task
- `id` — unique identifier
- `title` — task title
- `description` — optional description
- `status` — `todo | in-progress | checking | completed`
- `priority` — `none | low | medium | high`
- `projectId` — reference to project

## Persistence
Data is stored in `db.json` on disk by the Node.js server.  
On first launch, a **Default Project** and a few demo tasks are created.

## Drag & Drop Behavior
- Tasks can be dragged across columns.
- The card “follows” the pointer via `DragOverlay` for smooth dragging.
- The target column is detected by `@dnd-kit/core` collision handling.

## UI Details
- Light gray background (`bg-slate-50/100`)
- Card styling: white surface, rounded corners, soft shadow
- Priority badges:
  - High: rose/red
  - Medium: amber/orange
  - Low: emerald/green
- Project colors appear as dots on task cards
- Empty column state shows a message and an inline **Add Task** button

## How to Run
1. Install dependencies:
```bash
npm install
```
2. Start development servers (Vite + API):
```bash
npm run dev
```
3. Open the URL shown in the console (default: `http://localhost:5173/`).

API runs on `http://localhost:3001`.

## Build for Production
```bash
npm run build
```

## Notes
- Node.js warning: Vite 7 expects Node 20.19+ or 22.12+. If you're on 20.18, it still runs but upgrading is recommended.
- All data lives in `db.json` on the local machine (no remote backend).

## Roadmap Ideas (Optional)
- Task ordering inside columns (sortable)
- Search and filters
- Export/import JSON
- Multi‑assignee tasks

---
Created as a polished, functional Kanban application with strong UX focus and clean component structure.
