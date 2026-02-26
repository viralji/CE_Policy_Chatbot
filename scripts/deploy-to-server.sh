#!/usr/bin/env bash
# Deploy CE Policy Chatbot on the server: log in, pull from git, run deploy, configure nginx.
# Run from your machine: ./scripts/deploy-to-server.sh
#
# SSH: -i /home/viral/.ssh/do_139.59.72.225 root@139.59.72.225
# On the server: clone or pull repo, then ./deploy.sh, then nginx setup. No new ports.

set -e
SSH_KEY="${SSH_KEY:-/home/viral/.ssh/do_139.59.72.225}"
SSH_HOST="${SSH_HOST:-root@139.59.72.225}"
APP_DIR="${REMOTE_APP_DIR:-/opt/ce-policy-chatbot}"
GIT_REPO_URL="${GIT_REPO_URL:-https://github.com/viralji/CE_Policy_Chatbot.git}"

echo "=== Deploy CE Policy Chatbot to $SSH_HOST ==="
echo "  App dir on server: $APP_DIR"
echo "  Git: $GIT_REPO_URL"
echo ""

# Single SSH session: on server, clone/pull from git then deploy and nginx
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "$SSH_HOST" "bash -s" "$APP_DIR" "$GIT_REPO_URL" << 'REMOTE_SCRIPT'
set -e
APP_DIR="$1"
GIT_REPO_URL="$2"
SITE="chatbot.cloudextel.com"

echo " [1/4] Clone or pull from git..."
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git fetch origin && git reset --hard origin/main && cd - >/dev/null
else
  git clone "$GIT_REPO_URL" "$APP_DIR" && cd "$APP_DIR" && git checkout main && cd - >/dev/null
fi

echo " [2/4] Nginx: install config and reload..."
NGINX_CONF="$APP_DIR/scripts/nginx-$SITE.conf"
if [ -f "$NGINX_CONF" ]; then
  cp "$NGINX_CONF" /etc/nginx/sites-available/$SITE.conf 2>/dev/null || cp "$NGINX_CONF" /etc/nginx/conf.d/$SITE.conf 2>/dev/null || true
  [ -d /etc/nginx/sites-enabled ] && ln -sf /etc/nginx/sites-available/$SITE.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || echo "  (nginx reload skipped)"
else
  echo "  (no $NGINX_CONF - skip nginx)"
fi

echo " [3/4] Run deploy.sh..."
cd "$APP_DIR" && chmod +x deploy.sh restart.sh && ./deploy.sh

echo " [4/4] Done on server."
echo "  App: http://127.0.0.1:5174 (nginx: $SITE)"
echo "  Set PRODUCTION in backend/.env and frontend/.env; then: ./restart.sh"
REMOTE_SCRIPT

echo ""
echo "=== Deploy complete. Check https://chatbot.cloudextel.com (after DNS + SSL) ==="
