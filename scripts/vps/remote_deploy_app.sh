#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/campus-lab"
WEB_ROOT="/var/www/campuslab"
API_ROOT="$APP_ROOT/services/api"
AI_ROOT="$APP_ROOT/services/ai-server"
IP_ADDR="150.136.107.196"

cd "$APP_ROOT"

npm install

if [ -f "$API_ROOT/.env" ]; then
  sed -i "s|^APP_ORIGIN=.*|APP_ORIGIN=http://$IP_ADDR|" "$API_ROOT/.env"
  sed -i "s|^AI_SERVER_BASE_URL=.*|AI_SERVER_BASE_URL=http://127.0.0.1:8001/api|" "$API_ROOT/.env"
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:danafols@localhost:5432/campuslab|" "$API_ROOT/.env"
  sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://localhost:6379|" "$API_ROOT/.env"
fi

cat > "$APP_ROOT/apps/web/.env.production" <<EOF
VITE_API_BASE_URL=/api/v1
EOF

cat > "$APP_ROOT/apps/admin/.env.production" <<EOF
VITE_API_BASE_URL=/api/v1
EOF

npm --workspace services/api run prisma:generate
npm --workspace services/api run prisma:push
npm --workspace services/api run build
npm --workspace apps/web run build
npm --workspace apps/admin run build -- --base=/admin/

sudo mkdir -p "$WEB_ROOT/pwa" "$WEB_ROOT/admin"
sudo rm -rf "$WEB_ROOT/pwa"/* "$WEB_ROOT/admin"/*
sudo cp -r "$APP_ROOT/apps/web/dist"/* "$WEB_ROOT/pwa/"
sudo cp -r "$APP_ROOT/apps/admin/dist"/* "$WEB_ROOT/admin/"

python3 -m venv "$AI_ROOT/.venv"
"$AI_ROOT/.venv/bin/pip" install --upgrade pip
"$AI_ROOT/.venv/bin/pip" install -r "$AI_ROOT/requirements.txt"

sudo tee /etc/systemd/system/campuslab-api.service >/dev/null <<'EOF'
[Unit]
Description=Campus Lab API Service
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
WorkingDirectory=/opt/campus-lab/services/api
ExecStart=/usr/bin/node /opt/campus-lab/services/api/dist/src/server.js
Restart=always
RestartSec=5
User=ubuntu
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/campuslab-ai.service >/dev/null <<'EOF'
[Unit]
Description=Campus Lab AI Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/campus-lab/services/ai-server
ExecStart=/opt/campus-lab/services/ai-server/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5
User=ubuntu
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/nginx/sites-available/campuslab >/dev/null <<'EOF'
server {
  listen 80;
  listen [::]:80;
  server_name campuslabs.duckdns.org;

  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  return 301 https://$host$request_uri;
}

server {
  listen 80;
  listen [::]:80;
  server_name _;

  root /var/www/campuslab/pwa;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /admin/ {
    alias /var/www/campuslab/admin/;
    try_files $uri $uri/ /admin/index.html;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name campuslabs.duckdns.org;

  ssl_certificate /etc/letsencrypt/live/campuslabs.duckdns.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/campuslabs.duckdns.org/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  root /var/www/campuslab/pwa;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /admin/ {
    alias /var/www/campuslab/admin/;
    try_files $uri $uri/ /admin/index.html;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/campuslab /etc/nginx/sites-enabled/campuslab

sudo systemctl daemon-reload
sudo systemctl enable --now campuslab-api.service campuslab-ai.service nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl restart campuslab-api.service campuslab-ai.service

sleep 3
sudo systemctl --no-pager --full status campuslab-api.service | head -n 20
sudo systemctl --no-pager --full status campuslab-ai.service | head -n 20
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/admin/
curl -I http://127.0.0.1/api/v1/auth/catalog

echo "DEPLOY_DONE"
