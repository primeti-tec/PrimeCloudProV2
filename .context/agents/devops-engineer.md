# Feature Developer Agent Playbook (PrimeCloudProV2)

A practical, codebase-specific guide for implementing product features end-to-end (DB/schema → API/service → UI), with conventions, workflows, and checklists aligned to this repository.

---

## 1) Mission & Scope

### Primary Responsibility
Deliver new product features and improvements across:
- **Shared domain models & types** (single source of truth)
- **Server routes/controllers** (HTTP endpoints, auth, validation)
- **Server services** (business logic, integrations: MinIO/SFTPGo/billing/audit/notifications)
- **Client UI** (pages/components, settings/admin/billing modules)
- **Tests** (where present; expand coverage with repo patterns)

### Non-goals (handoff to other agents/roles)
- **Production deploy / rollback / CI/CD / server access** → use the `devops-engineer` agent playbook.
- Large-scale infra changes, secrets rotation, and release procedures should be coordinated with DevOps.

---

## 2) Codebase Map: Where to Work

### Shared (Types, Schemas, Routing Utilities)
- `shared/schema.ts`
  - Exports key domain structures: `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`.
  - Treat this as the *canonical* domain contract used across client/server.
- `shared/routes.ts`
  - Contains `buildUrl` and likely route helpers/constants.

**When to touch shared/**:
- Adding/changing fields in core entities
- Introducing new domain objects used by both server and client
- Adding route helpers or shared validation patterns

---

### Server (API + Services)
- `server/routes/`
  - Example: `server/routes/smtp.ts` exports `handleConfigureSMTP`, `handleTestSMTP`
- `server/services/`
  - `minio.service.ts` (`MinioService`, `MinioConfig`, `BucketInfo`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`)
  - `sftpgo.service.ts` (`SftpGoService`, `SftpGoConfig`, user/filesystem/virtual folder types)
  - `billing.service.ts` (`BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`)
  - `notification.service.ts` (`NotificationService`, `NotificationType`, `NotificationPayload`)
  - `audit.service.ts` (`AuditService`, `AuditDetails`, `AuditLogPayload`)
  - `domain-service.ts` (`DomainVerificationResult`)

**When to touch server/**:
- New endpoints and request handling
- New business logic in a service class
- Integrations (MinIO, SFTPGo, notifications, billing, audit logs)
- Error handling, validation, authorization checks

---

### Client (Pages, Components, UI)
- `client/src/pages/`
  - Example exports: `Dashboard`, `NotFound`
- `client/src/components/`
  - Navigation/layout/theme: `TopNavigation`, `DashboardLayout`, `theme-provider`, `mode-toggle`
  - Notifications: `NotificationsBell`
  - Branding: `branding-provider`, settings `AppBranding`
  - Billing views: `UpgradeRequestsCard`, `StorageOverviewCard`, `ImperiusStatsCard`, `BucketUsageTable`
- `client/src/components/ui/` and `client/src/components/ui-custom.tsx`
  - Shared UI primitives (e.g., `button.tsx`, `badge.tsx`) and custom variants.

**When to touch client/**:
- New screens, settings, admin panels, billing views
- New reusable UI components
- Hooking up data to server endpoints
- Updating UI to reflect schema/contract changes

---

### Tests
- `testsprite_tests/` (Python-based automated tests)
  - Includes API validation and error-handling cases such as:
    - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
    - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**When to touch tests/**:
- Add or update tests when changing API behavior, error handling, or response formats
- Use these as a baseline for API expectations (status codes, validation, latency tolerance)

---

## 3) Architectural Conventions (Patterns to Follow)

### Service Layer First
This repo strongly favors **service classes** in `server/services/` that encapsulate business logic. Routes/controllers should:
- Validate/parse input
- Authorize the caller
- Call the service
- Normalize errors and return responses

**Keep business logic out of route handlers** unless it’s trivial glue code.

---

### Shared Schema as Contract
If a feature affects entities like `Bucket`, `Subscription`, `Notification`, etc.:
- Update `shared/schema.ts` first (or alongside)
- Ensure both server and client compile against the same updated contract

---

### Cross-cutting Concerns: Audit + Notifications
When implementing user-impacting actions, consider:
- **Audit logging** via `AuditService`
- **User/admin notifications** via `NotificationService`

Use them consistently for actions like:
- bucket lifecycle changes
- access key creation/revocation
- billing plan changes
- SFTP user provisioning
- SMTP configuration changes

---

## 4) Standard Feature Workflow (End-to-End)

### Step 0 — Define the Feature Contract
- Clarify:
  - Who can do it? (role/account member/admin)
  - What data is created/updated?
  - What are success/failure states?
  - What should be audited/notified?

Deliverable: a short spec with payloads, response shapes, and UI states.

---

### Step 1 — Update Shared Types/Schemas (if needed)
**Files**: `shared/schema.ts`, optionally `shared/routes.ts`

Checklist:
- [ ] Add/extend domain types (e.g., new fields on `Bucket`, new config object)
- [ ] Ensure names/types match existing conventions (PascalCase exports)
- [ ] If you introduce new “rule/config” objects, follow patterns like `LifecycleRule`, `MinioConfig`, `PricingConfig`

---

### Step 2 — Implement/Extend a Server Service
**Files**: `server/services/*.ts`

Guidelines:
- Implement feature logic in the relevant service (e.g., MinIO work in `minio.service.ts`)
- Keep external integration handling (API calls, SDK calls) inside the service
- Return typed objects that map well to shared schema outputs

Cross-cutting:
- [ ] Add audit events via `AuditService` for important state changes
- [ ] Trigger user/admin notifications via `NotificationService` when appropriate

---

### Step 3 — Add/Update Route Handler (Controller)
**Files**: `server/routes/*`, plus central route registration if present

Example reference: `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)

Checklist:
- [ ] Validate input early; return consistent error responses
- [ ] Authorization checks before calling services
- [ ] Map service errors to HTTP status codes (especially for tests in `testsprite_tests`)
- [ ] Don’t leak internal errors; return actionable messages

Performance:
- Keep handlers thin; avoid extra roundtrips; prefer service-level batching.

---

### Step 4 — Client Integration (UI + Data)
**Files**: `client/src/pages/*`, `client/src/components/*`

Checklist:
- [ ] Add/modify page or card component in the correct module (billing/settings/admin/layout)
- [ ] Reuse UI primitives from `client/src/components/ui/*` and `ui-custom.tsx`
- [ ] If feature affects branding/theme, integrate with `branding-provider` / `theme-provider`
- [ ] If feature creates notifications, ensure UI surfaces them (e.g., `NotificationsBell` patterns)

UX requirements:
- Loading states, empty states, errors, and success feedback are mandatory for new features.

---

### Step 5 — Tests & Verification
**Files**: `testsprite_tests/*` (+ any existing JS/TS tests if present)

Checklist:
- [ ] Update API tests when status codes/validation change
- [ ] Add coverage for:
  - input validation failures
  - unauthorized/forbidden
  - expected happy path
  - “integration unavailable” scenarios (if applicable)

If adding new endpoints:
- Mirror patterns in `TC017` and `TC014` for:
  - error handling consistency
  - response time expectations (avoid heavy synchronous work in handlers)

---

## 5) Common Feature Recipes

### A) Add a New API Endpoint Backed by a Service
1. Define request/response types in `shared/schema.ts` (if shared with client).
2. Implement method in an existing service (or create a new service in `server/services/` if truly new domain).
3. Add handler in `server/routes/<domain>.ts`.
4. Register route (where the server wires routes; search for route mounting patterns).
5. Add/extend tests in `testsprite_tests/` for validation and error handling.
6. Integrate UI: call endpoint and render results.

**Quality bar**: handler ≤ ~50 lines; business logic lives in service.

---

### B) Extend MinIO-Related Functionality (Buckets, Usage, Lifecycle)
**Primary file**: `server/services/minio.service.ts`  
**Shared types**: `shared/schema.ts` exports `Bucket`, `LifecycleRule`

Steps:
- Add new service methods returning `BucketInfo`, `UsageMetrics`, etc.
- Reuse existing `LifecycleRule` shapes (don’t invent near-duplicates).
- Ensure quota/usage calculations are consistent across billing UI components:
  - `client/src/components/billing/StorageOverviewCard.tsx`
  - `client/src/components/billing/BucketUsageTable.tsx`

---

### C) Add a Notification-Producing Feature
**Primary file**: `server/services/notification.service.ts` (`NotificationService`, `NotificationType`)  
**Client surface**: `client/src/components/NotificationsBell.tsx`

Steps:
- Introduce/extend `NotificationType` if needed.
- Emit notifications at the service layer after successful state change.
- Ensure payload matches `NotificationPayload` patterns.
- Verify UI renders the new type gracefully (fallback copy if unknown).

---

### D) Add Audit Logging for Sensitive Actions
**Primary file**: `server/services/audit.service.ts`

Steps:
- Identify “who did what to which resource” and log consistently.
- Add an `AuditDetails` payload that includes identifiers and relevant fields (avoid secrets).
- Ensure audit calls happen after successful completion or record failure reason when useful.

---

### E) Add a New Settings Panel (Branding / SMTP / Account)
Likely files:
- `client/src/components/settings/AppBranding.tsx`
- `client/src/components/branding-provider.tsx`
- `server/routes/smtp.ts` (for SMTP-like patterns)

Steps:
- Create settings component in `client/src/components/settings/`
- If it’s global UI: ensure it integrates with `DashboardLayout` and navigation components
- Add server endpoints for persistence/testing (SMTP example shows “configure” and “test” endpoints)

---

## 6) Best Practices Derived from This Repo

### Keep Type Exports Clean and Reusable
- Prefer adding/expanding existing exports in `shared/schema.ts` rather than creating ad-hoc types in client/server.
- If a type is used on both sides, it belongs in `shared/`.

### Service Classes Are the Unit of Business Logic
- Extend `MinioService`, `BillingService`, etc. rather than adding logic directly in routes or UI.
- Add methods that are easy to test in isolation (inputs/outputs, minimal global state).

### UI Consistency via Shared Components
- Use `client/src/components/ui/button.tsx`, `badge.tsx`, and `ui-custom.tsx` patterns.
- Prefer composing cards and tables consistent with billing components already present.

### Error Handling Must Be Predictable
Given existing API error-handling tests:
- Standardize validation failures (400)
- Auth failures (401/403)
- Not found (404)
- External service failures (502/503 as appropriate)
- Avoid returning raw stack traces to clients

### Don’t Forget “Operational” Concerns in Feature Work
- Add notifications where users need awareness
- Add audit logs where admins need traceability
- Keep endpoints responsive (offload long jobs if needed)

---

## 7) Key Files & What They’re For (Quick Reference)

### Shared
- `shared/schema.ts` — canonical domain models/contracts
- `shared/routes.ts` — routing helpers (e.g., `buildUrl`)

### Server
- `server/routes/smtp.ts` — example of configure/test endpoints and handler style
- `server/services/minio.service.ts` — storage/bucket/usage/quota/lifecycle operations
- `server/services/sftpgo.service.ts` — SFTPGo provisioning and filesystem mapping
- `server/services/billing.service.ts` — pricing, usage summaries, invoicing structures
- `server/services/notification.service.ts` — notification types and dispatch
- `server/services/audit.service.ts` — audit event creation and payloads
- `server/services/domain-service.ts` — domain verification logic/results
- `server/replit_integrations/auth/routes.ts` — auth route registration patterns

### Client
- `client/src/pages/Dashboard.tsx` — dashboard entry patterns
- `client/src/components/layout/DashboardLayout.tsx` — layout composition and app shell
- `client/src/components/TopNavigation.tsx` — navigation patterns
- `client/src/components/NotificationsBell.tsx` — notification UI
- `client/src/components/branding-provider.tsx` — branding context and config
- `client/src/components/settings/AppBranding.tsx` — branding settings UI
- `client/src/components/theme-provider.tsx` / `mode-toggle.tsx` — theme toggling
- `client/src/components/billing/*` — billing-related UI patterns

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — validation/error-handling expectations
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — latency/error-handling expectations

---

## 8) Feature Delivery Checklists

### Definition of Done (Server)
- [ ] Shared types updated (if needed)
- [ ] Service method implemented with clear inputs/outputs
- [ ] Route handler validates input and authorizes properly
- [ ] Errors mapped to consistent HTTP responses
- [ ] Audit/notification hooks added where appropriate
- [ ] API tests updated/added for new behavior

### Definition of Done (Client)
- [ ] UI uses existing layout/components
- [ ] Loading/empty/error states handled
- [ ] Success feedback present
- [ ] No contract mismatches with `shared/schema.ts`
- [ ] Navigation/layout integration correct (desktop + mobile where applicable)

### Review “Red Flags”
- Business logic inside a React component or route handler
- Duplicated types in server/client instead of shared
- Silent failures (no notification/audit for sensitive actions)
- Unbounded API calls in UI without loading/error handling
- New UI components that ignore existing `ui/` primitives

---

## 9) Collaboration & Escalation

### When to involve DevOps (`devops-engineer`)
- Deploying/staging/production changes
- PM2/systemd/Docker/CI pipeline edits
- Server access/SSH/secrets/env var changes
- Rollback planning and execution

### When to coordinate with Product/QA
- Changes to billing calculations and invoice/usage output
- Changes to authentication/authorization flows
- Anything affecting API error contracts used by automated tests

---

## 10) Suggested “Default Implementation Plan” Template (Copy/Paste)

Use this structure in PR descriptions or feature tickets:

1. **Summary**: what changes and why  
2. **Shared contract**: `shared/schema.ts` changes (types/fields)  
3. **Server**:
   - Service: `<service>.ts` new/changed methods
   - Routes: `<route>.ts` endpoints and status codes
   - Audit/Notifications: what events are emitted
4. **Client**:
   - Pages/components touched
   - UX states (loading/error/empty/success)
5. **Tests**:
   - Updated/added `testsprite_tests` cases
6. **Manual verification steps**:
   - Steps to validate feature locally (API + UI)
7. **Risk & rollback notes** (if applicable; otherwise “N/A”)

---
