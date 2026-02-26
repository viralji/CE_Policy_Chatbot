# Microsoft (Azure AD) Login – Org Only

See **[README.md](README.md)** for overview. Same pattern as **CE_DF_Photos**: only users from your organization can sign in.

## How it works

- **Frontend (Next.js):** NextAuth with Azure AD (Web). Users sign in at `/signin`; only users whose email domain matches `ALLOWED_DOMAIN` are accepted (signIn callback). Session is a cookie; browser talks only to Next.js. Next.js API routes proxy `/api/chat` and `/api/files` to the Flask backend with `X-Internal-Proxy-Secret` and `X-User-Email`.
- **Backend (Flask):** Accepts either proxy headers (when secret matches and request is from localhost) or Bearer ID token (legacy). Validates domain for Bearer path.

## Azure AD app registration

Use the **same** Azure AD app as CE_DF_Photos. Configure **Web** platform only (no SPA for this app).

1. Azure Portal → **App registrations** → your app (e.g. CE_DF_Photos).
2. **Authentication** → **Web** (add platform if needed).
3. Under **Redirect URIs**, add:
   - **Local:** `http://localhost:5174/api/auth/callback/azure-ad`
   - **Production:** `https://chatbot.cloudextel.com/api/auth/callback/azure-ad`

Do not use the SPA redirect URIs for this app; NextAuth uses the Web callback.

## Environment variables

### Backend (`backend/.env`)

- `AZURE_AD_TENANT_ID` – Azure AD tenant ID (same as CE_DF_Photos).
- `AZURE_AD_CLIENT_ID` – Application (client) ID (same as CE_DF_Photos).
- `ALLOWED_DOMAIN` – Allowed email domain (default: `cloudextel.com`).
- `INTERNAL_PROXY_SECRET` – Shared secret with Next.js; same value as in `frontend/.env`. Required when frontend proxies requests.
- `BASE_URL` – Used for “View source” PDF links in chat. Set to the public URL of the app (see Production below).

If **both** `AZURE_AD_TENANT_ID` and `AZURE_AD_CLIENT_ID` are missing, the backend skips auth (local dev only).

### Frontend (`frontend/.env`)

- `NEXTAUTH_URL` – Full URL of the app (e.g. `http://localhost:5174`, or `https://chatbot.cloudextel.com` in prod).
- `NEXTAUTH_SECRET` – Random string for signing session cookies.
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` – Azure AD Web app credentials.
- `ALLOWED_DOMAIN` – Same as backend (e.g. `cloudextel.com`).
- `BACKEND_URL` – Flask backend URL (e.g. `http://127.0.0.1:4001`).
- `INTERNAL_PROXY_SECRET` – Same value as in `backend/.env`.

## Production (chatbot.cloudextel.com)

**URL:** `https://chatbot.cloudextel.com`

- **Azure AD:** Add Web redirect URI `https://chatbot.cloudextel.com/api/auth/callback/azure-ad` (see above).
- **Frontend:** Set `NEXTAUTH_URL=https://chatbot.cloudextel.com` and `BACKEND_URL=http://127.0.0.1:4001` (or internal hostname) before `npm run build`.
- **Backend:** Set `BASE_URL=https://chatbot.cloudextel.com` so “View source” links in chat point to the correct host. Set `PORT` as needed (e.g. 4001 behind the proxy). Set `INTERNAL_PROXY_SECRET` to match frontend.

## Testing

1. Start backend and frontend locally (`npm run dev` in frontend).
2. Open `http://localhost:5174` → **Sign in with Azure AD**.
3. Sign in with a **@cloudextel.com** account → chat UI; only allowed domain is accepted.
