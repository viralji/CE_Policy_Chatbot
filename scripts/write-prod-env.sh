#!/usr/bin/env bash
# Creates production .env files for server. Run locally; outputs to stdout for piping to server.
# Usage: ./scripts/write-prod-env.sh | ssh root@SERVER "bash -s"
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load backend .env for Azure AD credentials
if [ -f "$PROJECT_DIR/backend/.env" ]; then
  set -a
  source "$PROJECT_DIR/backend/.env"
  set +a
fi

INTERNAL_PROXY_SECRET="${INTERNAL_PROXY_SECRET:-$(openssl rand -hex 24)}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -hex 24)}"

# Frontend .env
cat << EOF
# Creating frontend .env
cat > /var/www/ce-policy-chatbot/frontend/.env << 'FRONTEND_ENV'
PORT=5174
NEXTAUTH_URL=https://chatbot.cloudextel.com
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
BACKEND_URL=http://127.0.0.1:4001
INTERNAL_PROXY_SECRET=${INTERNAL_PROXY_SECRET}
AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}
ALLOWED_DOMAIN=cloudextel.com
FRONTEND_ENV
EOF

# Backend .env (reuse GOOGLE_API_KEY, GEMINI_API_KEY if present)
GOOGLE_API_KEY="${GOOGLE_API_KEY:-your_google_api_key}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
cat << EOF

# Creating backend .env
cat > /var/www/ce-policy-chatbot/backend/.env << 'BACKEND_ENV'
FLASK_APP=app.py
PORT=4001
FLASK_ENV=production
BASE_URL=https://chatbot.cloudextel.com
INTERNAL_PROXY_SECRET=${INTERNAL_PROXY_SECRET}
AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}
ALLOWED_DOMAIN=cloudextel.com
GOOGLE_API_KEY=${GOOGLE_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
BACKEND_ENV
EOF
