# Campus Lab PWA

Campus Lab PWA is a React + TypeScript + Vite progressive web app that mirrors the student mobile product with installability, offline support, and real-time campus workflows.

## Stack

- React 18 + TypeScript + Vite
- React Router v6
- Zustand for client state
- TanStack Query v5 for server state
- React Hook Form + Zod for form validation
- Tailwind CSS design tokens
- Framer Motion animations
- Vite PWA (Workbox runtime caching)

## Setup

```bash
npm install
npm --workspace apps/web run dev
```

## Environment Variables

Use [apps/web/.env](apps/web/.env) for local and [apps/web/.env.production](apps/web/.env.production) for production.

Required variables:

- `VITE_API_BASE_URL`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_APP_VERSION`
- `VITE_ENVIRONMENT`

## Scripts

- `npm --workspace apps/web run dev`
- `npm --workspace apps/web run typecheck`
- `npm --workspace apps/web run build`
- `npm --workspace apps/web run preview`
- `npm --workspace apps/web run test`
- `npm --workspace apps/web run e2e`
- `npm --workspace apps/web run lighthouse`

## Build + Deploy

1. Build static assets:

```bash
npm --workspace apps/web run build
```

2. Deploy `apps/web/dist` to your web root.
3. Use [infrastructure/nginx/app.campuslab.app.conf](infrastructure/nginx/app.campuslab.app.conf) for Nginx configuration.

## Notes

- Access token is in-memory only.
- Refresh token is expected from backend in HttpOnly cookie.
- Offline queue synchronization is enabled for key mutations.
