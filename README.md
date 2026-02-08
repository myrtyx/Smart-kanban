# Smart Kanban (Single‑Server Deploy)

Modern Kanban board built with React (Vite), Tailwind CSS, and a lightweight Node.js API backed by JSON files.

## What You Get
- One command to start (`npm run start`)
- Same‑origin API (no CORS issues)
- Email/password auth (JWT access + httpOnly refresh cookie)
- Per-user Kanban data

## Local Dev
```bash
npm install
npm run dev
```

## Production (xlynx.site)
### 1) On the server
```bash
git clone <YOUR_REPO_URL> kanban
cd kanban
npm install
cp .env.example .env
sudo PORT=80 npm run start
```

### 2) DNS
Point `xlynx.site` to the server public IP.

### 3) HTTPS (recommended)
Use Nginx + Let’s Encrypt or your hosting panel.

## Notes
- Storage files are created automatically on first run:
  - `data.json` (projects/tasks)
  - `auth.json` (users/refresh tokens)
- These files are ignored by Git. Use `data.example.json` and `auth.example.json` as templates.

---
This README is optimized for a one‑command deploy.
