# Tooling & Productivity Guide

This document describes the tooling, scripts, and configurations used in **PrimeCloudProV2**. It’s intended to help you set up a consistent local environment, run the project efficiently, and use the repository’s automation to speed up development and troubleshooting.

---

## What this repo uses (at a glance)

PrimeCloudProV2 is a full-stack TypeScript project with:

- **Client**: Vite + React (see `client/`)
- **Server**: Node.js + Express (see `server/`)
- **Database**: PostgreSQL managed via **Drizzle ORM** (schema in `shared/schema.ts`)
- **Object Storage**: **MinIO** (S3 compatible) via `server/services/minio.service.ts`
- **SFTP layer**: **SFTPGo** via `server/services/sftpgo.service.ts`
- **Scheduled jobs**: usage + billing cron in `server/cron/usage-collector.ts`
- **Automation scripts**: TypeScript scripts under `scripts/` and `script/`

Related docs:
- [Development Workflow](development-workflow.md)

---

## Required tooling

Install and configure the following to contribute effectively:

### Runtime & package management

- **Node.js v18+**
- **npm** (works) or **pnpm** (recommended for speed and disk efficiency)

### Core infrastructure

- **PostgreSQL**
  - Required for server startup and most workflows.
- **MinIO**
  - Used for S3-compatible bucket/object operations.
  - Recommended for local dev using Docker.
- **SFTPGo** (optional depending on what you work on)
  - Required for SFTP credential workflows, storage transfer features, or anything using `SftpGoService`.
- **Drizzle Kit**
  - CLI for schema/migrations and Drizzle workflows.

---

## Installation quick start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env with your local PostgreSQL / MinIO configuration
```

Tip: if you run MinIO/SFTPGo via Docker, ensure the host/port in `.env` match your container bindings.

---

## Development commands

These commands are typically defined in `package.json`. Use them as the standard entry points to build, run, and validate the project.

### Start the app in development mode

```bash
npm run dev
```

Expected behavior:
- Runs the **Vite dev server** for the client.
- Runs the **Express server** for the backend.
- Enables hot reloading where applicable.

Related files:
- Server entry: `server/index.ts`
- Vite integration: `server/vite.ts` (`setupVite`)
- Static serving (prod): `server/static.ts` (`serveStatic`)

### Production build

```bash
npm run build
```

This executes the full build pipeline, including the TypeScript build helper:

- `script/build.ts` (function: `buildAll`)

### Lint + typecheck

```bash
npm run check
```

Use this before pushing changes and especially before opening PRs. It’s also a good candidate for a pre-commit hook (see below).

---

## Database automation (Drizzle ORM)

The database schema is defined primarily in:

- `shared/schema.ts`

Common Drizzle Kit commands:

### Push schema changes directly (fast local iteration)

```bash
npx drizzle-kit push:pg
```

Use this for rapid prototyping in local/dev environments.

### Generate migration files

```bash
npx drizzle-kit generate:pg
```

Use this when you want a migration artifact that can be applied consistently across environments.

---

## Maintenance & utility scripts

The repo contains operational scripts in two locations:

- `scripts/` (general utilities / quick checks)
- `script/` (storage reconciliation and maintenance tasks)

Most scripts are TypeScript and can be run with `tsx`:

```bash
npx tsx path/to/script.ts
```

### Environment connectivity checks

#### Test MinIO connectivity

- File: `scripts/test-minio.ts` (`testConnection`)

```bash
npx tsx scripts/test-minio.ts
```

Use when:
- MinIO credentials are new/changed
- you suspect endpoint/SSL issues
- buckets aren’t listing/creating correctly

#### Test database connectivity

- File: `scripts/db_test.ts` (`run`)

```bash
npx tsx scripts/db_test.ts
```

Use when:
- server can’t start due to DB errors
- migrations/push fail unexpectedly

#### Validate environment mappings (module-specific)

- File: `scripts/check_imperius.ts` (`run`)

```bash
npx tsx scripts/check_imperius.ts
```

Use if your module relies on the “imperius” integration/config checks (when applicable to your environment).

---

## Storage reconciliation & repairs (MinIO + DB)

These scripts help reconcile the database’s bucket metadata with real MinIO state, and diagnose or repair inconsistencies.

### Sync buckets (basic reconciliation)

- File: `script/sync-minio-buckets.ts`
  - `getBucketStats`
  - `main`

```bash
npx tsx script/sync-minio-buckets.ts
```

Use when:
- buckets exist in MinIO but not in DB (or vice versa)
- you need high-level stats or state reconciliation

### Sync buckets (full / deeper scan)

- File: `script/sync-minio-buckets-full.ts`
  - `getBucketStatsFull`
  - `main`

```bash
npx tsx script/sync-minio-buckets-full.ts
```

Use when:
- you need more complete stats
- you suspect object-level drift or deeper inconsistencies

### Check bucket size / diagnose storage stats

- File: `script/check-bucket-size.ts` (`checkBucket`)

```bash
npx tsx script/check-bucket-size.ts
```

Use when:
- quota/usage numbers look wrong
- billing metrics don’t match expected storage usage

### Fix storage metadata inconsistencies

- File: `script/fix-storage.ts` (`main`)

```bash
npx tsx script/fix-storage.ts
```

Use when:
- previous migrations/scripts caused inconsistencies
- you want an automated repair attempt before manual intervention

### Migrate bucket data (maintenance)

- File: `script/migrate-bucket.ts` (`main`)

```bash
npx tsx script/migrate-bucket.ts
```

Use when:
- bucket structure or metadata model changed
- you need to move/normalize data as part of an ops task

Related runtime service:
- `server/services/minio.service.ts` (`MinioService`, config via `getMinioConfig`)

---

## Cron jobs (usage + billing)

Scheduled jobs live in:

- `server/cron/usage-collector.ts`

Key exported functions:
- `startCronJobs()`
- `stopCronJobs()`
- `triggerUsageCollection()`
- `triggerMonthlyBilling()`

### Manual cron triggering (development)

During development you may want to trigger usage/billing without waiting for schedules. Options:

- call `triggerUsageCollection()` / `triggerMonthlyBilling()` from a temporary dev-only route
- create a small `npx tsx` script that imports and invokes these functions

This is useful for debugging:
- MinIO usage collection (`collectUsageMetrics`)
- invoice generation (`runMonthlyBilling`)
- overdue reminders (`checkOverdueInvoices`)

---

## Bandwidth / usage testing utilities

### Reset bandwidth usage (testing)

- File: `server/scripts/zero-bandwidth.ts` (`run`)

```bash
npx tsx server/scripts/zero-bandwidth.ts
```

Use when:
- you need to reset usage metrics for testing billing flows
- you’re validating quota enforcement and want a clean baseline

---

## Pre-commit hooks (recommended)

To keep quality consistent, configure a pre-commit hook to run checks automatically:

```bash
echo "npm run check" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

If you use a hook manager (e.g., Husky), you can wire `npm run check` there instead; the goal is the same: prevent lint/type errors from being committed.

---

## IDE / editor setup (VS Code)

VS Code is recommended due to strong TypeScript + ESLint + Prettier support.

### Recommended extensions

- **ESLint**
- **Prettier**
- **Tailwind CSS IntelliSense**
- **PostgreSQL Explorer** (optional but useful)
- **Drizzle-related snippets/tools** (optional)

### Workspace settings

Add to `.vscode/settings.json` to enable format + ESLint fixes on save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  }
}
```

---

## Local emulators with Docker (recommended)

If you don’t want to install MinIO/SFTPGo natively, run them via Docker/Compose.

### MinIO compose snippet

```yaml
services:
  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
```

After starting MinIO, ensure `.env` matches:
- endpoint/host
- access key / secret key
- region (if required)
- SSL settings (if any)

---

## Terminal productivity aliases

Add to your shell config (`.zshrc`, `.bashrc`):

```bash
alias pcp-dev="npm run dev"
alias pcp-db="npx drizzle-kit studio"
alias pcp-sync="npx tsx script/sync-minio-buckets.ts"
```

---

## Cross-references (where to look in the code)

- **MinIO integration**: `server/services/minio.service.ts`
- **SFTPGo integration**: `server/services/sftpgo.service.ts`
- **Usage & billing cron**: `server/cron/usage-collector.ts`
- **Build pipeline**: `script/build.ts`
- **Server entry**: `server/index.ts`
- **Shared DB schema/types**: `shared/schema.ts`
- **Connectivity scripts**: `scripts/test-minio.ts`, `scripts/db_test.ts`

---
