# Microsoft (Azure AD) Login – Org Only

See **[README.md](README.md)** for overview. Same pattern as **CE_DF_Photos**: only users from your organization can sign in.

## How it works

- **Frontend:** MSAL redirects users to Microsoft sign-in. Only users whose email domain matches `ALLOWED_DOMAIN` are accepted by the backend.
- **Backend:** Validates the Azure AD ID token (JWT), checks email domain, then allows access to `/api/chat` and `/api/auth/me`.

## Azure AD app registration

Use the **same** Azure AD app as CE_DF_Photos. Add the Policy Chatbot URLs:

1. Azure Portal → **App registrations** → your app (e.g. CE_DF_Photos).
2. **Authentication** → **Single-page application**.
3. Under **Redirect URIs**, add:
   - Local: `http://localhost:5174`
   - **Production: `https://chatbot.cloudextel.com`**

## Environment variables

### Backend (`backend/.env`)

- `AZURE_AD_TENANT_ID` – Azure AD tenant ID (same as CE_DF_Photos).
- `AZURE_AD_CLIENT_ID` – Application (client) ID (same as CE_DF_Photos).
- `ALLOWED_DOMAIN` – Allowed email domain (default: `cloudextel.com`).
- `BASE_URL` – Used for “View source” PDF links in chat. Set to the public URL of the app (see Production below).

If **both** `AZURE_AD_TENANT_ID` and `AZURE_AD_CLIENT_ID` are missing, the backend skips auth (local dev only).

### Frontend (`frontend/.env`)

- `REACT_APP_AZURE_TENANT_ID` (optional if using defaults in code)
- `REACT_APP_AZURE_CLIENT_ID` (optional)
- `REACT_APP_API_URL` – Backend API base URL (e.g. `http://localhost:4001` locally).

## Production (chatbot.cloudextel.com)

**URL:** `https://chatbot.cloudextel.com`

- **Azure AD:** Add redirect URI `https://chatbot.cloudextel.com` (see above).
- **Frontend build:** Set `REACT_APP_API_URL=https://chatbot.cloudextel.com` (or your backend URL if different) before `npm run build`. If the backend is served under the same domain (e.g. reverse proxy to `/api`), use `https://chatbot.cloudextel.com`.
- **Backend:** Set `BASE_URL=https://chatbot.cloudextel.com` so “View source” links in chat point to the correct host. Set `PORT` as needed (e.g. 4001 behind the proxy).

## Testing

1. Start backend and frontend locally.
2. Open `http://localhost:5174` → **Sign in with Microsoft**.
3. Sign in with a **@cloudextel.com** account → chat UI; only allowed domain is accepted.
