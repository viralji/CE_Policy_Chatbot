# Deploy and restart

See **[README.md](README.md)** for overview. Run from the **project root** (where `deploy.sh` and `restart.sh` live).

## Fresh deploy (on server or local)

```bash
./deploy.sh
```

- Pulls latest code (`git pull`)
- Backend: creates/uses `venv`, installs `requirements.txt`
- Frontend: `npm ci` / `npm install`, then `npm run build`
- Restarts backend and frontend (see below)

## Restart only (no pull, no rebuild)

```bash
./restart.sh
```

- Stops whatever is running on **backend port** (default 4001) and **frontend port** (default 5174)
- Starts backend: `python3 app.py` from `backend/` with `venv`
- Starts frontend: if `frontend/.next` exists (after build), runs `npm run start` (Next.js production); otherwise `npm run dev`

To avoid port conflict with other apps on the same server, set before running:

```bash
export CE_CHATBOT_BACKEND_PORT=4002 CE_CHATBOT_FRONTEND_PORT=5175
./restart.sh
```

Then use the same frontend port in nginx `proxy_pass` (see below).

## Logs and PIDs

- **Logs:** `logs/backend.log`, `logs/frontend.log` (created on first run)
- **PIDs:** `.backend.pid`, `.frontend.pid` (in `.gitignore`)

---

## Deploy to server (139.59.72.225) and nginx

Other apps may run on the server; this app uses **no new ports**—nginx proxies `chatbot.cloudextel.com` over existing 80/443 to the app on localhost.

### One-command deploy from your machine

From the **project root**:

```bash
chmod +x scripts/deploy-to-server.sh
./scripts/deploy-to-server.sh
```

Uses SSH key `-i /home/viral/.ssh/do_139.59.72.225` and `root@139.59.72.225` by default. Override if needed:

```bash
SSH_KEY=/path/to/key SSH_HOST=user@host REMOTE_APP_DIR=/opt/ce-policy-chatbot ./scripts/deploy-to-server.sh
```

The script will:

1. Clone or pull the repo on the server into `$REMOTE_APP_DIR` (default `/opt/ce-policy-chatbot`)
2. Copy `scripts/nginx-chatbot.cloudextel.com.conf` to the server and install it under nginx `sites-available` / `sites-enabled`
3. Run `nginx -t` and `systemctl reload nginx`
4. Run `./deploy.sh` on the server (deps, build, restart)

### Nginx config (chatbot.cloudextel.com)

The file **`scripts/nginx-chatbot.cloudextel.com.conf`** contains a single server block:

- **server_name** `chatbot.cloudextel.com`
- **proxy_pass** `http://127.0.0.1:5174` (Next.js). Next.js proxies `/api/chat` and `/api/files` to the Flask backend internally.

If you use different ports (e.g. `CE_CHATBOT_FRONTEND_PORT=5175`), edit the server’s nginx config and set `proxy_pass http://127.0.0.1:5175;`, then reload nginx.

After the first deploy, enable HTTPS:

```bash
# On the server
certbot --nginx -d chatbot.cloudextel.com
```

Certbot will add HTTPS and redirect HTTP to HTTPS.

### Post-deploy on the server

1. **Env:** In `backend/.env` and `frontend/.env`, uncomment the **PRODUCTION** section and set real values (see `.env.example`). Ensure `INTERNAL_PROXY_SECRET` is the same in both.
2. **DNS:** Point `chatbot.cloudextel.com` to the server IP (e.g. 139.59.72.225).
3. **Restart** after editing `.env`: `cd /opt/ce-policy-chatbot && ./restart.sh`

---

## Production (chatbot.cloudextel.com) summary

1. Set production env in `backend/.env` and `frontend/.env` (PRODUCTION section).
2. Run `./deploy.sh` on the server (or use `./scripts/deploy-to-server.sh` from your machine).
3. Nginx: `chatbot.cloudextel.com` → `http://127.0.0.1:5174` (no new ports). Run `certbot --nginx -d chatbot.cloudextel.com` for HTTPS.
