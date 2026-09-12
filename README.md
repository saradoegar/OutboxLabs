# ReachInbox Email Scheduler & Queue Service

Production-grade email scheduler service and frontend dashboard built for reliable, scalable email scheduling and dispatching using **BullMQ + Redis**, **PostgreSQL**, **Node.js/Express**, **TypeScript**, and **React**.

---

## 🏗️ Monorepo Structure

```
reachinbox-assignment/
├── frontend/                     # React (Vite) + Tailwind CSS + TypeScript dashboard
│   ├── src/
│   │   ├── components/           # UI components matching Figma mockups
│   │   ├── context/              # Auth and Email state management
│   │   ├── services/             # Typed API client
│   │   └── views/                # Dashboard, Compose, Detail, Login views
│   └── package.json
│
├── backend/                      # Node.js + Express + BullMQ + PostgreSQL backend
│   ├── src/
│   │   ├── config/               # Environment and Redis configurations
│   │   ├── controllers/          # Request handlers
│   │   ├── routes/               # Express routing
│   │   ├── services/             # Email, queue, SMTP, Elasticsearch services
│   │   ├── workers/              # BullMQ worker process (independent service)
│   │   ├── queues/               # BullMQ queue definitions
│   │   ├── middleware/           # Rate limiting & validation middleware
│   │   ├── db/                   # PostgreSQL schema and connection pool
│   │   ├── models/               # Relational data types & models
│   │   ├── utils/                # Logging and helper utilities
│   │   ├── app.ts                # Express application definition
│   │   └── server.ts             # API server entrypoint
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml            # Complete infrastructure (PostgreSQL, Redis, ES, App)
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Docker)

To spin up all backing infrastructure (PostgreSQL, Redis, Elasticsearch) along with the API, Worker, and Frontend:

```bash
docker compose up -d
```

### Local Development URLs
- **Frontend Dashboard (Local)**: `http://localhost:5173`
- **Backend API (Local)**: `http://localhost:5000`
- **API Health Check (Local)**: `http://localhost:5000/health`
- **Bull Board Queue Dashboard (Local)**: `http://localhost:5000/admin/queues`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Cache & Queues**: `localhost:6379`
- **Elasticsearch Engine**: `localhost:9200`

---

## ⚙️ Local Development (Independent Processes)

If running services locally on your machine outside Docker containers:

### 1. Start Backing Infrastructure
Ensure PostgreSQL, Redis, and Elasticsearch are running:
```bash
docker compose up -d postgres redis elasticsearch
```

### 2. Start Backend API & Worker
```bash
cd backend
npm install
npm run dev
```
*(In development mode, `npm run dev` starts the Express API on port 5000 and automatically initializes the embedded BullMQ queue worker to process jobs).*

For running a dedicated standalone worker process independently:
```bash
cd backend
npm run dev:worker
```

### 3. Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite dev server will start at `http://localhost:5173`.

---

## 🔧 Environment Variables & Configuration

Create a `.env` file in `backend/.env` (reference `backend/.env.example`):

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/reachinbox

# Redis (BullMQ & Rate Limiter)
REDIS_URL=redis://localhost:6379

# Ethereal Email SMTP Sandbox
# Ethereal is an isolated developer SMTP sandbox that captures all outgoing emails
# and generates web preview URLs (etherealPreviewUrl) for inspection without sending
# to external real-world inboxes.
# Leave ETHEREAL_USER and ETHEREAL_PASSWORD empty to auto-generate a fresh test mailbox.
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASSWORD=
EMAIL_FROM="ReachInbox Scheduler <scheduler@reachinbox.ai>"

# Rate Limiting & Worker Concurrency
WORKER_CONCURRENCY=5
EMAIL_DELAY_MS=1000
MAX_EMAILS_PER_HOUR=100

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Google OAuth 2.0 (Optional - populated for live OAuth consent flow)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Slack OAuth 2.0 & Alerting (Optional - populated for live Slack integration)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/oauth/callback
SLACK_SCOPES=chat:write,channels:read,chat:write.public
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
```

---

## 🏛️ Architecture Overview

### 1. How Scheduling Works (NO CRON)
- The system strictly relies on **BullMQ delayed jobs in Redis** instead of timers, `setInterval`, or cron jobs.
- When an email is scheduled for a future timestamp (`scheduledAt`), the target delay is calculated as `delayMs = targetTime - now`.
- The job is enqueued in BullMQ with `jobId = idempotencyKey` and `delay: delayMs`.
- Redis stores the job in a sorted set (`bull:email-queue:delayed`) where the score corresponds to the target timestamp.
- When the delay elapses, BullMQ automatically moves the job to the waiting/active state for the worker to process.

### 2. How Persistence Across Restarts is Handled
- Redis natively persists delayed jobs on disk via AOF/RDB.
- If both the Express API and the BullMQ Worker are terminated or rebooted:
  1. The delayed job remains intact in Redis.
  2. The email metadata and status remain persisted in PostgreSQL.
  3. Upon restart, the worker re-attaches to `email-queue` and automatically claims and executes all due jobs at their scheduled timestamp.
  4. Zero jobs are dropped or lost during downtime.

### 3. How Rate Limiting & Concurrency are Implemented
- **Concurrency**: Handled via BullMQ's native `concurrency` option on the Worker (configurable via `WORKER_CONCURRENCY`, default 5).
- **Hourly Rate Limiting**: Enforced atomically using a Redis counter with key pattern `email_rate_limit:YYYY-MM-DD-HH`.
  - When the count exceeds `MAX_EMAILS_PER_HOUR`:
    1. The job is **never dropped** and **never permanently failed**.
    2. The email's status in PostgreSQL transitions to `rescheduled`.
    3. The job is automatically re-queued in BullMQ with a delay calculated to target the beginning of the next hour window.
    4. A Slack rate-limit alert is automatically dispatched to notify the team.
- **Inter-Send Delays**: Configured per batch/campaign to stagger sends between consecutive recipients.

### 4. Elasticsearch Full-Text Search
- Emails are indexed upon creation and state transitions into Elasticsearch index `emails`.
- Multi-match search supports fuzzy matching across `subject`, `body`, `recipient`, and `sender`.
- Fail-open architecture ensures that any temporary Elasticsearch outage never blocks the core email queuing or dispatching pipeline.

---

## 📋 Features Implemented

### Backend
- ✅ **Delayed Scheduler**: Pure BullMQ + Redis delayed jobs (zero cron/setTimeout timers).
- ✅ **Restart Persistence**: Survives complete service restarts with verified delayed job recovery.
- ✅ **Idempotency**: Strict deduplication via `idempotency_key` preventing double-queuing and duplicate sends.
- ✅ **Rate Limiting**: Redis-backed atomic hourly quota with graceful rescheduling into next window.
- ✅ **Worker Concurrency**: Configurable worker pool (`WORKER_CONCURRENCY`).
- ✅ **Ethereal SMTP Integration**: Real email dispatching with captured live preview URLs.
- ✅ **Elasticsearch Full-Text Search**: Fuzzy multi-field search (`GET /api/search?q=...`).
- ✅ **Bull Board UI**: Live real-time dashboard at `http://localhost:5000/admin/queues`.
- ✅ **Slack Integration**: OAuth 2.0 flow, per-user storage, and automatic rate-limit incident alerts.
- ✅ **Google OAuth**: Real OAuth 2.0 flow, database upserts, and safe `/api/auth/me` user profile.
- ✅ **Security**: Zero hardcoded secrets, strictly sanitized API responses, clean `.env.example`.

### Frontend
- ✅ **Google Login UI**: OAuth login, user info header (name, email, avatar), and logout.
- ✅ **Dashboard Tabs**: Scheduled Emails, Sent Emails, and Starred views matching Figma design.
- ✅ **Compose Modal**: Subject, body, recipient list (with CSV/text lead parsing), start time, delay, and hourly limit.
- ✅ **Email Detail View**: Real thread inspection showing actual subject, recipient, body, timestamp, and Ethereal preview link.
- ✅ **Zero Frontend Breaking Changes**: Frontend remains 100% frozen and completely compatible.

---

## 🧪 Automated Verification Suite

The repository includes standalone automated test scripts inside `backend/tests/`:

```bash
cd backend
npx tsx tests/test-phase5.ts           # Real BullMQ delayed scheduling test
npx tsx tests/test-phase6.ts           # Idempotency and duplicate prevention test
npx tsx tests/test-phase7-prepare.ts   # Schedule job before restart
npx tsx tests/test-phase7-verify.ts    # Verify execution after restart
npx tsx tests/test-phase8.ts           # Hourly rate limiting and Slack alerting test
npx tsx tests/test-phase9.ts           # Delay between consecutive emails test
npx tsx tests/test-phase10.ts          # Elasticsearch search integration test
npx tsx tests/test-phase12.ts          # Slack OAuth and disconnect endpoints test
npx tsx tests/test-phase13.ts          # Google OAuth and user profile test
```
