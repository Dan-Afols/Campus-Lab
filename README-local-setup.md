# Campus Lab Local Setup

This repository already supports a Windows-first local stack through `scripts/start-local-stack.ps1`, plus a PWA ngrok mode for device testing.

## Start the stack

```powershell
npm run start:local
```

To include the PWA and ngrok tunnel:

```powershell
npm run start:local:web:ngrok
```

## PWA connection flow

The backend now exposes:

- `GET /api/v1/health` for public health checks
- `GET /api/config` for the current ngrok URL
- `POST /internal/update-ngrok-url` for the local launcher

The PWA reads the API URL dynamically, so you do not need to rebuild it when the ngrok URL changes.

## Verify the stack

```bash
NGROK_URL=https://your-url.ngrok-free.app bash scripts/check-stack.sh
```

## Cloudflare Tunnel alternative

For a stable URL, prefer Cloudflare Tunnel instead of ngrok free URLs. A simple pattern is:

```yaml
tunnel: campus-lab
ingress:
  - hostname: campus-lab-api.example.com
    service: http://localhost:4000
  - service: http_status:404
```

If you use a fixed tunnel hostname, set the PWA API base URL once and keep it unchanged.