# Smart Kanban (Single‑Server Deploy)

Modern Kanban board built with React (Vite), Tailwind CSS, and a lightweight Node.js API backed by a JSON file.

## What You Get
- One command to start (`npm run start`)
- Same‑origin API (no CORS issues)
- No authentication (open internal tool)

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
Use Nginx + Let’s Encrypt or your hosting panel.

## Notes
- `db.json` is the only storage. Keep a backup.

---
This README is optimized for a one‑command deploy.
