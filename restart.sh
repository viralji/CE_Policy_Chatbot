#!/usr/bin/env bash
# Restart backend and frontend via PM2. Run from project root.
# Usage: ./restart.sh
#
# Binds only on localhost-facing ports (default 4001 backend, 5174 frontend).
# Nginx on 80/443 proxies to the frontend port — no new public ports are opened.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT=${CE_CHATBOT_BACKEND_PORT:-4001}
FRONTEND_PORT=${CE_CHATBOT_FRONTEND_PORT:-5174}
PM2_BACKEND="policy-chatbot-backend"
PM2_FRONTEND="policy-chatbot-frontend"

if ! command -v pm2 &>/dev/null; then
  echo "Error: pm2 not found. On the server, install PM2 (npm i -g pm2). Locally, use: cd frontend && npm run dev"
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
  echo "Error: backend/venv not found. Run deploy.sh first."
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/frontend/.next" ]; then
  echo "Error: frontend/.next not found. Run deploy.sh (npm run build) first."
  exit 1
fi

mkdir -p "$SCRIPT_DIR/logs"

clear_port_listeners() {
  local port=$1
  if command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
  if command -v lsof &>/dev/null; then
    for pid in $(lsof -ti ":$port" 2>/dev/null); do
      kill "$pid" 2>/dev/null || true
    done
    sleep 1
    for pid in $(lsof -ti ":$port" 2>/dev/null); do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

# First PM2 registration: stop legacy nohup listeners on our ports only
if ! pm2 describe "$PM2_BACKEND" &>/dev/null; then
  echo "First PM2 start — clearing orphan listeners on ports $BACKEND_PORT / $FRONTEND_PORT..."
  clear_port_listeners "$BACKEND_PORT"
  clear_port_listeners "$FRONTEND_PORT"
  sleep 2
fi

export CE_CHATBOT_BACKEND_PORT=$BACKEND_PORT
export CE_CHATBOT_FRONTEND_PORT=$FRONTEND_PORT

echo "Restarting via PM2..."
if pm2 describe "$PM2_BACKEND" &>/dev/null; then
  pm2 restart "$PM2_BACKEND" "$PM2_FRONTEND"
else
  pm2 start "$SCRIPT_DIR/ecosystem.config.js"
fi

pm2 save 2>/dev/null || true

echo "Waiting for frontend (http://127.0.0.1:${FRONTEND_PORT}/)..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${FRONTEND_PORT}/" -o /dev/null 2>/dev/null; then
    echo "Frontend healthy (took ~${i}s)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Frontend did not respond after 30s. Check: pm2 logs $PM2_FRONTEND --lines 30 --nostream"
    pm2 logs "$PM2_FRONTEND" --lines 20 --nostream 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "Done. Backend: http://127.0.0.1:$BACKEND_PORT  Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Logs: pm2 logs $PM2_BACKEND | pm2 logs $PM2_FRONTEND"
pm2 list | grep -E "policy-chatbot|name" || pm2 list
