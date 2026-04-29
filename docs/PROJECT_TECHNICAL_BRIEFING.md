# Campus Lab Technical Briefing (Live-Ready)

## 1) Project in One Line
Campus Lab is a monorepo campus super-app platform with:
- student-facing PWA + mobile app
- admin dashboard
- Node/Express API
- PostgreSQL + Redis data/services
- FastAPI AI microservice
- Nginx reverse proxy + systemd services on VPS

## 2) Monorepo Architecture
Top-level workspaces:
- apps/mobile: Expo React Native app
- apps/web: React + Vite student PWA
- apps/admin: React + Vite admin dashboard
- services/api: Express TypeScript backend + Prisma ORM
- services/ai-server: Python FastAPI AI service
- infrastructure: Nginx and infra config
- scripts: local + VPS deployment/ops automation

## 3) Languages and Technical Surfaces
Core languages used in production code:
- TypeScript (.ts, .tsx): frontend + backend
- Python (.py): AI server and automation scripts
- SQL model layer via Prisma schema
- Bash (.sh): Linux deployment scripts
- PowerShell (.ps1): Windows/local automation and smoke tooling
- YAML: Docker Compose / CI configuration
- HTML/CSS/Tailwind: UI styling and templates
- Java/Gradle artifacts exist under mobile Android pipeline

Observed dominant extensions in repo (excluding build/vendor folders):
- .ts, .tsx, .json, .ps1, .py, .sh, plus Android/web assets

## 4) Frontend Technical Stack

### Student PWA (apps/web)
- React 18 + Vite 5
- TypeScript
- React Router
- TanStack React Query for data fetching/cache invalidation
- Zustand for auth/session state
- Tailwind CSS + utility UI components
- Framer Motion for transitions
- Axios API client

### Admin Dashboard (apps/admin)
- React + Vite + TypeScript
- TanStack Query + TanStack Table
- React Hook Form + Zod
- Radix UI primitives
- Tailwind CSS

### Mobile App (apps/mobile)
- Expo + React Native 0.76
- Redux Toolkit
- React Navigation (native stack, tabs, drawer)
- Axios

## 5) Backend/API Technical Stack (services/api)
- Node.js + Express
- TypeScript (compiled build)
- Prisma ORM + PostgreSQL
- Redis + BullMQ queues
- Auth/security libs:
  - JWT access/refresh tokens
  - bcrypt password hashing
  - zod input validation
  - helmet, CORS, rate limit middleware
- File upload and processing:
  - multer (memory storage)
  - Cloudinary asset storage
  - ClamAV virus scan hook
- Notifications and async:
  - in-app notifications table
  - SSE realtime stream endpoint
  - Firebase admin integration path (optional push)

## 6) AI Service (services/ai-server)
- FastAPI
- Uvicorn
- Pydantic
- HTTPX
- Dotenv
- Runs behind API integration endpoint for AI flows

## 7) Data Layer and Domain Model
Primary DB: PostgreSQL
ORM: Prisma

Major domain entities:
- user, session, otp, notification, notificationPreference
- school, college, department, departmentLevel
- course, timetable, material, pastQuestion
- finance and health entities (expenses, savings, hydration, sleep, steps)
- auditLog for admin traceability

Role model:
- STUDENT
- COURSE_REP
- ADMIN
- Admin role hierarchy also exists for scoped admin governance:
  - SUPER_ADMIN
  - UNIVERSITY_ADMIN
  - COLLEGE_ADMIN
  - DEPARTMENT_ADMIN

## 8) Realtime and Consistency Model
Realtime transport:
- Server-Sent Events (SSE) from /api/v1/realtime/stream

Current realtime channels wired:
- news
- materials
- past-questions
- timetable
- notifications

Frontend realtime behavior:
- On event, React Query invalidates corresponding query keys and refetches
- This gives near-real-time reflection without manual refresh

## 9) Upload and File Flow Technicalities

### Material uploads
- Endpoint: POST /api/v1/materials/upload
- Auth: COURSE_REP or ADMIN
- Validation now supports either courseId or courseCode
- File scanned then uploaded to Cloudinary
- Material row created with scope fields
- Realtime event emitted
- Approval model:
  - students see approved materials
  - uploader can see own pending uploads

### Past question uploads
- Endpoint: POST /api/v1/past-questions/upload
- Auth: COURSE_REP or ADMIN
- Upload to Cloudinary, DB create, realtime emit

### Timetable upload by course rep
- Endpoint: POST /api/v1/timetable/course-rep
- Auth: COURSE_REP or ADMIN
- Scoped by course rep department/level
- Creates timetable entry
- Emits timetable + notifications realtime signals

### Course-rep notifications broadcast
- Endpoint: POST /api/v1/notifications/broadcast
- Auth: COURSE_REP or ADMIN
- Scoped recipients by department + level
- Creates in-app notifications and emits realtime signal

## 10) Security and Reliability Controls
- JWT auth + session tracking
- bcrypt hash for credentials
- Input schema validation on critical routes
- Role-based and scope-based authorization guards
- Academic hierarchy checks
- AES field encryption paths for sensitive fields (e.g., matric/DOB)
- Rate limiting on auth-sensitive flows
- Virus scanning hook before file persist
- Audit logs for privileged operations

## 11) Local Runtime and Ops
Local infra with Docker Compose services:
- postgres
- redis
- clamav
- api
- ai-server
- nginx

Useful root scripts:
- dev:api, dev:web, dev:mobile, dev:ai
- start:local variants for quick bootstrap
- test:api, test:e2e:pwa, test:e2e:admin, test:realtime

## 12) Production Hosting Topology (Current)
- VPS host: Ubuntu server
- Reverse proxy: Nginx
- Public domain: campuslabs.duckdns.org
- API service: systemd campuslab-api.service (Node process)
- AI service: systemd campuslab-ai.service (Uvicorn process)
- Static deployments:
  - PWA under /var/www/campuslab/pwa
  - Admin under /var/www/campuslab/admin

## 13) Production Deployment Sequence
Current VPS deploy script does:
1. git pull latest clean-main
2. npm install
3. write app env production files for web/admin
4. prisma generate
5. prisma db push
6. seed
7. build API + web + admin
8. copy static bundles to web root
9. create/update systemd units
10. validate and restart nginx/api/ai
11. run health curls

## 14) Live Smoke Test Run (Executed)
Automated smoke performed against production domain with seeded accounts:
- auth login success for course rep, student, admin
- material upload success (201)
- timetable upload success (201)
- past question upload success (201)
- notification broadcast endpoint success
- material visibility fixed for uploader pending items
- realtime verified by SSE capture of timetable created event

Observed practical note:
- Broadcast delivered count can be zero if no other users exist in same department-level recipient scope

## 15) Known Operational Caveats
- Firebase credential warning is present on server logs currently
- Core app/API works, but Firebase-backed push features may degrade until credentials are corrected

## 16) Interview/Defense Fast Answers

### Why monorepo?
- Shared types, shared tooling, consistent CI/CD, synchronized versioning across apps/services.
- **Why shared types matter**: Eliminates API response schema mismatch bugs; TypeScript catches breaking changes at compile time.
- **Why consistent CI/CD**: Single deployment pipeline for all apps/services means one set of validation rules, one security layer.

### Why Prisma + PostgreSQL?
- Type-safe ORM, clean schema evolution, relational modeling for academic hierarchy.
- **Why PostgreSQL over NoSQL**: Relations matter—schools have colleges have departments have levels have courses. Schema migrations are reversible and traceable.
- **Why Prisma over raw SQL**: Auto-generated migrations, type-safe queries, IDE autocomplete, less boilerplate, easier onboarding.

### Why SSE instead of WebSockets?
- Lower complexity for server->client event push use case; enough for query invalidation patterns.
- **Why not WebSockets**: WebSockets require stateful connections; SSE is stateless and works behind any HTTP load balancer.
- **Why query invalidation over real-time subscriptions**: Cheaper CPU/memory, more predictable failure modes, easier to reason about staleness.

### How is data scoped?
- Role and hierarchy checks enforce school/college/department/level boundaries.
- **Why scope matters**: A course-rep should only see/manage timetables for their department-level; students see only their own level's timetables.
- **Why computed scope at query time**: Authorization baked into ORM queries means bugs caught early, no leaked data via forgotten guards.

### How do uploads stay safe?
- MIME/extension filtering, file size limits, virus scanning hook, cloud object storage.
- **Why Cloudinary**: CDN edge caching for material delivery, automatic image optimization, no disk space management.
- **Why virus scanning**: One infected PDF can compromise all client devices; scanning before persist is non-negotiable.
- **Why cloud object storage**: Avoids large binaries in git, keeps app server stateless, simplifies backup/disaster recovery.

### How is production made reliable?
- systemd service supervision, Nginx reverse proxy, repeatable deploy script, health checks after deploy.
- **Why systemd services**: Automatic restart on crash, memory limits, logging to journalctl, no manual process management.
- **Why Nginx reverse proxy**: SSL termination, rate limiting, static file serving, upstream failover, request logging in one place.
- **Why health checks post-deploy**: Catches startup errors before traffic routes; prevents partial deployment corruption.

### Why role-based access control layers?
- STUDENT/COURSE_REP/ADMIN roles with sub-tiers (SUPER_ADMIN/UNIVERSITY_ADMIN/COLLEGE_ADMIN/DEPARTMENT_ADMIN).
- **Why multi-tier admin**: Scales governance—a COLLEGE_ADMIN can't see another college's data; reduces blast radius of compromise.
- **Why explicit role checks in code**: Guards frontend and backend; one place for permission logic; audit trail for who did what.

### Why separate frontend apps (PWA vs Admin)?
- Different UX paradigms, different permission sets, different feature surfaces.
- **Why separate apps, not feature flags**: Cleaner codebase, simpler permissions, faster loading (no unused code), easier to deprecate/version independently.

### Why React Query over Redux for data?
- Declarative caching, automatic deduplication, stale-while-revalidate patterns.
- **Why React Query wins**: Handles cache invalidation automatically; Redux requires manual dispatch; Query is data-layer, Redux is state-layer mismatch for fetching.

### Why Zustand over Redux for auth?
- Minimal boilerplate, suffices for session/profile/permissions state.
- **Why Zustand for auth**: Auth doesn't change often during session; simple reads/writes; Redux overkill for 3-4 state atoms.

### Why Python FastAPI for AI?
- Async I/O, Pydantic validation, easy model serving integration, good LLM library ecosystem.
- **Why separate service**: AI inference can be CPU-intensive; separate process prevents Node.js event loop blocking; can scale independently.

### Why Tailwind CSS?
- Utility-first, consistent design tokens, smaller final CSS vs. component-scoped styles.
- **Why not CSS-in-JS**: CSS-in-JS adds runtime overhead; Tailwind compiles away unused utilities; works in PWA and vanilla contexts.

### Why Expo + React Native for mobile?
- One codebase for iOS/Android, faster iteration, Managed Expo cloud build service.
- **Why not Flutter**: Team expertise, JavaScript ecosystem, larger RN library collection, Expo EAS Build removes local build machine needs.

### Why BullMQ for background jobs?
- Redis-backed queues, retries, delays, job tracking.
- **Why background jobs exist**: Email/notification sends can't block API response; timetable imports may take time; ensures reliability through persistence.

## 17) If You Need to Explain "What We Just Fixed"
Recent high-impact fixes include:
- expense logging category mismatch corrected
- timetable endpoint and rendering corrected for PWA
- level filter added in timetable builder
- admin hierarchy and permission scoping implemented
- course-rep tools restored and made functional
- upload hardening + realtime channels extended
- uploader visibility fix for pending materials

---
This file is intended as a practical technical defense sheet so you can answer architecture, deployment, reliability, and feature-operation questions quickly.
