#!/usr/bin/env bash
# Run from your LOCAL machine. Pushes code then SSHs to server and runs deploy script.
# Usage:
#   SERVER=root@139.59.72.225 ./scripts/deploy-from-local.sh
#   Or with SSH key:  SSH_KEY=/home/viral/.ssh/do_139.59.72.225 SERVER=root@139.59.72.225 ./scripts/deploy-from-local.sh
#   Or with app path: SERVER=root@139.59.72.225 APP_PATH=/opt/ce-policy-chatbot ./scripts/deploy-from-local.sh
# Prerequisites: code committed and pushed (so server can git pull). SSH access to SERVER.
set -e
SERVER="${SERVER:?Set SERVER=e.g. root@139.59.72.225}"
APP_PATH="${APP_PATH:-/opt/ce-policy-chatbot}"
APP_PORT="${APP_PORT:-5174}"
SSH_OPTS=()
[ -n "${SSH_KEY:-}" ] && SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes)

echo "=== Pushing from local (ensure server can pull) ==="
git push

echo "=== Deploying on server $SERVER (path: $APP_PATH, health check port: $APP_PORT) ==="
ssh "${SSH_OPTS[@]}" "$SERVER" "cd $APP_PATH && APP_PORT=$APP_PORT ./scripts/deploy-and-verify-on-server.sh"

echo "=== Deploy finished. Check https://policy-assistant.cloudextel.com ==="
