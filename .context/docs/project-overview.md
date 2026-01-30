# Project Overview — PrimeCloudProV2

PrimeCloudProV2 is a unified cloud infrastructure management platform designed to simplify how organizations provision, monitor, and bill for digital resources. It centralizes common operational needs—S3-compatible storage (MinIO), VPS orchestration, and secure file transfer (SFTP)—behind a single web dashboard and API.

For full symbol counts, dependency graphs, and a complete export index, see [`docs/codebase-map.json`](./codebase-map.json).

---

## Quick Facts

- **Repository root**: `D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2`
- **Primary languages**: TypeScript (frontend + backend)
- **Primary runtime**: Node.js
- **Main entry points**
  - **Server**: [`server/index.ts`](../server/index.ts)
  - **Client**: [`client/src/main.tsx`](../client/src/main.tsx)
  - **Shared schema/types**: [`shared/schema.ts`](../shared/schema.ts)
  - **Cron/Background jobs**: [`server/cron/usage-collector.ts`](../server/cron/usage-collector.ts)

---

## What the Platform Does

PrimeCloudProV2 focuses on operational workflows typically spread across multiple tools:

- **Storage management (S3/MinIO)**
  - Buckets, objects, usage metrics, lifecycle rules, quotas
  - Account-level bucket visibility and permissions
- **Billing**
  - Usage collection and aggregation
  - Pricing configuration + invoice generation
  - Overdue invoice reminders
- **SFTP user provisioning (SftpGo)**
  - Automated creation/management of SFTP users
  - Virtual folder mappings
- **Audit + Notifications**
  - System-wide audit logs for traceability/compliance
  - Notification delivery (UI/system events, and optionally external channels depending on configuration)

---

## Architecture at a Glance

The codebase follows a service-oriented, layered architecture:

- **Client (React)**: UI, routes/pages, hooks (TanStack Query), and reusable components.
- **Server (Express)**: REST API endpoints, business logic, and integrations (MinIO, SftpGo, billing, etc.).
- **Shared**: Types, validation schemas, and route constants used by both client and server.

### Layer Responsibilities

- **Models / Schema** (`shared/`, `shared/models/`)
  - The “source of truth” for types and validation.
  - Shared Zod schemas + Drizzle ORM schema definitions.
- **Controllers / Routes** (`server/routes/`, plus route usage in UI pages/hooks)
  - HTTP concerns: request parsing, auth/session usage, response handling.
- **Services** (`server/services/`)
  - Business logic and integrations (MinIO, SftpGo, billing, notifications, audits).
- **Utils / Libraries** (`server/lib/`, `client/src/lib/`)
  - Shared helpers (validation, API client, formatting utilities).
- **Components** (`client/src/components/`)
  - UI primitives and feature-specific UI modules.

---

## Key Entry Points (What Boots the App)

### Server: `server/index.ts`
The main Express application. Typically responsible for:

- Registering routes and middleware
- Wiring development tooling (Vite HMR via server-side integration)
- Serving static assets in production
- Logging and server lifecycle startup

Related:
- Vite integration: [`server/vite.ts`](../server/vite.ts) (`setupVite`)
- Static serving: [`server/static.ts`](../server/static.ts) (`serveStatic`)

### Client: `client/src/main.tsx`
The React entry point. Typically responsible for:

- Rendering the root app
- Wiring providers (query client, theming/branding, router, auth)
- Defining global UI infrastructure (toasts, layouts)

Related:
- API client helper used by hooks: [`client/src/lib/queryClient.ts`](../client/src/lib/queryClient.ts) (`apiRequest`)
- Common utilities: [`client/src/lib/utils.ts`](../client/src/lib/utils.ts) (`cn`)

### Shared Schema: `shared/schema.ts`
The shared “contract” across the stack:

- Database schema/type definitions (Drizzle)
- Request/response models and Zod validation
- Shared domain types like `Account`, `Bucket`, `Invoice`, `UsageRecord`, etc.

Also see:
- Route building/utilities: [`shared/routes.ts`](../shared/routes.ts) (`buildUrl`)

### Background Jobs: `server/cron/usage-collector.ts`
Manages recurring operational tasks:

- Usage collection (storage metrics)
- Monthly billing/invoice generation
- Overdue invoice checks/reminders

Exports and controls:
- `startCronJobs`, `stopCronJobs`
- Manual triggers: `triggerUsageCollection`, `triggerMonthlyBilling`

---

## Major Services (Backend “Business Logic”)

These service classes are the primary backend integration points and are the best place to start when you need to understand system behavior.

### `MinioService` — Storage (Buckets, Objects, Metrics)
File: [`server/services/minio.service.ts`](../server/services/minio.service.ts)

Responsibilities typically include:

- Connecting to MinIO (S3-compatible API)
- Bucket creation, listing, deletion
- Object listing, tagging, sharing, favorites (as reflected by shared types)
- Metrics collection for usage/billing (bucket stats, object stats, totals)
- Lifecycle/retention rules and quota enforcement (where supported)

Related scripts:
- [`script/sync-minio-buckets.ts`](../script/sync-minio-buckets.ts)
- [`script/sync-minio-buckets-full.ts`](../script/sync-minio-buckets-full.ts)
- [`scripts/test-minio.ts`](../scripts/test-minio.ts)

### `BillingService` — Pricing, Usage, Invoices
File: [`server/services/billing.service.ts`](../server/services/billing.service.ts)

Responsibilities typically include:

- Pricing configuration management
- Translating usage metrics into billable usage summaries
- Invoice generation and invoice line calculations
- Supporting monthly billing cycles (cron-driven)

Closely related:
- Billing cron orchestration: [`server/cron/usage-collector.ts`](../server/cron/usage-collector.ts)

### `SftpGoService` — SFTP Provisioning
File: [`server/services/sftpgo.service.ts`](../server/services/sftpgo.service.ts)

Responsibilities typically include:

- Validating SftpGo availability/config
- Creating/managing SftpGo users
- Managing virtual folders (mappings to storage locations)
- Generating secure credentials (see `generateSecurePassword`)

### `AuditService` — Audit Trails & Compliance Logging
File: [`server/services/audit.service.ts`](../server/services/audit.service.ts)

Responsibilities typically include:

- Recording security- and operations-relevant events
- Maintaining consistent audit payloads and severities
- Supporting UI retrieval via hooks (see client hooks)

### `NotificationService` — System Notifications
File: [`server/services/notification.service.ts`](../server/services/notification.service.ts)

Responsibilities typically include:

- Creating and dispatching notifications
- Integrating with UI indicators (bell, toasts) and/or external delivery depending on configuration

---

## Frontend Structure (React)

Location: `client/src/`

### Pages
`client/src/pages/` contains top-level route components (dashboard screens, admin screens, billing screens, etc.). These typically:

- Compose feature components
- Call hooks to fetch data / mutate state
- Handle routing transitions and user flows

Example reference:
- [`client/src/pages/Dashboard.tsx`](../client/src/pages/Dashboard.tsx)

### Hooks (Data Fetching & Server State)
`client/src/hooks/` wraps API endpoints in typed hooks—most likely TanStack Query patterns:

- Fetching lists (buckets, invoices, audit logs)
- Mutations (create bucket, invite member, generate key)
- Normalized caching and invalidation

Examples:
- Audit logs hook: [`client/src/hooks/use-audit-logs.ts`](../client/src/hooks/use-audit-logs.ts)
- Bucket hooks: [`client/src/hooks/use-buckets.ts`](../client/src/hooks/use-buckets.ts)
- Admin views: [`client/src/hooks/use-admin-buckets.ts`](../client/src/hooks/use-admin-buckets.ts)

### Components & UI System
`client/src/components/` contains:

- Feature components (admin, billing, layout, settings, etc.)
- `ui/` primitives (shadcn/ui-style components)
- Shared UX infrastructure (sidebar, notifications bell, toasts)

Examples:
- Branding provider: [`client/src/components/branding-provider.tsx`](../client/src/components/branding-provider.tsx)
- Toast system: [`client/src/hooks/use-toast.ts`](../client/src/hooks/use-toast.ts)

---

## Shared Types, Requests, and Route Conventions

The `shared/` package defines the canonical domain model:

- Core entities: `Account`, `Bucket`, `AccessKey`, `Invoice`, `UsageRecord`, `AuditLog`, etc.
- Request payload types (e.g., `CreateBucketRequest`, `CreateInvoiceRequest`)
- Enums/roles: `AccountRole`, etc.

The goal is end-to-end type consistency:
- Server validates inputs using shared schemas
- Client uses the same types to build forms and interpret responses

Route utilities:
- [`shared/routes.ts`](../shared/routes.ts) contains route definitions and `buildUrl`, used to avoid route string duplication.

---

## Scripts and Operational Tooling

The repository includes scripts for maintenance and verification:

- **MinIO connectivity**: [`scripts/test-minio.ts`](../scripts/test-minio.ts)
- **Database checks**: [`scripts/db_test.ts`](../scripts/db_test.ts)
- **Storage synchronization**:
  - [`script/sync-minio-buckets.ts`](../script/sync-minio-buckets.ts)
  - [`script/sync-minio-buckets-full.ts`](../script/sync-minio-buckets-full.ts)
- **Bucket maintenance/migration**:
  - [`script/migrate-bucket.ts`](../script/migrate-bucket.ts)
  - [`script/fix-storage.ts`](../script/fix-storage.ts)
  - [`script/check-bucket-size.ts`](../script/check-bucket-size.ts)

These are useful for diagnosing inconsistencies between persisted metadata and actual MinIO state.

---

## Local Development (Getting Started)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Create/configure a `.env` with credentials for:
     - Database
     - MinIO/S3 endpoint and keys
     - SftpGo endpoint/admin credentials (if using SFTP features)
     - Any billing/mail/SMPP settings used in your deployment

3. **Verify infrastructure connectivity**
   - MinIO:
     ```bash
     node scripts/test-minio.ts
     ```
   - Database:
     ```bash
     node scripts/db_test.ts
     ```

4. **Run development mode**
   ```bash
   npm run dev
   ```
   This typically starts:
   - Express backend
   - Vite dev server (HMR) integrated via `server/vite.ts`

5. **Explore API surface**
   - Start with shared route definitions:
     - [`shared/routes.ts`](../shared/routes.ts)

---

## Where to Go Next

- **Architecture deep dive**: [`docs/architecture.md`](./architecture.md)
- **Development workflow**: [`docs/development-workflow.md`](./development-workflow.md)
- **Tooling and scripts**: [`docs/tooling.md`](./tooling.md)
- **Full symbol & dependency map**: [`docs/codebase-map.json`](./codebase-map.json)
