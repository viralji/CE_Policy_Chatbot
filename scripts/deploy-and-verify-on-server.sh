#!/usr/bin/env bash
# Run this ON the server (e.g. after SSH). Deploys code, nginx, restarts app, health check.
# Usage: cd /var/www/ce-policy-chatbot && ./scripts/deploy-and-verify-on-server.sh
# Or:    cd /path/to/CE_Policy_Chatbot && APP_PORT=5174 ./scripts/deploy-and-verify-on-server.sh
# See README.md and DEPLOY.md for full docs.
set -e
APP_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"
APP_PORT="${APP_PORT:-5174}"
SITE="chatbot.cloudextel.com"

echo "=== Deploy in $APP_DIR (health check port: $APP_PORT) ==="
[ -f deploy.sh ] || { echo "Missing deploy.sh"; exit 1; }
[ -d .git ] || { echo "Not a git repo"; exit 1; }

git pull origin main || git pull origin master || git pull

echo "=== Nginx: install config and reload ==="
NGINX_CONF="$APP_DIR/scripts/nginx-$SITE.conf"
if [ -f "$NGINX_CONF" ]; then
  cp "$NGINX_CONF" /etc/nginx/sites-available/$SITE.conf 2>/dev/null || cp "$NGINX_CONF" /etc/nginx/conf.d/$SITE.conf 2>/dev/null || true
  [ -d /etc/nginx/sites-enabled ] && ln -sf /etc/nginx/sites-available/$SITE.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || echo "○ nginx reload skipped"
else
  echo "○ No $NGINX_CONF"
fi

echo "=== Run deploy.sh (backend, frontend, restart) ==="
chmod +x "$APP_DIR/deploy.sh" "$APP_DIR/restart.sh"
"$APP_DIR/deploy.sh"

echo "=== Wait for app ==="
sleep 5

echo "=== Health check (localhost:$APP_PORT) ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)
if [ "$CODE" = "200" ] || [ "$CODE" = "307" ]; then
  echo "✓ GET / → $CODE"
else
  echo "✗ GET / → $CODE (check: logs/backend.log logs/frontend.log)"
  exit 1
fi

echo "=== Done. Check: pm2 status (if used) or logs/ ==="
