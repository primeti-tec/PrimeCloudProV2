# Feature-Developer Agent Playbook (PrimeCloudProV2)

## Role & Mission

You implement new product features end-to-end (DB/schema → server routes/services → shared types → client UI), following the repository’s existing patterns and conventions. You are responsible for correctness, security, tests, and maintainability.

---

## Architecture Snapshot (What to Touch, Where)

### 1) Shared “Contract” Layer (types + routes)
**Primary folder:** `shared/`  
**Why it matters:** This is the contract boundary between server and client.

- **`shared/schema.ts`**  
  Houses core domain models (e.g., `Product`, `Order`, `Account`, `Bucket`, `Notification`, etc.).  
  **Use when:** adding/changing data models, validation types, or adding fields to existing entities.

- **`shared/routes.ts`**  
  Defines route helpers like `buildUrl` (exported at ~line 711).  
  **Use when:** introducing new endpoints, ensuring client/server URLs stay consistent.

**Rule of thumb:** If a feature changes the shape of data, update `shared/` first so server + client remain aligned.

---

### 2) Server Layer (business logic + HTTP routes)
**Primary folders:** `server/`, `server/routes/`, `server/services/`, `server/replit_integrations/auth/`

- **Routes (Controllers)**  
  - `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)  
    Pattern: route handlers that delegate to services and validate inputs.
  - `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)  
    Pattern: central route registration.

- **Services (Business Logic)**  
  - `server/services/minio.service.ts` (`MinioService` + related types like `UsageMetrics`, `StorageQuota`)  
  - `server/services/sftpgo.service.ts` (`SftpGoService` + SFTPGo domain types)  
  - `server/services/notification.service.ts` (`NotificationService`, `NotificationType`)  
  - `server/services/billing.service.ts` (`BillingService`, `PricingConfig`, `InvoiceData`)  
  - `server/services/audit.service.ts` (`AuditService`, `AuditDetails`)  
  - `server/services/domain-service.ts` (`DomainVerificationResult`)

**Rule of thumb:** Put orchestration and external API calls in `server/services/*`. Keep routes thin.

---

### 3) Client Layer (pages + components)
**Primary folder:** `client/src/`

- **Pages**
  - `client/src/pages/Dashboard.tsx`
  - `client/src/pages/not-found.tsx`

- **Layout + Navigation**
  - `client/src/components/layout/DashboardLayout.tsx`
  - `client/src/components/TopNavigation.tsx`
  - `client/src/components/MobileBottomNav.tsx`

- **UI System / Design primitives**
  - `client/src/components/ui/*` (e.g., `button.tsx`, `badge.tsx`, `chart.tsx`)
  - `client/src/components/ui-custom.tsx` (custom UI wrappers)

- **Feature Components**
  - `client/src/components/billing/*` (e.g., `StorageOverviewCard`, `BucketUsageTable`)
  - `client/src/components/settings/AppBranding.tsx`
  - `client/src/components/NotificationsBell.tsx`

**Rule of thumb:** Prefer building reusable UI in `components/` and keeping `pages/` composition-focused.

---

### 4) Tests
- **Python API tests:** `testsprite_tests/*.py`  
  Examples:
  - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**Rule of thumb:** For new endpoints, mirror existing TestSprite patterns: validate error handling, validation behavior, and response time expectations.

---

## Key Conventions & Patterns (Derived from the Codebase)

### Service Layer is the “center of gravity”
This repo strongly uses service classes (`MinioService`, `BillingService`, etc.) to isolate external integrations and complex logic.

**Follow this pattern:**
- Route handler:
  - parse/validate input
  - call service
  - map service output to HTTP response
- Service:
  - owns integration details, retries, error mapping, domain conversions
  - returns structured results for routes to present

### Shared models drive consistency
Domain objects live in `shared/schema.ts`. New fields or entities should be defined there to avoid client/server drift.

### UI uses composable components
There is a clear split between:
- generic UI primitives (`client/src/components/ui/*`)
- feature components (`billing`, `settings`, etc.)
- app scaffolding (`layout`, navigation)

---

## Feature Development Workflow (End-to-End)

### Step 0 — Clarify Feature Shape
Before coding, produce a short implementation note:
- What new data is needed? (model + fields)
- What new endpoints are needed? (routes + request/response)
- What UI surfaces change? (pages/components)
- What existing service should own the logic? (or introduce a new `server/services/*.ts`)

---

### Step 1 — Shared Contract First
**When to edit `shared/`:**
- Adding/changing entity fields (e.g., `Bucket`, `Subscription`)
- Adding DTO-like shapes for API response payloads
- Adding route URL helpers via `shared/routes.ts`

**Checklist**
- [ ] Update `shared/schema.ts` with new types/fields (ensure backwards compatibility if needed)
- [ ] Update any route builders/constants in `shared/routes.ts` (use `buildUrl` patterns)

---

### Step 2 — Implement/Extend Server Service
Pick the closest existing service:
- Storage/object features → `MinioService`
- Billing/usage → `BillingService`
- Notifications → `NotificationService`
- Audit trails → `AuditService`
- SFTP management → `SftpGoService`
- Domain verification → `domain-service.ts`

**Best practices**
- Keep external API specifics inside the service
- Prefer typed method signatures and explicit return types
- Map low-level errors into meaningful domain errors (so routes can standardize responses)
- Consider whether the action should emit:
  - a notification (`NotificationService`)
  - an audit log (`AuditService`)

---

### Step 3 — Add/Update HTTP Routes (Controllers)
Add route handlers under `server/routes/*` when it fits an existing area (e.g., SMTP has its own file). Otherwise, create a new file in `server/routes/` and ensure it is registered in the server’s routing registration mechanism (look for existing route registration patterns similar to `registerAuthRoutes`).

**Handler checklist**
- [ ] Validate request body/query params (ensure error handling matches existing tests that check validation behavior)
- [ ] Call the service method
- [ ] Return consistent JSON shape
- [ ] Ensure HTTP status codes are correct for:
  - validation errors
  - auth/permission errors
  - integration failures
  - not found
- [ ] Add audit/notification hooks if the feature changes state or affects billing/security

---

### Step 4 — Implement Client UI
**Where to put things**
- New screen → `client/src/pages/`
- Reusable feature widget → `client/src/components/<area>/`
- Shared primitive → `client/src/components/ui/`
- Layout changes → `client/src/components/layout/DashboardLayout.tsx` or nav components

**UI best practices**
- Prefer composing existing primitives (`button`, `badge`, charts) over creating one-off styles
- If the feature is brand/theme sensitive, consult:
  - `client/src/components/branding-provider.tsx`
  - `client/src/components/settings/AppBranding.tsx`
  - `theme-provider.tsx` / `mode-toggle.tsx`

---

### Step 5 — Tests & Quality Gates
**Add/Update TestSprite tests** under `testsprite_tests/`:
- new endpoint validation cases
- error handling (malformed payload, missing fields, permission)
- response time checks if applicable (pattern exists in `TC014…`)

**Testing checklist**
- [ ] Happy-path test (200/201)
- [ ] Validation errors (400-ish behavior per existing suite expectations)
- [ ] Auth/permission test (401/403, depending on app behavior)
- [ ] Integration failure simulation (where possible)
- [ ] Non-regression checks for existing endpoints touched

---

## Common Task Playbooks

### A) Add a New API Endpoint Backed by an Existing Service
1. Add/confirm request/response shapes in `shared/`
2. Add a method to the relevant `server/services/*.ts`
3. Add a route handler in `server/routes/*.ts`
4. Add route URL helper or constant use in `shared/routes.ts` if needed
5. Update client to call the endpoint and render results
6. Add TestSprite tests for validation + error handling

---

### B) Add a New Field to an Existing Domain Entity (e.g., `Bucket`, `Account`)
1. Update `shared/schema.ts`
2. Update service(s) that read/write the entity (`MinioService`, `BillingService`, etc.)
3. Update route response mapping if it’s explicitly shaped
4. Update client components that display/edit it
5. Add tests for missing/invalid values and backward compatibility

---

### C) Add a New Dashboard Card / Billing Widget
1. Identify closest sibling component in `client/src/components/billing/`
2. Reuse existing layout conventions from `DashboardLayout` and `Dashboard.tsx`
3. Reuse UI primitives from `client/src/components/ui/`
4. If data comes from server:
   - ensure shared types exist
   - implement endpoint/service
5. Consider loading/error/empty states explicitly (billing/storage features commonly need them)

---

### D) Implement a Notification-producing Feature
1. Implement the core action in a service
2. Use `NotificationService` (`NotificationType`, `NotificationPayload`) to emit notification
3. Ensure UI surfaces it (see `NotificationsBell.tsx`)
4. Add audit log if it’s a security/billing-impacting event (`AuditService`)

---

## Security, Reliability, and Maintainability Standards

### Error Handling
- Centralize integration errors inside services and return actionable errors upward
- Route handlers should not leak internal error details; return safe messages + log details server-side

### Auditing
- Any feature that changes state, affects billing, credentials, access keys, or storage policies should consider `AuditService`.

### Permissions & Auth
- For anything user/account scoped, follow existing auth route registration patterns (`registerAuthRoutes` as a reference point).

### Consistency
- Don’t introduce new patterns for DI, route registration, or data shapes unless necessary—extend existing patterns first.

---

## “Where Do I Put This?” Quick Map

- **New storage usage computation** → `server/services/minio.service.ts` (+ UI in `client/src/components/billing/`)
- **New billing plan logic / invoices** → `server/services/billing.service.ts`
- **New alert/notification** → `server/services/notification.service.ts` (+ `NotificationsBell`)
- **New audit event** → `server/services/audit.service.ts`
- **New SMTP behavior** → `server/routes/smtp.ts` (and likely a service behind it if logic grows)
- **Branding/theme** → `client/src/components/branding-provider.tsx`, `settings/AppBranding.tsx`, `theme-provider.tsx`

---

## Deliverables Checklist (Definition of Done)

- [ ] Shared types updated (`shared/schema.ts` and/or `shared/routes.ts`)
- [ ] Service method implemented with clear typed boundaries
- [ ] Route handler added/updated with correct status codes + validation
- [ ] Client UI implemented with existing components and patterns
- [ ] Notifications/audits added if the feature warrants it
- [ ] TestSprite tests added/updated for validation + error handling
- [ ] No unused exports, consistent naming, and minimal duplication

---

## Key Files Index (Start Here)

- **Shared**
  - `shared/schema.ts`
  - `shared/routes.ts`

- **Server**
  - `server/routes/smtp.ts`
  - `server/replit_integrations/auth/routes.ts`
  - `server/services/minio.service.ts`
  - `server/services/billing.service.ts`
  - `server/services/notification.service.ts`
  - `server/services/audit.service.ts`
  - `server/services/sftpgo.service.ts`
  - `server/services/domain-service.ts`

- **Client**
  - `client/src/pages/Dashboard.tsx`
  - `client/src/components/layout/DashboardLayout.tsx`
  - `client/src/components/TopNavigation.tsx`
  - `client/src/components/NotificationsBell.tsx`
  - `client/src/components/billing/*`
  - `client/src/components/ui/*`
  - `client/src/components/settings/AppBranding.tsx`
  - `client/src/components/branding-provider.tsx`

- **Tests**
  - `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

---
