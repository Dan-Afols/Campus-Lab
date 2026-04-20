#!/usr/bin/env bash

set -euo pipefail

echo "Starting Campus Lab local stack..."

pushd services/ai-server >/dev/null
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
AI_PID=$!
popd >/dev/null

cleanup() {
  kill "$AI_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

npm run start:local:pwa:ngrok