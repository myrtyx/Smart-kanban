# DEPLOY — xlynx.site (Single‑Server)

These steps deploy Smart Kanban on **one server** and run it with a single command.

## 1) Server requirements
- Node.js 20.19+ (or 22.12+)
- Git
- Port 80 open

## 2) One‑time setup
```bash
git clone <YOUR_REPO_URL> kanban
cd kanban
npm install
cp .env.example .env
```

## 3) Start (single command)
```bash
sudo PORT=80 npm run start
```

## 4) DNS
Point `xlynx.site` to the server public IP.

## 5) HTTPS (recommended)
If you need HTTPS, use Nginx + Certbot (or your hosting panel).

## Troubleshooting
- **Blank page / 404** → run `npm run start` to build and serve `dist/`.
- **Request failed** → check DNS and port 80 firewall.
- **Login fails** → ensure `JWT_SECRET` is set in `.env`.

---
If you want systemd or Nginx configs, ask and I will generate them.
