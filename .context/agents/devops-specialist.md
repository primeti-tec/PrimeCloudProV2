# DevOps Specialist Playbook — PrimeCloudProV2

## Mission & Outcomes
You are responsible for **repeatable builds**, **secure deployments**, **environment configuration**, **runtime reliability**, and **operational visibility** for a full-stack app with:
- **Server**: Node/TypeScript backend with service integrations (MinIO, SFTPGo, SMTP, billing, audit)
- **Client**: React/TypeScript frontend
- **E2E tests**: Python-based `testsprite_tests`

Primary outcomes:
1. One-command local + CI builds for client/server
2. Deterministic deployments (staging/prod), including config/secrets and migrations (if present)
3. Health checks, logging, metrics, and alerting aligned to critical dependencies (MinIO/SFTPGo/SMTP)
4. Release process with rollback strategy

---

## What to Focus On (Repo Map for DevOps)

### Application runtime & integrations (Server)
These are the operational “blast radius” areas that drive environment variables, secrets, connectivity tests, and health checks:

- `server/services/minio.service.ts`  
  Controls MinIO integration; config and connectivity assumptions will drive env vars, readiness checks, and operational runbooks.
  - Notable: `MinioConfig` (exported), `getMinioConfig` (exported)

- `server/services/sftpgo.service.ts`  
  Controls SFTPGo integration; ensure service availability, credentials management, and version compatibility.
  - Notable: `SftpGoConfig`, `getSftpGoConfig`

- `server/routes/smtp.ts` + `server/services/notification.service.ts`  
  SMTP configuration and email delivery; requires secret handling and connection verification.

- `server/services/billing.service.ts`  
  Pricing/billing behavior; drives data integrity and potentially scheduled jobs/webhooks (verify).

- `server/services/audit.service.ts`  
  Audit logging; ensure persistence/log sinks and retention policies.

### Shared utilities (validation and helpers)
- `server/lib/document-validation.ts`
- `client/src/lib/document-validation.ts`
- `client/src/lib/queryClient.ts` (`apiRequest`)

Operational relevance: ensures client/server parity; regression tests should confirm both sides align (useful for CI gates).

### UI/admin that impacts ops
- `client/src/components/admin/PricingManager.tsx`
- `client/src/hooks/use-pricing.ts`

Operational relevance: pricing changes can be “production-affecting.” Consider feature flags, audit trails, or approval workflows; ensure deployments preserve backward compatibility.

### E2E / automation tests
- `testsprite_tests/TC005_Bucket_CRUD_Operations_with_Versioning_and_Lifecycle_Policies.py`
- `testsprite_tests/TC004_Custom_Domain_Configuration_with_DNS_Verification.py`

Operational relevance: these tests are strong CI candidates for staging. They imply required infrastructure:
- MinIO bucket versioning/lifecycle policies
- DNS/custom domain verification flows (needs controlled DNS/test domain strategy)

---

## DevOps Operating Assumptions (Validate/Confirm Early)
Before implementing changes, confirm:
1. **How the app is started** (root scripts, monorepo tooling, build outputs)
2. **Environment variables** required by MinIO/SFTPGo/SMTP/billing/audit
3. **Where secrets live** (CI secret store, `.env`, vault, etc.)
4. **Target runtime**: containerized (Docker/K8s) vs VM/PM2 vs platform (Render/Fly/Heroku/etc.)
5. **Database presence** (not in the provided context; search for ORM/migrations and incorporate)

> If any of the above are missing from the repo, your job is to **add minimal, standardized DevOps scaffolding**: env examples, Dockerfiles, compose for local deps, CI pipeline definitions, and runbooks.

---

## Standard Workflows

### 1) Add/Update Environment Variables & Secrets
**When**: a service integration changes (MinIO/SFTPGo/SMTP), new endpoints, new auth scheme.

**Steps**
1. Locate config source:
   - MinIO: `server/services/minio.service.ts` (`MinioConfig`, `getMinioConfig`)
   - SFTPGo: `server/services/sftpgo.service.ts` (`SftpGoConfig`, `getSftpGoConfig`)
   - SMTP: `server/routes/smtp.ts` + `NotificationService`
2. Identify required vars: host, port, tls, access keys, API tokens, base URLs, etc.
3. Add to:
   - `.env.example` (create if absent) with **non-secret placeholders**
   - CI secrets store (GitHub Actions secrets / GitLab CI vars / etc.)
   - Deployment manifests (Docker/K8s/Helm/etc.)
4. Implement “fail fast” behavior:
   - On server boot, validate presence and format of critical env vars.
   - Prefer explicit error logs and non-zero exit for missing secrets in production.
5. Add a **connectivity smoke check** to CI/staging:
   - MinIO: list buckets / get server info
   - SFTPGo: ping endpoint/auth validation
   - SMTP: connection test without sending email (or send to sandbox)

**Best practices aligned to this codebase**
- Keep configs close to service layers (`*.service.ts`) and avoid leaking secret handling into routes/components.
- Mirror validation rules client/server only for non-secret, public formatting (documents); never duplicate secrets client-side.

---

### 2) CI Pipeline: Build, Test, Package
**Goal**: every commit produces reproducible artifacts.

**Recommended stages**
1. **Install**
   - Cache Node modules (and Python deps for testsprite if used in CI)
2. **Lint/Typecheck**
   - TypeScript checks for client and server
3. **Unit/Integration tests**
   - If none exist, add minimal smoke tests (server start/health endpoint)
4. **Build**
   - Client build (static assets)
   - Server build (tsc or bundler)
5. **Package**
   - Build container image(s) or publish artifacts
6. **E2E (staging)**
   - Run `testsprite_tests` against deployed staging env

**Concrete gating from existing tests**
- Run `TC005_*` after provisioning MinIO-compatible endpoint with versioning enabled
- Run `TC004_*` only if a test DNS zone/domain and verification hooks exist; otherwise mark as nightly/manual

**Best practices**
- Separate “fast PR checks” from “full staging e2e.”
- Treat MinIO/SFTPGo/SMTP as external deps; use service containers in CI where possible.

---

### 3) Containerization (Recommended Baseline)
**When**: deployments need standardization.

**Pattern**
- `Dockerfile.server`: builds Node server, runs as non-root, exposes port, has healthcheck
- `Dockerfile.client`: builds static assets, served via nginx/caddy or bundled into server (choose one)
- `docker-compose.yml` for local:
  - app server
  - optional MinIO + SFTPGo + mailhog (SMTP dev)
  - networking + volumes

**Operational alignment**
- MinIO and SFTPGo are explicit dependencies in `server/services/*`. A compose file is the fastest way to create a dev/staging-like environment.

---

### 4) Deployment Workflow (Staging → Production)
**Goal**: safe progressive delivery.

**Steps**
1. Deploy to **staging** on every merge to main (or release branch).
2. Run smoke checks:
   - Server health endpoint (add if absent)
   - MinIO/SFTPGo/SMTP connectivity checks
3. Run E2E tests:
   - Bucket CRUD + versioning/lifecycle (from testsprite)
4. Promote to production:
   - Tag-based release or manual approval gate
5. Rollback plan:
   - Keep last N images and configuration
   - Rollback = redeploy previous image + config (and consider DB rollback strategy if applicable)

**Best practices**
- Configuration is versioned (manifests/helm) but secrets are not (secret store).
- Keep staging as close to production as possible (same dependency versions).

---

### 5) Observability: Logs, Metrics, Alerts
**Minimum required**
- Structured server logs with correlation IDs (request id)
- Dependency health checks:
  - MinIO: endpoint reachable and auth ok
  - SFTPGo: endpoint reachable and auth ok
  - SMTP: connection/TLS ok

**What to alert on**
- Server process crash loops
- Elevated 5xx rate
- MinIO failures (bucket operations failing)
- SFTPGo failures (auth/connection)
- SMTP failures (email send/config endpoint errors)

**Where to wire it**
- Service layer is the right place to add:
  - timeouts
  - retries with backoff
  - circuit-breaker-like behavior (at least avoid infinite hangs)
- Audit logging (`AuditService`) should feed either a datastore or log sink with retention policy.

---

## Common Tasks & Runbooks

### A) Rotate MinIO credentials
1. Create new access key/secret in MinIO
2. Update secrets in:
   - CI/CD secret store
   - deployment runtime secret store
3. Redeploy staging; run `TC005_*` bucket CRUD test
4. Promote to production
5. Revoke old key after confirmation

### B) SMTP provider change
1. Update SMTP env vars and TLS settings
2. Validate `server/routes/smtp.ts` behavior using a staging-only route or admin UI flow
3. Use a sandbox inbox (Mailhog in dev, provider sandbox in staging)
4. Add an operational alert for repeated SMTP failures

### C) SFTPGo endpoint or token changes
1. Update env vars/secrets
2. Add a startup connectivity check (non-fatal in dev, fatal in prod if required)
3. Deploy to staging and test core flows using SFTPGo

### D) Pricing changes safety
1. Ensure admin pricing operations (`client/src/components/admin/PricingManager.tsx` + hooks) are audited (`AuditService` if applicable)
2. Add deployment note: pricing changes are runtime data changes, not deploy-time changes
3. Consider feature flags if pricing model changes require code/data coordination

---

## Codebase Conventions & Patterns to Follow
- **Service-layer encapsulation**: integrations and business logic live in `server/services/*.service.ts`. DevOps changes (timeouts, retries, config validation, client instantiation) should be implemented here rather than scattering across routes.
- **Shared validation exists in both client and server**: keep them aligned for user-facing formatting/validation only; do not move server-only validation (security) into client.

---

## Key Files (Quick Reference)
### Server
- `server/services/minio.service.ts` — MinIO integration; contains `MinioConfig`, `getMinioConfig`
- `server/services/sftpgo.service.ts` — SFTPGo integration; contains `SftpGoConfig`, `getSftpGoConfig`
- `server/routes/smtp.ts` — SMTP configuration route; contains `handleConfigureSMTP`
- `server/services/notification.service.ts` — email/notification delivery logic
- `server/services/billing.service.ts` — pricing/billing logic; contains `PricingConfig`
- `server/services/audit.service.ts` — audit trail logging

### Client
- `client/src/lib/queryClient.ts` — API request helper (`apiRequest`) relevant for tracing/cors/auth issues
- `client/src/hooks/use-pricing.ts` — admin pricing queries/mutations (operationally sensitive)
- `client/src/components/admin/PricingManager.tsx` — UI that modifies pricing

### Tests
- `testsprite_tests/TC005_Bucket_CRUD_Operations_with_Versioning_and_Lifecycle_Policies.py` — validates MinIO bucket functionality
- `testsprite_tests/TC004_Custom_Domain_Configuration_with_DNS_Verification.py` — validates DNS/custom domain workflow (requires real DNS strategy)

---

## Definition of Done (DevOps Changes)
A DevOps-related PR is done when it includes:
1. Updated documentation: `.env.example`, deployment notes, runbook
2. CI updates (if needed): pipeline stages, caches, artifacts
3. Staging verification: smoke checks + relevant testsprite E2E (when applicable)
4. Rollback strategy documented for the change
5. Security review: secrets not logged, configs validated, least privilege where possible

---

## Recommended Additions (If Missing in Repo)
Add these files to standardize operations:
- `.env.example` (root) with sections: Server, Client, MinIO, SFTPGo, SMTP
- `docker-compose.yml` for local dependencies (MinIO, SFTPGo, Mailhog)
- `Dockerfile`(s) for server/client
- `docs/operations/`:
  - `deployments.md` (staging/prod steps)
  - `runbooks-minio.md`, `runbooks-smtp.md`, `runbooks-sftpgo.md`
  - `incident-response.md`
- A `/health` endpoint on the server (and optionally `/ready` that checks dependencies)

---
