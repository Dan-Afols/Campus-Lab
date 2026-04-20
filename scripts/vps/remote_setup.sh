#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/campus-lab"
WEB_ROOT="/var/www/campuslab"

sudo systemctl stop campuslab-api.service campuslab-ai.service nginx >/dev/null 2>&1 || true
sudo pkill -f "tsx watch src/server.ts" >/dev/null 2>&1 || true

sudo rm -rf "$APP_ROOT" "$WEB_ROOT"
sudo mkdir -p "$APP_ROOT" "$WEB_ROOT/pwa" "$WEB_ROOT/admin"
sudo chown -R "$USER":"$USER" "$APP_ROOT" "$WEB_ROOT"

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y curl git nginx postgresql postgresql-contrib redis-server python3 python3-venv python3-pip build-essential ca-certificates gnupg

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo systemctl enable --now postgresql redis-server nginx
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'danafols';"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='campuslab';" | grep -q 1; then
  sudo -u postgres createdb campuslab
fi

echo "REMOTE_BASE_READY"
