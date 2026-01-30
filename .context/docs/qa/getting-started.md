# QA — Getting Started (PrimeCloudProV2)

This guide helps QA engineers and developers set up **PrimeCloudProV2** locally to validate core flows: authentication, multi-tenant accounts, S3/MinIO storage, optional SFTPGo integration, and billing/usage background jobs.

---

## What you’ll run locally

PrimeCloudProV2 runs as a single Node.js application where the **Express server** serves:

- API routes (`server/routes/*`)
- a Vite-powered React frontend (`client/src/*`)

Core services include:

- **MinIOService** (`server/services/minio.service.ts`) — S3-compatible storage operations and usage metrics
- **SftpGoService** (`server/services/sftpgo.service.ts`) — optional SFTP user and folder provisioning
- **BillingService** (`server/services/billing.service.ts`) — invoices and pricing/usage aggregation
- **AuditService** (`server/services/audit.service.ts`) — audit log creation and querying
- Cron jobs (`server/cron/usage-collector.ts`) — usage collection + monthly billing + overdue reminders

---

## Prerequisites

Install and/or have access to:

- **Node.js**: v18+ recommended
- **npm**: v9+
- **PostgreSQL**: v13+ (local or remote)
- **MinIO** (or any S3-compatible provider): required for storage features
- **SFTPGo**: optional (recommended if you need SFTP management features)

---

## Repository setup

```bash
git clone <repository-url>
cd PrimeCloudProV2
npm install
```

---

## Environment configuration

Create a `.env` file at the repository root.

### Required (minimum boot)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/primecloudpro` |
| `MINIO_ENDPOINT` | MinIO host | `localhost` |
| `MINIO_PORT` | MinIO API port | `9000` |
| `MINIO_ACCESS_KEY` | Access key | `minioadmin` |
| `MINIO_SECRET_KEY` | Secret key | `minioadmin` |
| `MINIO_USE_SSL` | Use HTTPS for MinIO | `false` |

### Optional integrations

| Variable | Description |
|---|---|
| `SFTPGO_BASE_URL` | Base API URL for SFTPGo management |
| `SFTPGO_ADMIN_USER` | SFTPGo admin username |
| `SFTPGO_ADMIN_PASSWORD` | SFTPGo admin password |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (frontend) |
| `CLERK_SECRET_KEY` | Clerk secret key (backend) |

> Notes for QA:
> - If you do not configure Clerk, confirm what auth mode your environment expects (this repo includes `server/replit_integrations/auth/*` and also references Clerk tokens in `client/src/lib/queryClient.ts`).
> - MinIO configuration is essential for most storage-related UI and API tests.

---

## Database setup (Drizzle)

Push the schema to your configured database:

```bash
npm run db:push
```

Verify DB connectivity:

```bash
npx tsx scripts/db_test.ts
```

Related files:
- Shared schema/types: `shared/schema.ts`
- DB connectivity test: `scripts/db_test.ts`

---

## Running the application

### Development mode

Starts the backend and frontend with hot reload:

```bash
npm run dev
```

Default URL is typically:

- http://localhost:5000

### Production build

```bash
npm run build
npm start
```

---

## Verifying dependencies (QA smoke checks)

### 1) MinIO connectivity

Run the MinIO test script:

```bash
npx tsx scripts/test-minio.ts
```

If this fails, verify:

- MinIO is reachable from your machine/container
- `MINIO_*` variables match your MinIO configuration
- SSL setting matches (`MINIO_USE_SSL=true/false`)

### 2) Storage consistency / bucket sizing

```bash
npx tsx script/check-bucket-size.ts
```

Related maintenance scripts (useful for QA triage):
- `script/sync-minio-buckets.ts`
- `script/sync-minio-buckets-full.ts`
- `script/migrate-bucket.ts`
- `script/fix-storage.ts`

---

## Background jobs (usage + billing)

PrimeCloudProV2 includes scheduled jobs managed in:

- `server/cron/usage-collector.ts`

These jobs cover:

1. **Usage metrics collection** (polls MinIO for bucket usage/bandwidth)
2. **Monthly billing** (generates invoices for the previous month)
3. **Overdue invoice reminders** (notifications/reminders)

### Manual triggering (for QA)

The cron module exports trigger helpers:

- `triggerUsageCollection`
- `triggerMonthlyBilling`

Search for how these are wired to routes or admin actions in your build (commonly via internal endpoints or admin UI). Start here:

- `server/index.ts` (app boot + route registration)
- `server/cron/usage-collector.ts` (exported trigger functions)

If no HTTP endpoints exist for triggers, QA can still validate by:
- shortening intervals locally (code change)
- calling trigger functions in a one-off script (tsx) that imports them

---

## Project structure (quick orientation)

- **Frontend**: `client/src`
  - `pages/` — screen-level views (e.g., dashboards, settings)
  - `hooks/` — React Query data hooks (API access patterns)
  - `components/` — UI components
  - `lib/` — shared helpers (e.g., `client/src/lib/queryClient.ts`, `client/src/lib/utils.ts`)
- **Backend**: `server/`
  - `routes/` — feature-scoped API endpoints (e.g., SMTP routes in `server/routes/smtp.ts`)
  - `services/` — business logic (MinIO, SFTPGo, Billing, Audit, Notifications)
  - `lib/` — utilities and validators (e.g., `server/lib/document-validation.ts`)
  - `cron/` — scheduled background tasks
- **Shared**: `shared/`
  - Zod schemas + types used by both client/server (`shared/schema.ts`)
  - Shared route helpers (`shared/routes.ts`, e.g., `buildUrl`)
- **Scripts**:
  - `scripts/` and `script/` — CLI utilities for checks, migrations, syncing

---

## Common QA flows to validate after setup

1. **App boots**: `npm run dev` starts without runtime errors.
2. **DB + schema OK**: `npm run db:push` and `scripts/db_test.ts` succeed.
3. **MinIO OK**: `scripts/test-minio.ts` succeeds and UI can list/create buckets if enabled.
4. **Usage collection**: verify usage metrics appear after the collector runs (or after manual trigger).
5. **Billing**: confirm invoice generation path works (often requires usage records + pricing config).
6. **Audit logs**: check that key actions generate audit events (see `server/services/audit.service.ts` and client hooks like `client/src/hooks/use-audit-logs.ts`).

---

## Troubleshooting checklist

- **DB errors**
  - Confirm `DATABASE_URL` is correct and DB is reachable.
  - Re-run `npm run db:push` after schema changes.
- **MinIO errors**
  - Confirm endpoint/port/SSL.
  - Check credentials and MinIO policy permissions.
- **Auth issues**
  - Confirm whether your environment expects Clerk, Replit auth, or another mode.
  - Check `client/src/lib/queryClient.ts` for token behavior and server auth setup in `server/replit_integrations/auth/*`.
- **Billing/cron not running**
  - Ensure cron jobs are started from `server/index.ts` or equivalent startup path.
  - Validate the scheduled intervals in `server/cron/usage-collector.ts`.

---
