#!/usr/bin/env bash

set -euo pipefail

echo "================================================"
echo "  Campus Lab Stack Health Check"
echo "================================================"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="$3"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "ngrok-skip-browser-warning: true" \
    --max-time 5 "$url")

  if [ "$response" = "$expected" ]; then
    echo "  PASS  $name ($response)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name (expected $expected, got $response)"
    FAIL=$((FAIL + 1))
  fi
}

NGROK_URL=${NGROK_URL:-}

check "Backend health" "http://localhost:4000/api/v1/health" "200"
if [ -n "$NGROK_URL" ]; then
  check "Backend via ngrok" "$NGROK_URL/api/v1/health" "200"
  check "ngrok config URL" "$NGROK_URL/api/config" "200"
fi
check "AI server health" "http://localhost:8001/api/ai/health" "200"
check "Admin panel" "http://localhost:5173" "200"
check "PWA dev server" "http://localhost:5174" "200"

echo ""
echo "  Results: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
  echo "  Fix all failures before running integration tests."
  exit 1
fi

echo "  All services are running. Proceed with tests."