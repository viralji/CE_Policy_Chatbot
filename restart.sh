#!/usr/bin/env bash
# Restart backend and frontend. Run from project root.
# Usage: ./restart.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT=4001
FRONTEND_PORT=5174

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
source venv/bin/activate
nohup python3 app.py >> "$SCRIPT_DIR/logs/backend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/.backend.pid"
cd "$SCRIPT_DIR"

echo " Starting frontend (port $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/frontend"
# Use Next.js dev server for local/restart (no build required)
PORT=$FRONTEND_PORT nohup npm run dev >> "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/.frontend.pid"
cd "$SCRIPT_DIR"

echo " Done. Backend: http://localhost:$BACKEND_PORT  Frontend: http://localhost:$FRONTEND_PORT"
echo " Logs: logs/backend.log  logs/frontend.log"
