# Feature-Developer Agent Playbook — PrimeCloudProV2

## Mission
Deliver end-to-end product features (UI + API + services + shared types) in **PrimeCloudProV2** with minimal regressions by:
- Extending **shared schema/types** first (single source of truth),
- Implementing **service-layer** business logic on the server,
- Exposing functionality via **routes/controllers**,
- Building/adjusting **client pages/components**,
- Adding/refreshing **tests** (including existing `testsprite_tests` API validation/perf checks where applicable).

---

## Repository Map (Where to Work)

### 1) Shared Contracts (Types, schemas, routes)
**Primary focus for feature work**: define/extend data contracts here so both client and server stay aligned.
- `shared/schema.ts`  
  Exports core domain models (examples already present):
  - `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`
- `shared/routes.ts`
  - `buildUrl` (exported) used to construct/standardize route URLs

**When to change**: any new entity fields, DTO shapes, request/response types, or route-building logic.

---

### 2) Server (Business logic + HTTP routes)
**Business logic belongs in services**; routes should be thin.
- `server/services/`
  - `minio.service.ts` (`MinioService`, plus `MinioConfig`, `BucketInfo`, `UsageMetrics`, etc.)
  - `sftpgo.service.ts` (`SftpGoService`, config and API types)
  - `notification.service.ts` (`NotificationService`, `NotificationType`, payloads)
  - `billing.service.ts` (`BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`)
  - `audit.service.ts` (`AuditService`, `AuditDetails`, `AuditLogPayload`)
  - `domain-service.ts` (`DomainVerificationResult`)

- `server/routes/`
  - `smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`) — pattern for route handlers

- `server/replit_integrations/auth/routes.ts`
  - `registerAuthRoutes` — auth integration routing

**When to change**: implement new server-side behavior in a service; add/extend endpoints in routes; ensure auth/permissions/auditing/notifications are applied consistently.

---

### 3) Client (Pages, layout, feature UI)
- `client/src/pages/`
  - `Dashboard.tsx`
  - `not-found.tsx`

- `client/src/components/`
  - Layout/navigation/theme:  
    - `layout/DashboardLayout.tsx`  
    - `TopNavigation.tsx`, `MobileBottomNav.tsx`  
    - `theme-provider.tsx`, `mode-toggle.tsx`
  - Branding/settings:
    - `branding-provider.tsx` (`BrandingProvider`, `useBranding`)
    - `settings/AppBranding.tsx`
  - Notifications:
    - `NotificationsBell.tsx`
  - Billing/usage:
    - `billing/UpgradeRequestsCard.tsx`
    - `billing/StorageOverviewCard.tsx`
    - `billing/ImperiusStatsCard.tsx`
    - `billing/BucketUsageTable.tsx`
  - UI primitives:
    - `components/ui/*` (e.g., `ui/button.tsx`, `ui/badge.tsx`, `ui/chart.tsx`)
    - `ui-custom.tsx` (custom wrappers and shared props, e.g., `ButtonProps`)

**When to change**: build new UI in `components/` and wire into `pages/`; reuse `components/ui` primitives; ensure layout/theming patterns are followed.

---

### 4) Tests
- `testsprite_tests/`
  - Example API-oriented tests:
    - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
    - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

- `tests/components` (UI/component tests, if present/used)

**When to change**: whenever new endpoints are introduced/modified (add validation/error handling checks); whenever UI behavior changes (component/page tests if the repo uses them).

---

## Feature Delivery Workflow (End-to-End)

### Step 0 — Clarify the Feature Contract
Before coding, produce a short “feature contract”:
- User story + acceptance criteria
- API endpoints impacted/added
- Data model changes (shared schema)
- Permissions/auth expectations
- Audit/notification expectations
- UI surfaces impacted (pages/components)
- Test plan (API + UI)

This repo strongly benefits from **contract-first** changes (shared types first).

---

### Step 1 — Update Shared Types/Schemas
**Goal:** client and server compile against the same truth.

1. Extend/introduce types in `shared/schema.ts`
   - Add fields to existing exports when evolving entities (e.g., `Bucket`, `Notification`, `Subscription`).
2. If route patterns need to be standardized/extended, update `shared/routes.ts` and use `buildUrl`.

**Checklist**
- [ ] Types are exported (consistent with existing exports)
- [ ] Changes are backwards-compatible where possible
- [ ] No “server-only” types leak into shared unless truly cross-layer

---

### Step 2 — Implement Business Logic in a Server Service
**Goal:** isolate core logic from HTTP.

1. Identify the closest service:
   - Storage/buckets/usage → `MinioService`
   - Managed SFTP/users → `SftpGoService`
   - Emails/alerts → `NotificationService`
   - Pricing/invoices/usage billing → `BillingService`
   - Audit trails → `AuditService`
   - Domain verification → `domain-service.ts`

2. Add new methods with clear inputs/outputs matching shared types.

**Best practices (fit to this codebase)**
- Keep services cohesive (don’t mix billing logic into storage service).
- Return typed results (use shared models where appropriate).
- Centralize third-party API interactions inside the service (MinIO/SftpGo/etc).
- If a feature changes user-visible state, consider:
  - Emitting a notification via `NotificationService`
  - Writing an audit record via `AuditService`

---

### Step 3 — Expose via Routes/Controllers (Thin Layer)
**Goal:** route handlers validate, delegate to service, format responses.

1. Add/extend endpoints under `server/routes/` (pattern similar to `smtp.ts`)
2. Keep handlers focused:
   - Parse/validate request
   - Call service
   - Map errors to proper HTTP responses
3. Ensure auth integration is respected (see `registerAuthRoutes` for patterns).

**Error handling expectations**
- Validation errors should be deterministic and testable (align with `testsprite_tests` intent).
- Avoid leaking internal service errors directly; map to safe responses.

---

### Step 4 — Build/Update Client UI
**Goal:** use existing layout/components and UI primitives.

1. If it’s a new screen, integrate through `client/src/pages/*` and wrap with `DashboardLayout` if it’s an authenticated app page.
2. Reuse existing primitives:
   - Buttons: `client/src/components/ui/button.tsx` or `ui-custom.tsx`
   - Badges: `ui/badge.tsx`
   - Charts: `ui/chart.tsx`
3. For cross-cutting look/feel:
   - Use `ThemeProvider`/`mode-toggle`
   - For branding-dependent UI, use `useBranding` from `branding-provider.tsx`
4. If feature affects top-level navigation or alerts:
   - Update `TopNavigation.tsx`, `MobileBottomNav.tsx`
   - Update `NotificationsBell.tsx` for new notification types/states

---

### Step 5 — Tests & Quality Gates
**API**
- Add/extend `testsprite_tests` scenarios when:
  - New endpoint is added
  - Validation/error responses change
  - Response time constraints matter (see TC014)

**UI**
- If component tests exist in `tests/components`, add coverage for:
  - Rendering states (loading/empty/error)
  - Main interactions (submit, retry, pagination, filters)

**Quality checklist**
- [ ] API returns stable error shapes and status codes
- [ ] UI handles loading/error/empty states
- [ ] No shared schema breaks downstream compilation
- [ ] New service methods have predictable boundaries and typed results

---

## Common Feature Patterns (How to Do Typical Tasks)

### A) Adding a New Domain Field (e.g., extend `Bucket`)
1. `shared/schema.ts`: add the field to the exported model
2. Server service (e.g., `MinioService`): populate/persist/compute the field
3. Server route: include it in responses
4. Client components: display/edit it
5. Tests: add validation + regression checks

---

### B) Adding a New Notification Type
1. Server: extend `NotificationType` in `server/services/notification.service.ts`
2. Define payload shape (keep `NotificationPayload` consistent and explicit)
3. Emit from the relevant service method when the feature triggers it
4. Client: update `NotificationsBell.tsx` rendering/labels if needed
5. Ensure shared `Notification` model supports any required fields (`shared/schema.ts`)

---

### C) Adding a New Storage/Bucket Capability
1. Prefer implementing in `server/services/minio.service.ts`
2. Reuse/extend existing exported types:
   - `BucketInfo`, `UsageMetrics`, `LifecycleRule`, etc.
3. Expose via a route handler under `server/routes/`
4. Surface in UI via existing billing/storage components:
   - `StorageOverviewCard.tsx`, `BucketUsageTable.tsx` (if usage-related)

---

### D) Adding a Billing/Usage Feature
1. Implement computations and pricing rules in `BillingService`
2. If usage data comes from storage, integrate via `MinioService` but keep orchestration in `BillingService`
3. UI entry points:
   - `billing/*` cards/tables
4. Add audit logs if it affects plan/charges (`AuditService`)

---

## Conventions & Best Practices (Inferred from the Codebase)

### Separation of concerns
- **Services** own business logic and third-party API calls.
- **Routes/controllers** are thin and delegate to services.
- **Shared** defines contracts (types/models/routes).
- **Client components** are composed from `components/ui` primitives + feature components.

### Type-first development
- Prefer updating `shared/schema.ts` early so server/client changes stay aligned.

### Reuse existing UI system
- Prefer `client/src/components/ui/*` and `ui-custom.tsx` over introducing new one-off styles.

### Observability features are first-class
- Many apps add these later; here you already have:
  - `AuditService` and `NotificationService`
- When adding user-impacting actions, consider whether it should be auditable and/or notify.

---

## Key Files (What They’re For)

### Shared
- `shared/schema.ts` — canonical domain types/models used across app
- `shared/routes.ts` — route utilities (e.g., `buildUrl`) for consistent URL construction

### Server
- `server/services/minio.service.ts` — storage/bucket operations, metrics, lifecycle rules
- `server/services/sftpgo.service.ts` — SFTPGo integration (users, folders, filesystem)
- `server/services/notification.service.ts` — notification creation/dispatch patterns
- `server/services/billing.service.ts` — pricing, usage summaries, invoice data
- `server/services/audit.service.ts` — audit logging and audit payload conventions
- `server/services/domain-service.ts` — domain verification helpers/results
- `server/routes/smtp.ts` — example route handler patterns for configure/test operations
- `server/replit_integrations/auth/routes.ts` — auth-related routing integration

### Client
- `client/src/pages/Dashboard.tsx` — primary app dashboard entry
- `client/src/components/layout/DashboardLayout.tsx` — standard authenticated page frame
- `client/src/components/TopNavigation.tsx` / `MobileBottomNav.tsx` — navigation surfaces
- `client/src/components/theme-provider.tsx` / `mode-toggle.tsx` — theming
- `client/src/components/branding-provider.tsx` / `settings/AppBranding.tsx` — branding configuration and consumption
- `client/src/components/NotificationsBell.tsx` — notification UI entrypoint
- `client/src/components/billing/*` — billing/usage UI modules
- `client/src/components/ui/*` + `ui-custom.tsx` — UI primitives and wrappers

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — API validation/error handling expectations
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — API response-time + error handling checks

---

## “Definition of Done” for Features
- [ ] Shared types updated (if contract changed)
- [ ] Service-layer implementation complete and cohesive
- [ ] Route handler added/updated with stable status codes and response shapes
- [ ] UI implemented with existing layout + primitives; handles empty/loading/error
- [ ] Notifications/audit integrated where appropriate
- [ ] Tests updated/added (API validation + performance where relevant)
- [ ] No dead code / temporary logs left behind

---

## Hand-off Notes (What to Include in PR)
- кратко: feature summary + screenshots (UI) + endpoint examples (API)
- List of modified key files (shared/server/client/tests)
- Migration/ops notes if config is required (e.g., SMTP-like setup patterns)
- Test evidence (how to run + results, especially `testsprite_tests` if used)
