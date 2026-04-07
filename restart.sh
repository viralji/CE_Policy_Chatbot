#!/usr/bin/env bash
# Restart backend and frontend. Run from project root.
# Usage: ./restart.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT=${CE_CHATBOT_BACKEND_PORT:-4001}
FRONTEND_PORT=${CE_CHATBOT_FRONTEND_PORT:-5174}

echo "Stopping existing processes..."

# Kill by port (works for any process on that port)
for port in $BACKEND_PORT $FRONTEND_PORT; do
  if command -v lsof &>/dev/null; then
    pid=$(lsof -ti ":$port" 2>/dev/null) || true
    if [ -n "$pid" ]; then
      kill $pid 2>/dev/null || true
      sleep 1
      kill -9 $pid 2>/dev/null || true
    fi
  elif command -v fuser &>/dev/null; then
    fuser -k "$port/tcp" 2>/dev/null || true
  fi
done

# Fallback: kill by process name
pkill -f "gunicorn.*app:app" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

mkdir -p "$SCRIPT_DIR/logs"

echo " Starting backend (port $BACKEND_PORT)..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
  echo "Error: backend/venv not found. Run deploy.sh first."
  exit 1
fi
# Use gunicorn sync worker — gthread workers deadlock when forked after preloading.
# Timeout 120s matches the LLM call limit; --access-logfile logs every request.
nohup "$SCRIPT_DIR/backend/venv/bin/gunicorn" \
  --workers 1 \
  --worker-class sync \
  --timeout 120 \
  --bind "0.0.0.0:$BACKEND_PORT" \
  --access-logfile "$SCRIPT_DIR/logs/backend-access.log" \
  app:app >> "$SCRIPT_DIR/logs/backend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/.backend.pid"
cd "$SCRIPT_DIR"

echo " Starting frontend (port $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/frontend"
# Production: use next start when .next exists (after npm run build); else dev server
if [ -d ".next" ]; then
  PORT=$FRONTEND_PORT nohup npm run start >> "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
else
  PORT=$FRONTEND_PORT nohup npm run dev >> "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
fi
echo $! > "$SCRIPT_DIR/.frontend.pid"
cd "$SCRIPT_DIR"

echo " Done. Backend: http://localhost:$BACKEND_PORT  Frontend: http://localhost:$FRONTEND_PORT"
echo " Logs: logs/backend.log  logs/frontend.log"
