# Project Structure (PrimeCloudProV2)

This document explains how the PrimeCloudProV2 repository is organized and how the main layers (shared → server → client) fit together. It’s intended to help developers quickly find the right place to implement features, fix bugs, and add tests.

---

## At a glance

PrimeCloudProV2 is a full-stack TypeScript project with a **shared core** used by both backend and frontend for consistent types and validation.

**Three main areas:**

- **`client/`** — React + Vite frontend (UI, hooks, pages).
- **`server/`** — Node.js + Express backend (routes, services, cron jobs).
- **`shared/`** — shared schemas/types/routes used by both layers (single source of truth).

---

## Repository directory map

### Root-level directories

- **`client/`**
  - Frontend application (React, component library, feature pages, hooks)
- **`server/`**
  - Backend API + background jobs (Express routes, service layer)
- **`shared/`**
  - Shared database schema definitions, Zod types, route helpers
- **`migrations/`**
  - Database schema migration files (Drizzle migrations)
- **`script/`** and **`scripts/`**
  - Maintenance, migration, and diagnostic scripts
  - Note: both folders exist; check both when looking for operational tooling
- **`tests/`**
  - Test suites (notably components)
- **`testsprite_tests/`**
  - Additional test suite structure (also contains components/controllers/services/repositories patterns)

---

## Architectural layers and responsibilities

### 1) Shared layer (`shared/`)

The shared layer exists to keep the backend and frontend in sync: entity shapes, request payloads, validation, and route building are all centralized here.

**Key files**

- **`shared/schema.ts`**
  - The primary “source of truth” for domain entities.
  - Defines Drizzle ORM schema and exported types for entities such as:
    - `Account`, `Bucket`, `AccessKey`, `AuditLog`, `Invoice`, `UsageRecord`, `QuotaRequest`, etc.
  - Also defines request types like `CreateBucketRequest`, `CreateAccessKeyRequest`, etc.
- **`shared/routes.ts`**
  - Central route definitions and helpers
  - Exposes utilities like `buildUrl()` to generate consistent URLs across client and server

**Why this matters**
- When you change a domain model, you usually start here—then update server services/routes and client hooks/UI.

---

### 2) Backend layer (`server/`)

The backend generally follows a **Service → Routes** style:
- **Services** encapsulate business logic and integrations.
- **Routes** expose API endpoints and orchestrate service calls.
- **Cron** handles scheduled/background tasks.

#### `server/services/` (business logic)

Primary service modules include:

- **`server/services/minio.service.ts`**
  - S3-compatible storage operations (MinIO)
  - Defines `MinioService` and related types like `BucketInfo`, `StorageQuota`, etc.
  - Also exports config helper `getMinioConfig()`
- **`server/services/billing.service.ts`**
  - Invoicing, pricing configuration, usage summaries
  - Main class: `BillingService`
- **`server/services/audit.service.ts`**
  - Audit logging and security/compliance events
  - Main class: `AuditService`
  - Uses types like `AuditDetails`, `AuditContext`, and severity classification
- **`server/services/notification.service.ts`**
  - Notification dispatch and payload shaping
  - Main class: `NotificationService`
- **`server/services/sftpgo.service.ts`**
  - SFTPGo integration and user management
  - Main class: `SftpGoService`

#### `server/routes/` (HTTP API endpoints)

Routes define REST endpoints that call the service layer. Example route module:

- **`server/routes/smtp.ts`**
  - SMTP configuration and connectivity verification handlers:
    - `handleConfigureSMTP`
    - `handleTestSMTP`

#### `server/cron/` (background tasks)

- **`server/cron/usage-collector.ts`**
  - Automated usage collection and billing cycle tasks, including:
    - `collectUsageMetrics` — collects account usage
    - `checkOverdueInvoices` — checks for overdue invoices and triggers reminders
    - `runMonthlyBilling` — generates monthly invoices
    - `startCronJobs`, `stopCronJobs`
    - `triggerUsageCollection`, `triggerMonthlyBilling` — manual triggers

#### `server/replit_integrations/auth/` (authentication integration)

Authentication integration and session storage:

- `routes.ts` — `registerAuthRoutes`
- `replitAuth.ts` — `setupAuth`, session handling (`getSession`, etc.)
- `storage.ts` — defines `IAuthStorage` and internal `AuthStorage`

#### `server/lib/` (server utilities)

Shared backend-only utilities such as:

- `server/lib/document-validation.ts`
  - `isValidCPF`, `isValidCNPJ`, `validateDocument`

#### Backend entry + Vite integration

- **`server/index.ts`**
  - Backend entrypoint
  - Exposes helper `log()` (used across the server)
- **`server/vite.ts`**
  - Vite-related server setup (`setupVite`)
- **`server/static.ts`**
  - Static content serving (`serveStatic`)

---

### 3) Frontend layer (`client/src/`)

The frontend is a React application structured by **pages**, **components**, **hooks**, and **lib** utilities.

#### `client/src/pages/` (route-level screens)

Top-level pages correspond to routes (e.g., dashboards, admin, storage, billing, team).

Example:
- `client/src/pages/Dashboard.tsx` exports `Dashboard`

#### `client/src/components/` (UI building blocks)

Component organization typically includes:

- **`client/src/components/ui/`**
  - Reusable, low-level design system components (e.g., `button.tsx`, `badge.tsx`, `calendar.tsx`)
- **`client/src/components/layout/`**
  - Structural layout components (e.g., `DashboardLayout.tsx`, `Sidebar` usage)
- **Feature groups**
  - `admin/`, `billing/`, `settings/` etc. for feature-focused components
- **Branding**
  - `client/src/components/branding-provider.tsx` exports `BrandingProvider`

#### `client/src/hooks/` (data fetching + state orchestration)

Hooks provide the primary interface for interacting with the API and managing query/mutation state.

Examples:
- `use-buckets.ts` — storage objects listing and bucket operations
- `use-billing.ts` — billing and usage data
- `use-audit-logs.ts` — audit log retrieval and filtering
- `use-admin-buckets.ts`, `use-admin-invoices.ts` — admin-focused data

#### `client/src/lib/` (frontend utilities)

- `client/src/lib/queryClient.ts`
  - `apiRequest()` — the standard client API call helper
  - Token and response helpers (`getClerkToken`, `throwIfResNotOk`)
- `client/src/lib/utils.ts`
  - `cn()` — className utility
- `client/src/lib/document-validation.ts`
  - Client-side versions for formatting/validation: `isValidCPF`, `isValidCNPJ`, `formatCPF`, `formatCNPJ`

---

## Common feature verticals (cross-cutting modules)

### Storage (MinIO / S3)

**Backend**
- `server/services/minio.service.ts` — bucket/object operations, quotas, lifecycle rules

**Operational scripts**
- `script/sync-minio-buckets.ts` — bucket synchronization
- `script/sync-minio-buckets-full.ts` — full stats/sync variant
- `scripts/test-minio.ts` — connectivity testing

**Frontend**
- `client/src/hooks/use-buckets.ts` — primary client interface to storage features

---

### Billing & usage

**Backend**
- `server/services/billing.service.ts` — invoice/pricing logic
- `server/cron/usage-collector.ts` — automated usage collection and monthly billing

**Frontend**
- `client/src/hooks/use-billing.ts` — usage summaries, invoices, usage records

---

### Audit logging

**Backend**
- `server/services/audit.service.ts` — central audit logging

**Frontend**
- `client/src/hooks/use-audit-logs.ts` — query audit log records and filter

---

### Authentication & multi-tenancy

**Auth integration**
- `server/replit_integrations/auth/*` — session + route registration

**RBAC / account membership**
- Roles and membership types are defined in `shared/schema.ts` (e.g., `AccountRole`, `AccountMember`, `AccountWithRole`)

---

## Conventions and expected data flow

### Recommended flow for implementing a new feature

1. **Define/extend data model**
   - Update `shared/schema.ts` (tables, types, request shapes)
2. **Implement backend business logic**
   - Add or update a service in `server/services/`
3. **Expose API endpoints**
   - Add/update route handlers in `server/routes/`
4. **Consume API from frontend**
   - Create/update hook(s) in `client/src/hooks/` using `apiRequest()` (`client/src/lib/queryClient.ts`)
5. **Build UI**
   - Add components under `client/src/components/` and page-level integration under `client/src/pages/`

This structure keeps the “rules” in services, the “transport” in routes, and the “rendering/state” in the client.

---

## Scripts, migrations, and operational tooling

### Database migrations

- **`migrations/`**
  - Drizzle migration output
  - When changing `shared/schema.ts`, migrations typically need to be generated and applied

### Operational scripts

- **`script/` and `scripts/`**
  - Infrastructure diagnostics, maintenance, and one-off migrations
  - Examples:
    - `scripts/db_test.ts` — database connectivity testing
    - `script/migrate-bucket.ts` — bucket migration utility
    - `script/fix-storage.ts` — storage repair/normalization tasks
    - `script/check-bucket-size.ts` — bucket size checks

---

## Where to look: quick navigation

- “What is the shape of X?” → `shared/schema.ts`
- “What URL should the client call?” → `shared/routes.ts` and/or frontend hooks
- “Where is the business logic for X?” → `server/services/*`
- “Where is the endpoint for X?” → `server/routes/*`
- “Why did an invoice get generated?” → `server/cron/usage-collector.ts` + `server/services/billing.service.ts`
- “How does the UI fetch X?” → `client/src/hooks/*`
- “Which component renders X?” → `client/src/components/*` and `client/src/pages/*`

---

## Related documentation

- `docs/qa/` — QA and developer documentation hub (this file belongs here)
- Consider documenting feature-specific flows (storage, billing, audit) as separate pages and linking them from this overview
