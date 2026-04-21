# Campus Lab

Campus Lab is a production-ready student super app monorepo with mobile/web clients, a secure Node.js + Prisma API, and an AI service for campus academics, hostel booking, health, finance, and notifications.

## 🤖 AI-Assisted Development

## Live Demo Access

- PWA: https://campuslabs.duckdns.org/
- Admin: https://campuslabs.duckdns.org/admin/

### Demo Login Credentials

- PWA demo user
	- Email: student@campuslab.app
	- Password: Student@123
- Admin demo user
	- Email: showcase@campuslab.app
	- Password: Showcase@123!

##  Team
* **Adebiyi Diekooloreoluwa** 
* **Afolabi Daniel** 
* **Hammed Wajud**
* **Ogunseye Hannah** 
* **Ogunnaike Olanrewaju** 
   
## Core Docs

- Architecture: docs/ARCHITECTURE.md
- Local setup: README-local-setup.md
- Script commands: SCRIPT_COMMANDS.md

## Stack

- Mobile: React Native (Expo) + Redux Toolkit + React Navigation (tabs + drawer)
- Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis
- AI Server: FastAPI endpoints for math/chat/summarize model routing
- Infra: Docker Compose + Nginx reverse proxy + GitHub Actions CI

## Monorepo Structure

- `apps/mobile`: React Native app with onboarding, dashboard, academics, hostel, health+finance, AI, news, settings
- `services/api`: REST API with auth, role/scope control, personalized data routes, Prisma schema and seed
- `services/ai-server`: FastAPI AI gateway service with queue-limited inference placeholders
- `infrastructure/nginx`: Reverse proxy config
- `.github/workflows`: CI/CD workflow

## Backend API Coverage

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/unlock-account`
- `POST /api/v1/auth/2fa/setup`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/disable`

### Users

- `GET /api/v1/users/me`
- `GET /api/v1/users/sessions`
- `DELETE /api/v1/users/sessions/:id`
- `PATCH /api/v1/users/privacy/coursemate-locator`
- `PATCH /api/v1/users/notifications/preferences`
- `PATCH /api/v1/users/health-goals`

### News

- `POST /api/v1/news` (admin)
- `GET /api/v1/news`
- `POST /api/v1/news/:id/bookmark`

### Academics

- `GET /api/v1/timetable/mine`
- `POST /api/v1/timetable` (admin)
- `PATCH /api/v1/timetable/:id` (admin)
- `GET /api/v1/materials/mine`
- `POST /api/v1/materials/upload` (CR/Admin)
- `POST /api/v1/materials/web-scrape-fallback`
- `POST /api/v1/materials/:id/bookmark`
- `POST /api/v1/materials/:id/rate`

### Hostel

- `GET /api/v1/hostel/hostels`
- `GET /api/v1/hostel/hostels/:id/layout`
- `POST /api/v1/hostel/beds/:id/hold`
- `POST /api/v1/hostel/beds/:id/book`
- `DELETE /api/v1/hostel/bookings/:id`

### Finance + Health

- `POST /api/v1/finance/expenses`
- `GET /api/v1/finance/expenses`
- `POST /api/v1/finance/savings-goals`
- `POST /api/v1/finance/savings-goals/:id/deposits`
- `GET /api/v1/finance/summary`
- `POST /api/v1/finance/ai-meal-plan`
- `POST /api/v1/health/hydration`
- `POST /api/v1/health/sleep`
- `POST /api/v1/health/steps`
- `GET /api/v1/health/summary`

### Notifications + AI + Admin

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/devices/register`
- `POST /api/v1/notifications/devices/revoke`
- `GET /api/v1/past-questions/mine`
- `POST /api/v1/past-questions/upload`
- `POST /api/v1/past-questions/practice`
- `POST /api/v1/ai/math`
- `POST /api/v1/ai/chat`
- `POST /api/v1/ai/summarize`
- `GET /api/v1/admin/course-reps/pending`
- `POST /api/v1/admin/course-reps/:id/approve`
- `POST /api/v1/admin/course-reps/:id/reject`
- `POST /api/v1/admin/materials/:id/approve`
- `GET /api/v1/admin/audit-logs`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

- Copy `services/api/.env.example` to `services/api/.env`
- Fill SMTP, JWT, AES, DB, Redis, Cloudinary, FCM values
- Ensure ClamAV host/port match your runtime (`CLAMAV_HOST`, `CLAMAV_PORT`)

3. Start infrastructure and services:

```bash
docker compose up -d
```

4. Run Prisma migration and seed:

```bash
npm --workspace services/api run prisma:generate
npm --workspace services/api run prisma:migrate
npm --workspace services/api run seed
```

5. Run strict compile checks:

```bash
npm --workspace services/api run typecheck
npm --workspace apps/mobile run typecheck
```

6. Run API smoke tests (critical flows):

Set these in `services/api/.env` for deterministic smoke runs:

- `EXPOSE_TEST_OTPS=true`
- `SMOKE_SCHOOL_ID`, `SMOKE_COLLEGE_ID`, `SMOKE_DEPARTMENT_ID`, `SMOKE_LEVEL_ID` in shell environment

Then execute:

```bash
npm --workspace services/api run smoke
```

7. Start local development:

```bash
npm run dev:api
npm run dev:mobile
```

8. Run AI service (if not using compose):

```bash
cd services/ai-server
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## Security Controls Included

- JWT access + refresh with refresh rotation
- Refresh token hashing (stored hashed, not raw)
- Bcrypt hashing (12 rounds)
- Email OTP verification and password reset flow
- Account lockout after failed login attempts
- Account unlock via email OTP
- Optional TOTP 2FA (setup, verify, disable)
- Role guards (`student`, `course_rep`, `admin`)
- Academic hierarchy scope checks on protected routes
- AES-256-GCM encryption for matric number and DOB
- Helmet + strict CORS + rate limiting + input validation
- AI request quota (20 per user per hour)
- BullMQ queues for email OTP, material summary, and scrape fallback jobs
- Audit log model and admin visibility endpoint

## Notes

- AI model inference in `services/ai-server/app/models/inference.py` is currently placeholder logic intended to be swapped with llama.cpp or Ollama runtime calls on VPS.
- File upload uses Cloudinary storage and a ClamAV scan hook before upload.
- Web scraping fallback uses a BullMQ worker with robots.txt checks against curated open educational sources and PDF extraction/summarization.

## Production Hooks Implemented

- Upload virus scanning hook: `services/api/src/common/utils/virusScan.ts`
- Robots-aware scraping worker: `services/api/src/common/lib/queue.ts` (`scrape-fallback` worker)
- ClamAV runtime service included in `docker-compose.yml`
# 🎓 CampusLab - Comprehensive Campus Management Platform

A production-ready, full-stack campus management system with admin dashboard, student app, real-time notifications, and complete course/hostel management.

![Status](https://img.shields.io/badge/Status-Development-blue)
![Node](https://img.shields.io/badge/Node-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## ⚡ Quick Start

```bash
# Install & Setup (5 minutes)
npm run cli -- setup

# Start Development
npm run dev

# Run Tests
npm run test

# View Documentation
npm run docs
```

**Access Points**:
- 🎛️ Admin Dashboard: http://localhost:3001
- 📱 Student App: http://localhost:5173
- 🔌 API: http://localhost:3000/api

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION.md](DOCUMENTATION.md) | Complete project overview & structure |
| [API_REFERENCE.md](API_REFERENCE.md) | All 30+ endpoints with examples |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Architecture, best practices, workflows |

---

## 🏗️ Project Structure

```
CampusLab/
├── apps/
│   ├── admin/          # Next.js Admin Dashboard
│   ├── student/        # React Native Student App
│   └── web/            # React + Vite Web App
├── backend/            # Express.js API Server
├── database/           # PostgreSQL Schema & Migrations
├── docs/               # Project Documentation
└── shared/             # Types & Utilities
```

---

## 🎯 Features

### 👨‍💼 Admin Dashboard
- ✅ Complete user management
- ✅ Academic management & course materials
- ✅ Hostel management & bed allocation
- ✅ News & announcements system
- ✅ System health monitoring & audit logs
- ✅ Real-time notifications

### 📱 Student App
- ✅ Download course materials
- ✅ View available hostels & book beds
- ✅ Read campus news
- ✅ Community features
- ✅ Real-time notifications

### 🔐 Security
- ✅ JWT Authentication
- ✅ 2FA with TOTP/OTP
- ✅ Bcrypt password hashing
- ✅ Audit logging
- ✅ Rate limiting

---

## 🛠️ Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Redis
- **Admin**: Next.js + React + Tailwind
- **Student**: React Native + Expo
- **Auth**: JWT + TOTP

---

## 📦 API Endpoints (30+)

All endpoints documented with examples in [API_REFERENCE.md](API_REFERENCE.md)

- Authentication: 4 endpoints
- User Management: 6 endpoints
- Academic: 6 endpoints
- Hostel: 5 endpoints
- News: 4 endpoints
- System: 5+ endpoints

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+    # node -v
PostgreSQL 14+ # psql --version
```

### Installation

```bash
# Automated setup
npm run cli -- setup

# Or manual setup
npm install
npm run db:migrate
npm run dev
```

---

## 📋 Commands

```bash
npm run dev           # Start all services
npm run test          # Run test suite
npm run test:e2e      # Run E2E tests
npm run db:migrate    # Database migrations
npm run cli -- setup  # Complete setup
```

---

## 📖 Learn More

- [Full Documentation](DOCUMENTATION.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)
- [API Reference](API_REFERENCE.md)
- [E2E Tests](apps/admin/e2e-tests.ts)

---


**Made with ❤️ for Campus Lab** | Version 1.0.0
