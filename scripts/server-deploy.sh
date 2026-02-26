#!/usr/bin/env bash
# Run this ON THE SERVER (e.g. after SSH) to clone or pull and deploy.
# Usage: bash server-deploy.sh [REPO_DIR]
# Example: bash server-deploy.sh /root/CE_Policy_Chatbot

set -e
REPO_URL="git@github.com:viralji/CE_Policy_Chatbot.git"
TARGET="${1:-/root/CE_Policy_Chatbot}"

if [ ! -d "$TARGET" ]; then
  echo "Cloning repo to $TARGET..."
  git clone "$REPO_URL" "$TARGET"
  cd "$TARGET"
else
  echo "Using existing repo at $TARGET"
  cd "$TARGET"
  git fetch origin
  git pull origin main || git pull origin master || true
fi

# Create .env from examples if missing (you must add secrets manually)
for dir in backend frontend; do
  if [ -d "$dir" ] && [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "Created $dir/.env from .env.example - edit and add secrets (GOOGLE_API_KEY, Azure, etc.)."
  fi
done

chmod +x deploy.sh restart.sh 2>/dev/null || true
./deploy.sh
