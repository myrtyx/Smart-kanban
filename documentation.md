# Smart Kanban — Deployment Guide (Single Server)

This guide is optimized for a **single‑server deploy** that serves both frontend and API on the same domain. No `.env` is required.

## Architecture
- `server.js` serves:
  - API endpoints (`/login`, `/signup`, `/projects`, `/tasks`, etc.)
  - Built frontend from `/dist`
- Same origin → no CORS issues

## Database
- `db.json` stores `projects`, `tasks`, and `auth`.
- Before deploy, ensure:
```
"auth": {}
```

## Deploy Steps (xlynx.site)
### 1) Clone
```bash
git clone <YOUR_REPO_URL> kanban
cd kanban
```

### 2) Install
```bash
npm install
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
- **Unauthorized**: Check that `db.json` has empty `auth` before first run, then create account once.
- **Request failed**: Ensure domain points to server IP and port 80 is open.

---
This guide assumes a single public domain: `xlynx.site`.
