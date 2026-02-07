# Smart Kanban (Single‑Server Deploy)

This version is designed to run from a **single server process** that serves both the API and the built frontend. No `.env` is required.

## What You Get
- One command to start
- Same‑origin API (no CORS issues)
- First‑time “Create Account” flow (single user)

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
sudo PORT=80 npm run start
```

### 2) DNS
Point `xlynx.site` to the server public IP.

### 3) HTTPS (recommended)
Use an Nginx + Let’s Encrypt setup or your hosting panel.

## Notes
- On first visit you’ll see **Create Account**. After creation, only login works.
- `db.json` is the only storage. Keep a backup.

---
This README is optimized for a one‑command deploy.
