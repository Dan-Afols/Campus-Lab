#!/usr/bin/env bash
set -euo pipefail

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
EnvironmentFile=/opt/campus-lab/services/api/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl unmask campuslab-api.service || true
sudo systemctl daemon-reload
sudo systemctl enable campuslab-api.service
sudo systemctl restart campuslab-api.service
sudo systemctl restart campuslab-ai.service
sudo systemctl restart nginx
sleep 2
sudo systemctl --no-pager --full status campuslab-api.service | head -n 30
sudo systemctl --no-pager --full status campuslab-ai.service | head -n 20

echo "API_STATUS_OK"
