# Campus Lab Architecture

## 1. System Overview
Campus Lab is a monorepo with three runtime applications and shared operational tooling:

- Student PWA: apps/web
- Admin dashboard: apps/admin
- Core backend API: services/api
- AI provider gateway: services/ai-server

The platform is organized around a REST API boundary, with the PWA/Admin as clients and an AI sidecar service for model calls.

## 2. High-Level Runtime Topology

- Browser (PWA/Admin) calls Express API at /api/v1
- Express API handles auth, domain logic, DB access, notifications, realtime events, and upload workflows
- Express AI routes proxy model tasks to FastAPI AI server
- FastAPI AI server calls external provider APIs (currently Groq-compatible OpenAI chat completions)
- PostgreSQL stores transactional domain data
- Redis supports queue/realtime/temporary workload coordination
- Cloudinary stores uploaded media files
- Firebase Admin SDK sends FCM notifications when credentials are configured

## 3. Monorepo Layout and Responsibilities

- apps/web: Student PWA experience (auth, onboarding, academics, hostel, finance, health, AI assistant)
- apps/admin: Admin operations (academic structure, materials moderation, users, news, hostel, settings)
- services/api: Main backend and business rules
- services/ai-server: AI abstraction layer and provider request handling
- scripts: Windows-first bootstrap and utility scripts (local setup, env updates, startup orchestration)
- docs: internal operational and architecture docs

## 4. Backend Domain Architecture (services/api)

### 4.1 API Entry and Middleware
- src/server.ts boots app, scheduler, queue workers, FCM init
- src/app.ts wires middleware and route modules
- Shared middleware handles auth, role checks, validation, rate limits

### 4.2 Domain Modules
- auth: registration, login, verification, reset, 2FA, refresh/session flows
- users: profile and preference updates
- admin: academic data, users/course reps, news, system config
- materials/past questions/timetable: academic content workflows
- notifications/news/realtime: in-app and push communication
- hostel/finance/health: vertical student modules
- ai: proxy endpoints to services/ai-server

### 4.3 Data Layer
- Prisma models define school-college-department-level hierarchy and app entities
- PostgreSQL is source of truth for persistent business state

### 4.4 Background/Async
- Redis-backed worker queues for deferred jobs (email OTP, summaries, scrape fallback)
- Realtime event emission to keep clients updated

## 5. AI Architecture (services/ai-server)

- FastAPI exposes /api/ai/math, /api/ai/chat, /api/ai/summarize, /api/ai/health
- Inference module enforces concurrency semaphore
- Provider call abstraction currently targets Groq-compatible endpoint:
  - Base URL: https://api.groq.com/openai/v1
  - Chat completion endpoint: /chat/completions
- Model routing is env-driven:
  - AI_CHAT_MODEL
  - AI_MATH_MODEL
  - AI_SUMMARY_MODEL

This separation keeps provider-specific logic outside core backend code and allows provider/model swaps with minimal API changes.

## 6. Frontend Architecture

### 6.1 Student PWA (apps/web)
- Vite + React SPA
- TanStack Query handles server-state fetching/invalidation
- Zustand handles auth/session-like client state
- Route-level pages for each app feature
- PWA plugin + runtime caching for offline and resilience

### 6.2 Admin App (apps/admin)
- React SPA for operational management
- Uses shared REST API with admin auth token model
- Pages map to administrative domains (academic structure, users, materials, news, etc.)

## 7. Security and Reliability Notes

- JWT access/refresh with session persistence
- Input validation via zod schemas
- Role-based route guards
- Optional FCM startup: non-fatal if misconfigured
- AI proxy is hardened to return 502 on provider failures instead of crashing API
- Upload pipeline supports scanning hooks and robust MIME/extension handling

## 8. Why Each Language Exists

### TypeScript
Used in apps/web, apps/admin, and services/api for:
- Strong typing across API contracts and UI state
- Safer refactors in a multi-module monorepo
- Better reliability for business-critical flows

### JavaScript
Used for config/runtime compatibility files and generated ecosystem glue where TS compilation is not required.

### Python
Used in services/ai-server for:
- Fast AI gateway development with FastAPI/httpx
- Ecosystem compatibility for model/provider integrations
- Lightweight sidecar behavior with clear API boundaries

### PowerShell
Used for scripts/*.ps1 because:
- Project is Windows-first for local developer setup
- Automates PostgreSQL/Redis checks, env wiring, startup orchestration, and LAN usability

### SQL (via Prisma schema)
Relational modeling and persistence semantics are represented in Prisma schema, compiled to SQL operations against PostgreSQL.

### YAML
Used in Docker Compose and CI/workflow definitions for service orchestration and automation.

### JSON
Used for environment-adjacent configuration, manifests, and service account credentials.

### Markdown
Used for operational, onboarding, and architecture documentation.

### Bash/Shell
Used for cross-platform checks and Linux-friendly helper scripts where appropriate.

## 9. Local Startup Flow

Primary local command:
- npm run start:local:pwa

What it does:
- Verifies infrastructure dependencies
- Configures environment
- Prepares Prisma schema
- Starts API, admin, AI, and PWA processes
- Prints localhost and LAN URLs for phone-on-WiFi testing

## 10. Design Rationale Summary

- Split AI sidecar keeps core API stable and provider-agnostic
- Hierarchical academic data model supports targeting and scoped content delivery
- Monorepo enables coordinated changes across client, API, and tooling
- Windows-first automation reduces setup friction for contributors and demo workflows
