#!/usr/bin/env bash
# Fresh deploy on server: pull, install deps, build frontend, then restart.
# Run from project root. Usage: ./deploy.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Deploy CE Policy Chatbot ==="

# 1. Git pull latest
echo ""
echo " [1/4] Git pull..."
git pull origin main || git pull origin master || git pull

# 2. Backend: venv + deps
echo ""
echo " [2/4] Backend dependencies..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
  echo "      Creating venv..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
cd "$SCRIPT_DIR"

# 3. Frontend: install + build
echo ""
echo " [3/4] Frontend install and build..."
cd "$SCRIPT_DIR/frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build
cd "$SCRIPT_DIR"

# 4. Restart everything
echo ""
echo " [4/4] Restarting services..."
mkdir -p logs
chmod +x "$SCRIPT_DIR/restart.sh"
"$SCRIPT_DIR/restart.sh"

echo ""
echo "=== Deploy complete ==="
