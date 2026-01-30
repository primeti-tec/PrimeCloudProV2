# PrimeCloudProV2 Architecture

PrimeCloudProV2 is a **modular monolith** cloud management platform: a React (Vite) SPA frontend and a Node.js/Express backend, sharing a single TypeScript contract for models and API payloads. The backend orchestrates external infrastructure providers (MinIO, SFTPGo, SMTP, auth provider) via a service layer, persists state in a relational database (PostgreSQL via Drizzle), and runs scheduled jobs for usage collection and billing.

This document describes the **runtime components**, **layering**, **request/data flows**, and **key boundaries** used throughout the repository.

---

## 1) High-level system overview

### Main runtime components

- **Client (SPA)**
  - Location: `client/`
  - Stack: React + Vite, Tailwind UI, TanStack Query for server state.
  - Talks to server via REST-style API calls.

- **Server (API + static)**
  - Location: `server/`
  - Stack: Express.js.
  - Responsibilities:
    - Authentication & sessions
    - API routing and validation
    - Domain/business orchestration (billing, auditing, notifications)
    - Integrations with MinIO (S3) and SFTPGo
    - Background cron jobs for periodic tasks
    - Serves the built SPA assets in production

- **Shared Contract**
  - Location: `shared/`
  - Single source of truth for:
    - Domain models/types (e.g., `Account`, `Bucket`, `Invoice`)
    - Request DTOs (e.g., `CreateBucketRequest`)
    - Cross-tier schema validation/type safety

- **External dependencies**
  - **MinIO**: S3-compatible storage (buckets, objects, access keys, lifecycle, usage)
  - **SFTPGo**: SFTP user provisioning and folder mapping
  - **SMTP**: outgoing mail for notifications and billing reminders
  - **Auth provider (Replit integration / Clerk detected)**: identity, session/token handling

---

## 2) Repository layout and architectural layers

### Top-level directories (architecture-relevant)

- `client/src/pages/` — route-level screens (dashboard, buckets, billing, admin, etc.)
- `client/src/components/` — reusable UI components and layouts
- `client/src/hooks/` — data-fetching hooks (TanStack Query patterns)
- `client/src/lib/` — client utilities (request wrapper, formatting, helpers)

- `server/index.ts` — backend entry point
- `server/routes/` — API route handlers (HTTP layer)
- `server/services/` — business/domain services (core logic)
- `server/lib/` — server utilities (validation, helpers)
- `server/cron/` — scheduled/background tasks
- `server/replit_integrations/auth/` — auth/session integration modules
- `server/static.ts`, `server/vite.ts` — static + dev server integration

- `shared/schema.ts` — shared types and request payload definitions
- `shared/routes.ts` — route construction utilities such as `buildUrl`

- `scripts/`, `script/` — operational/migration tools (sync buckets, fix storage, etc.)

---

## 3) Layering model (how code is intended to be structured)

PrimeCloudProV2 follows a pragmatic layered approach:

### 3.1 Frontend/UI layer (React)

**Purpose**
- Provide screens, navigation, and UI state.
- Fetch and mutate server state via query hooks.

**Key conventions**
- Pages compose components and call hooks.
- Hooks encapsulate server communication patterns.

**Notable modules**
- `client/src/lib/queryClient.ts` — request wrapper exported as `apiRequest`
- `client/src/components/branding-provider.tsx` — `BrandingProvider` (React provider pattern)

### 3.2 API routes layer (Express)

**Purpose**
- Define the HTTP boundary:
  - Authentication enforcement (middleware)
  - Input validation
  - Mapping requests to service calls
  - Formatting consistent responses/errors

**Location**
- `server/routes/*`

**Example route module**
- `server/routes/smtp.ts` — exported handlers:
  - `handleConfigureSMTP`
  - `handleTestSMTP`

### 3.3 Services layer (domain orchestration)

**Purpose**
- Hold business logic and integration orchestration.
- Coordinate DB operations + external provider calls.
- Provide reusable operations to multiple routes and jobs.

**Location**
- `server/services/*`

**Key services (exported)**
- `AuditService` — `server/services/audit.service.ts`
- `BillingService` — `server/services/billing.service.ts`
- `MinioService` — `server/services/minio.service.ts`
- `SftpGoService` — `server/services/sftpgo.service.ts`
- `NotificationService` — `server/services/notification.service.ts`

**Design intent**
- Routes should be thin; services contain most domain logic.
- External dependencies are wrapped behind service/adapters.

### 3.4 Infrastructure adapters (external provider boundaries)

The system integrates with external systems through adapter-like services, keeping provider specifics out of routes/pages.

- **MinIO adapter**: `server/services/minio.service.ts`
  - Exported helpers/types: `MinioConfig`, `BucketInfo`, `getMinioConfig`, etc.
- **SFTPGo adapter**: `server/services/sftpgo.service.ts`
  - Exported types: `SftpGoConfig`, `SftpGoUser`, filesystem and folder mapping models
  - Utility: `generateSecurePassword`, availability checks

### 3.5 Shared schema / contract layer

**Purpose**
- Prevent contract drift between client and server.
- Centralize DTO definitions and domain types.

**Location**
- `shared/schema.ts` (core types such as `Account`, `Bucket`, `Invoice`, `UsageRecord`, plus `Create*Request` DTOs)

**Implication**
- Client code relies on these types for type-safe query/mutation results.
- Server uses them to validate and shape responses/requests consistently.

---

## 4) Multi-tenancy and system boundaries

### 4.1 Account isolation

The platform is multi-tenant. Isolation is centered around **AccountId** boundaries:

- DB records for resources (buckets, keys, invitations, invoices, logs) are scoped to an account.
- Provider-facing operations (MinIO/SFTPGo) must map resources to the correct account and prevent cross-account access.

**Practical guidance**
- When implementing new routes/services:
  - Always require/derive an `accountId` from authenticated context.
  - Filter queries by `accountId`.
  - Ensure provider operations include account-specific identifiers or checks.

### 4.2 Audit boundary

`AuditService` is treated as a **side-effect boundary**:

- Other services emit audit events without needing to know the storage details.
- This reduces coupling and makes audit logging consistent.

### 4.3 Contract enforcement boundary (shared schema)

`shared/schema.ts` is the core **contract boundary** between tiers:

- Prefer using shared types/DTOs for payloads instead of redefining types in client/server.
- API changes should be reflected here first to maintain consistency.

---

## 5) Key runtime flows

### 5.1 Typical UI → API → Service flow

1. A page or component calls a hook (TanStack Query).
2. The hook calls `apiRequest` to the server.
3. Express route handler authenticates and validates input.
4. Route invokes a domain service (e.g., `MinioService`, `BillingService`).
5. Service:
   - Reads/writes DB via Drizzle models
   - Calls external providers if needed
   - Emits audit logs and/or notifications
6. Response returns to the client; query cache updates.

**Client API helper**
- `client/src/lib/queryClient.ts` exports `apiRequest` (central place to standardize headers, auth token, error handling).

### 5.2 Scheduled jobs (usage and billing)

Background work is handled by cron-like processes.

- Location: `server/cron/usage-collector.ts`
- Key exported controls:
  - `startCronJobs`
  - `stopCronJobs`
  - `triggerUsageCollection`
  - `triggerMonthlyBilling`

**Responsibilities**
- Collect usage metrics for active accounts
- Check overdue invoices and send reminders
- Generate monthly invoices (previous month)

**Design choice**
- Usage is collected periodically (cron) rather than on every request to reduce latency and load, trading off near-real-time accuracy.

---

## 6) Important modules and cross-references

### Entry points

- **Backend server entry**
  - `server/index.ts`
  - Hosts the Express app and core initialization.
- **Frontend entry**
  - `client/src/main.tsx`
  - Mounts the React app and global providers.
- **Cron entry**
  - `server/cron/usage-collector.ts`
  - Defines and runs recurring tasks.
- **Schema**
  - `shared/schema.ts`
  - Shared domain model and request DTOs.

### Auth integration

- `server/replit_integrations/auth/replitAuth.ts`
  - Exports `setupAuth`, `getSession`
- `server/replit_integrations/auth/routes.ts`
  - Exports `registerAuthRoutes`
- `server/replit_integrations/auth/storage.ts`
  - Defines `IAuthStorage` and `AuthStorage`

Client token helper detected:
- `client/src/lib/queryClient.ts` includes `getClerkToken` usage, implying a client-side token acquisition step used by `apiRequest`.

### Routing utilities

- `shared/routes.ts` exports `buildUrl`
  - Intended to centralize URL construction to avoid hardcoding paths.

---

## 7) Design patterns used (where to look)

| Pattern | Where | Why it matters |
|---|---|---|
| Service Pattern | `server/services/` | Keeps business logic out of routes; improves reuse and testability. |
| Adapter Pattern | `MinioService`, `SftpGoService` | Encapsulates provider SDK/API quirks behind internal methods/types. |
| Middleware / Integration Modules | `server/replit_integrations/auth/` | Centralizes cross-cutting auth/session logic. |
| Shared Contract | `shared/schema.ts` | Minimizes contract drift between client and server. |
| Provider Pattern (React) | `client/src/components/branding-provider.tsx` | Centralizes app-wide UI configuration/state. |

---

## 8) Operational scripts (maintenance & migrations)

The repository includes scripts for syncing and maintenance:

- `script/sync-minio-buckets.ts`, `script/sync-minio-buckets-full.ts` — compute bucket stats and reconcile state
- `script/migrate-bucket.ts`, `script/fix-storage.ts` — migration and remediation tasks
- `script/check-bucket-size.ts` — validation/inspection utilities
- `scripts/test-minio.ts` — connectivity checks
- `scripts/db_test.ts` — database connectivity/queries

These scripts are useful for operations and troubleshooting, and they also serve as **reference implementations** for interacting with services and providers outside the HTTP request cycle.

---

## 9) Development guidance (how to extend the architecture safely)

### Adding a new feature end-to-end

1. **Define/extend shared types**
   - Update `shared/schema.ts` with any new DTOs or response shapes.
2. **Implement service logic**
   - Add or extend a class in `server/services/`.
   - Keep provider calls and DB mutations here.
3. **Expose via routes**
   - Create/extend a module in `server/routes/`.
   - Validate inputs and call the service.
4. **Add client hook**
   - Create a hook in `client/src/hooks/` calling `apiRequest`.
5. **Build UI**
   - Add a page in `client/src/pages/` and/or components in `client/src/components/`.

### Rules of thumb

- Do not call provider SDKs directly from routes; go through services/adapters.
- Keep account scoping explicit in service methods.
- Emit audit logs for security-sensitive or billing-relevant actions via `AuditService`.
- Prefer shared DTOs from `shared/schema.ts` for payloads.

---

## 10) Related documentation and artifacts

- **Project overview**: `docs/project-overview.md`
- **Data flow**: `docs/data-flow.md`
- **Codebase map / symbol graph**: `docs/codebase-map.json`

These documents complement this architecture overview with functional and flow-specific details.
