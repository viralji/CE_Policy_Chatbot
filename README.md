# CE Policy Chatbot

CloudExtel policy Q&A assistant: RAG over company PDFs (handbook, policies) with Microsoft (Azure AD) org-only login.

- **Frontend:** React + MSAL (sign-in with Microsoft; only `@cloudextel.com` allowed).
- **Backend:** Flask + LangChain + Google Gemini (embeddings + chat) + FAISS over PDFs in `backend/data/`.
- **Production URL:** [https://chatbot.cloudextel.com](https://chatbot.cloudextel.com)

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
   cp .env.example .env   # optional: set REACT_APP_* and PORT
   npm start
   ```
3. Open **http://localhost:5174** → Sign in with Microsoft (org account) → chat.

---

## Environment

- **Backend:** `backend/.env` — see `backend/.env.example` for variables. Required: `GOOGLE_API_KEY`. For auth: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `ALLOWED_DOMAIN`. Optional: `PORT`, `BASE_URL`.
- **Frontend:** `frontend/.env` — see `frontend/.env.example`. `REACT_APP_API_URL` (backend URL), `REACT_APP_AZURE_*` (if not using defaults), `PORT` (dev server port).

Never commit real `.env` files (they are in `.gitignore`). Use `.env.example` as a template.

---

## Auth (Microsoft, org-only)

Only users whose email domain matches `ALLOWED_DOMAIN` (e.g. `cloudextel.com`) can use the app. Same Azure AD app as CE_DF_Photos.

- **Redirect URIs in Azure:** `http://localhost:5174` (local), `https://chatbot.cloudextel.com` (prod).
- Full details: **[AUTH.md](AUTH.md)**.

---

## Deploy and restart (server)

From the **project root**:

| Command        | Purpose |
|----------------|--------|
| `./deploy.sh`  | Fresh deploy: `git pull`, backend deps, frontend build, then restart. |
| `./restart.sh` | Restart backend (4001) and frontend (5174) only. |

- Logs: `logs/backend.log`, `logs/frontend.log`.
- Full details: **[DEPLOY.md](DEPLOY.md)**.

---

## Production (chatbot.cloudextel.com)

1. In **backend/.env**: set `BASE_URL=https://chatbot.cloudextel.com` (for “View source” links).
2. In **frontend/.env** (or build-time env): set `REACT_APP_API_URL=https://chatbot.cloudextel.com` before `npm run build`.
3. In **Azure AD**: add redirect URI `https://chatbot.cloudextel.com`.
4. On the server, run `./deploy.sh` and point your reverse proxy at backend (e.g. `/api` → `http://127.0.0.1:4001`) and at the frontend (build or `http://127.0.0.1:5174`).

---

## Repo layout

```
CE_Policy_Chatbot/
├── README.md          # this file
├── AUTH.md            # Microsoft auth setup
├── DEPLOY.md          # deploy/restart details
├── deploy.sh          # full deploy script
├── restart.sh         # restart backend + frontend
├── backend/
│   ├── app.py         # Flask API + RAG
│   ├── auth_middleware.py
│   ├── requirements.txt
│   ├── .env.example
│   └── data/          # PDFs (handbook, etc.)
└── frontend/
    ├── src/
    │   ├── App.js     # main chat UI + auth gate
    │   ├── LoginPage.js
    │   ├── authConfig.js
    │   └── index.tsx
    ├── .env.example
    └── package.json
```
