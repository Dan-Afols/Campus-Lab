# Testing Guide

## Prerequisites

- Backend: `npm run start:local`
- PWA: `npm run dev:web`
- Admin: `npm run start:local`

## Commands

- `npm run test:api` - API integration smoke tests
- `npm run test:e2e:pwa` - PWA route smoke tests
- `npm run test:e2e:admin` - Admin route smoke tests
- `npm run test:ngrok` - ngrok tunnel checks when `NGROK_URL` is set
- `npm run test:realtime` - SSE and websocket connectivity checks
- `npm run test:all` - Runs the full suite in sequence

## Environment Variables

- `API_URL` - Overrides the backend base URL for tests
- `PWA_URL` - Overrides the PWA URL for Playwright
- `ADMIN_URL` - Overrides the admin URL for Playwright
- `NGROK_URL` - Public tunnel URL for tunnel tests
- `TEST_ACCESS_TOKEN` - Optional bearer token for authenticated API smoke tests
- `WS_URL` - Optional websocket endpoint for realtime checks

## Notes

- The backend public health endpoint is `GET /api/v1/health`.
- The ngrok config endpoint is `GET /api/config`.
- The SSE config stream is `GET /api/config/stream`.