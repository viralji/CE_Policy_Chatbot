# Deploy and restart (server)

See **[README.md](README.md)** for overview. Run from the **project root** (where `deploy.sh` and `restart.sh` live).

## Fresh deploy (e.g. first time or after git pull)

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

- Stops whatever is running on ports **4001** (backend) and **5174** (frontend)
- Starts backend: `python app.py` from `backend/` with `venv`
- Starts frontend: if `frontend/build` exists, runs `serve -s build -l 5174`; otherwise `npm start`

## Logs and PIDs

- **Logs:** `logs/backend.log`, `logs/frontend.log` (created on first run)
- **PIDs:** `.backend.pid`, `.frontend.pid` (used by the scripts; in `.gitignore`)

## Production (chatbot.cloudextel.com)

1. Set production env (see `AUTH.md` and `.env` comments).
2. Run `./deploy.sh` (e.g. from cron or after a git push).
3. Point nginx (or your reverse proxy) at the app: proxy `/api` to `http://127.0.0.1:4001` and serve the frontend build or proxy to `http://127.0.0.1:5174`.
