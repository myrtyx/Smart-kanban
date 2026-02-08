# Smart Kanban — Deployment Guide (Single Server)

This guide is optimized for a **single‑server deploy** that serves both frontend and API on the same domain. Authentication is enabled.

## Architecture
- `server.js` serves:
  - API endpoints (`/projects`, `/tasks`, etc.)
  - Built frontend from `/dist`
- Same origin → no CORS issues

## Database
- `data.json` stores `projects` and `tasks`.
- `auth.json` stores users and refresh tokens.
- Both files are created automatically on first run and are ignored by Git.

## Deploy Steps (xlynx.site)
### 1) Clone
```bash
git clone <YOUR_REPO_URL> kanban
cd kanban
```

### 2) Install
```bash
npm install
cp .env.example .env
```

### 3) Start (single command)
```bash
sudo PORT=80 npm run start
```

### 4) DNS
Point `xlynx.site` to your server IP.

### 5) HTTPS (recommended)
Use Nginx + Certbot, or your hosting provider’s SSL.

## Troubleshooting
- **Blank page / 404**: Make sure `dist/` exists (run `npm run start` which builds it).
- **Request failed**: Ensure domain points to server IP and port 80 is open.
- **Login fails**: Ensure `JWT_SECRET` is set in `.env`.

---
This guide assumes a single public domain: `xlynx.site`.
