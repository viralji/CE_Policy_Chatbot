# CE Policy Chatbot

CloudExtel policy Q&A assistant: RAG over company PDFs (handbook, policies) with Microsoft (Azure AD) org-only login.

- **Frontend:** Next.js + NextAuth (Azure AD Web; sign-in with Microsoft; only `@cloudextel.com` allowed).
- **Backend:** Flask + LangChain + Google Gemini (embeddings + chat) + FAISS over **PDFs and DOCX** in `backend/data/`. Chat memory is **per user** (no cross-user bleed). FAISS index rebuilds when source files change.
- **Production URL:** [https://policy-assistant.cloudextel.com](https://policy-assistant.cloudextel.com)

---

## Quick start (local)

**Ports:** Backend `4001`, Frontend `5174` (so they don’t clash with other apps).

1. **Backend**
   ```bash
   cd backend
   python3 -m venv venv && source venv/bin/activate   # or: venv\Scripts\activate on Windows
   pip install -r requirements.txt
   cp .env.example .env   # then add GOOGLE_API_KEY and optional Azure vars
   python app.py
   ```
2. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # set NEXTAUTH_*, AZURE_*, BACKEND_URL; INTERNAL_PROXY_SECRET optional for local dev
   npm run dev
   ```
3. Open **http://localhost:5174** → Sign in with Microsoft (org account) → chat.  
   **Local only:** On the sign-in page, "Bypass Authentication (Dev)" skips Azure and uses a dev cookie; leave `INTERNAL_PROXY_SECRET` empty in both `.env` files and chat will still work.

---

## Environment

- **Backend:** `backend/.env` — see `backend/.env.example`. Required: `GOOGLE_API_KEY`. For auth: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `ALLOWED_DOMAIN`; `INTERNAL_PROXY_SECRET` (same as frontend) required for production, optional for local dev. Optional: `PORT`, `BASE_URL`.
- **Frontend:** `frontend/.env` — see `frontend/.env.example`. Next.js: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AZURE_AD_*`, `ALLOWED_DOMAIN`, `BACKEND_URL`, `INTERNAL_PROXY_SECRET` (optional for local dev), `PORT`.

Never commit real `.env` files (they are in `.gitignore`). Use `.env.example` as a template.

---

## Auth (Microsoft, org-only)

Only users whose email domain matches `ALLOWED_DOMAIN` (e.g. `cloudextel.com`) can use the app. Same Azure AD app as CE_DF_Photos (Web platform only).

- **Redirect URIs in Azure:** `http://localhost:5174/api/auth/callback/azure-ad`, `https://policy-assistant.cloudextel.com/api/auth/callback/azure-ad`.
- Full details: **[AUTH.md](AUTH.md)**.

---

## Deploy and restart (server)

From the **project root**:

| Command | Purpose |
|---------|---------|
| `./deploy.sh` | Fresh deploy: `git pull`, backend deps, frontend build, then restart. |
| `./restart.sh` | Restart backend (4001) and frontend (5174) only. |
| `./scripts/deploy-from-local.sh` | From local: `git push`, then SSH to server and run `deploy-and-verify-on-server.sh`. Set `SERVER=root@host`. |
| `./scripts/deploy-and-verify-on-server.sh` | On server: git pull, nginx, deploy.sh, health check. |

- Logs: `logs/backend.log`, `logs/frontend.log`.
- Full details: **[DEPLOY.md](DEPLOY.md)**.

---

## Production (policy-assistant.cloudextel.com)

1. In **backend/.env**: set `BASE_URL=https://policy-assistant.cloudextel.com` (for “View source” links).
2. In **frontend/.env**: set `NEXTAUTH_URL=https://policy-assistant.cloudextel.com`, `BACKEND_URL=http://127.0.0.1:4001` (or internal hostname) before `npm run build`.
3. In **Azure AD**: add Web redirect URI `https://policy-assistant.cloudextel.com/api/auth/callback/azure-ad`.
4. On the server, run `./deploy.sh` then `./restart.sh`; point your reverse proxy at the Next.js app (e.g. `http://127.0.0.1:5174`). Next.js proxies `/api/chat` and `/api/files` to the Flask backend.

---

## Repo layout

```
CE_Policy_Chatbot/
├── README.md          # this file
├── AUTH.md            # Microsoft auth setup
├── DEPLOY.md          # deploy/restart details
├── deploy.sh          # full deploy script
├── restart.sh         # restart backend + frontend
├── scripts/           # deploy-from-local.sh, deploy-and-verify-on-server.sh, nginx config
├── backend/
│   ├── app.py         # Flask API + RAG
│   ├── auth_middleware.py
│   ├── requirements.txt
│   ├── .env.example
│   └── data/          # PDFs and DOCX (handbook, policies)
└── frontend/
    ├── app/           # Next.js App Router (layout, page, signin, chat, api)
    ├── lib/
    │   └── auth.ts    # NextAuth (Azure AD) config
    ├── .env.example
    ├── next.config.mjs
    └── package.json
```
