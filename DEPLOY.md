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

## Deploy to server (same process as CE_DF_Photos)

Other apps may run on the server; this app uses **no new ports**—nginx proxies `chatbot.cloudextel.com` over existing 80/443 to the app on localhost.

### From your local machine

1. Commit and push your code.
2. Run:

```bash
SERVER=root@139.59.72.225 ./scripts/deploy-from-local.sh
```

With SSH key:

```bash
SSH_KEY=/home/viral/.ssh/do_139.59.72.225 SERVER=root@139.59.72.225 ./scripts/deploy-from-local.sh
```

With custom app path:

```bash
SERVER=root@139.59.72.225 APP_PATH=/var/www/ce-policy-chatbot ./scripts/deploy-from-local.sh
```

This will: `git push`, then SSH to the server and run `./scripts/deploy-and-verify-on-server.sh`.

### On the server (after SSH)

If you SSH manually, run:

```bash
ssh -i /home/viral/.ssh/do_139.59.72.225 -o IdentitiesOnly=yes root@139.59.72.225
```

Then on the server:

```bash
cd /var/www/ce-policy-chatbot && ./scripts/deploy-and-verify-on-server.sh
```

First time: clone the repo first:

```bash
cd /var/www && git clone https://github.com/viralji/CE_Policy_Chatbot.git ce-policy-chatbot
cd /var/www/ce-policy-chatbot && ./scripts/deploy-and-verify-on-server.sh
```

`deploy-and-verify-on-server.sh` does: git pull, nginx config, `./deploy.sh`, health check.

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
3. **Restart** after editing `.env`: `cd /var/www/ce-policy-chatbot && ./restart.sh`

---

## Production (chatbot.cloudextel.com) summary

1. Set production env in `backend/.env` and `frontend/.env` (PRODUCTION section).
2. Run `./deploy.sh` on the server (or use `./scripts/deploy-from-local.sh` from your machine).
3. Nginx: `chatbot.cloudextel.com` → `http://127.0.0.1:5174` (no new ports). Run `certbot --nginx -d chatbot.cloudextel.com` for HTTPS.
