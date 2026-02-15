# EmailHub

EmailHub is a Next.js + Prisma email management platform for multi-account inbox aggregation, filtering, and push notifications.

This branch includes a non-breaking structure cleanup and deployment hardening pass focused on:
- documentation consolidation,
- safer Docker deployment aligned with current runtime behavior,
- archival (not deletion) of low-value report files with reference-check evidence.

## Table of Contents

1. [Current Runtime Facts](#current-runtime-facts)
2. [Quick Start (Local)](#quick-start-local)
3. [Environment Variables](#environment-variables)
4. [Detailed Deployment](#detailed-deployment)
5. [Docker Deployment (Recommended for Reproducibility)](#docker-deployment-recommended-for-reproducibility)
6. [Database Operations, Backup, and Rollback](#database-operations-backup-and-rollback)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Repository Structure](#repository-structure)
10. [Archived Documents](#archived-documents)

## Current Runtime Facts

Before deploying, align with how the code actually runs today:

- Prisma client is created through `@prisma/adapter-better-sqlite3` in `lib/prisma.ts`.
- Runtime database file is `dev.db` under process working directory.
- Current app runtime does **not** use PostgreSQL even if `DATABASE_URL` is set to a Postgres URL.
- Because of the above, the default production-safe path for this repository state is **SQLite with persistent volume**.

If you want PostgreSQL runtime, that is a separate refactor (switch `lib/prisma.ts` and datasource strategy), and is intentionally out of scope for this non-breaking cleanup.

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### 1) Clone and install

```bash
git clone <your-repo-url>
cd email-manager
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Required values in `.env`:

```env
NEXTAUTH_SECRET="replace-with-random-string"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="32-char-hex-key"
```

Generate secure values:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 16      # ENCRYPTION_KEY (32 hex chars)
```

### 3) Initialize database

```bash
npm run db:generate
npm run db:push
```

### 4) Start app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NEXTAUTH_SECRET` | Yes | `base64-random` | Minimum 32 random characters recommended. |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | External URL of the app. |
| `ENCRYPTION_KEY` | Yes | `32-hex-chars` | Used for stored credential encryption. |
| `NODE_ENV` | Recommended | `production` | Set automatically in Docker image. |
| `DATABASE_URL` | Optional in current runtime | `file:./dev.db` | Kept for compatibility; runtime currently uses SQLite adapter in code. |
| `REDIS_HOST` / `REDIS_PORT` | Optional | `redis` / `6379` | Only if your current features actively require Redis integration. |

## Detailed Deployment

### Option A: Bare-metal / VM (PM2 + Nginx)

1. Install Node.js 20 and PM2.
2. Deploy source code to target host.
3. Run:

```bash
npm ci
npm run db:generate
npm run db:push
npm run build
pm2 start npm --name emailhub -- start
pm2 save
```

4. Place Nginx in front of `localhost:3000` and terminate TLS with Let's Encrypt.

### Option B: Docker (recommended below)

Use the provided `Dockerfile` + `docker-compose.yml`. This is the safest reproducible path for the current codebase.

## Docker Deployment (Recommended for Reproducibility)

### Why this Docker setup

- Multi-stage build for smaller runtime image.
- Startup process performs safe schema sync (`prisma db push`) before serving traffic.
- SQLite database persisted through Docker volume.
- Non-root container user.

### 1) Build and start

```bash
docker compose up -d --build
```

### 2) Inspect logs

```bash
docker compose logs -f app
```

### 3) Verify app

Open `http://localhost:3000`.

### 4) Stop services

```bash
docker compose down
```

### 5) Stop and remove volumes (destructive)

```bash
docker compose down -v
```

## Database Operations, Backup, and Rollback

### SQLite backup (host)

If running locally (non-Docker):

```bash
copy dev.db dev.db.backup
```

### SQLite backup (Docker)

```bash
docker compose exec app sh -lc "cp /data/dev.db /data/dev.db.backup.$(date +%Y%m%d%H%M%S)"
```

### Rollback strategy for this cleanup branch

- All structural changes are split into small commits.
- Archived files were moved to `/_archive` instead of deletion.
- You can rollback one step at a time with `git revert <commit>`.

## Security Checklist

- Do not commit `.env`.
- Rotate `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` before production.
- Run dependency audit in CI and before release:

```bash
npm audit
```

- Keep backups of SQLite volume.
- Prefer TLS termination at reverse proxy.

## Troubleshooting

### Docker app starts then exits

Check startup logs:

```bash
docker compose logs app --tail=200
```

Most common causes:
- invalid `.env` values,
- DB file mount permissions,
- stale generated Prisma client after dependency updates.

### Prisma mismatch errors

Run:

```bash
npm run db:generate
npm run db:push
```

Then rebuild app or image.

### Build fails in CI but local works

- confirm Node.js major version matches CI (20),
- ensure lockfile is committed,
- ensure no hidden local `.env` assumptions.

## Repository Structure

```text
email-manager/
  app/                    Next.js app router pages and API routes
  components/             UI components
  lib/                    core services and adapters
  prisma/                 Prisma schema
  scripts/                utility scripts
  docs/
    operations/           operational docs (cleanup evidence, runbooks)
  _archive/
    docs/                 archived docs retained for traceability
  Dockerfile              production container image
  docker-compose.yml      local/prod-like orchestration (SQLite persistence)
```

## Archived Documents

The following report-style files were moved from root to keep the top-level clean while preserving history:

- `_archive/docs/reports/FIX_REPORT.md`
- `_archive/docs/reports/DELIVERY_REPORT.md`
- `_archive/docs/reports/PROJECT_SUMMARY.md`
- `_archive/docs/reports/QUICK_REFERENCE.md`
- `_archive/docs/reports/SHOWCASE.md`

Reference check evidence is documented in:
- `docs/operations/cleanup-reference-check.md`

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm test
npm run db:generate
npm run db:push
npm run listeners:start
```

## License

MIT License. See `LICENSE`.
