# Feature Developer Agent Playbook — PrimeCloudProV2

## Purpose

Deliver end-to-end product features (backend + frontend) safely and consistently within **PrimeCloudProV2**, aligning with existing service patterns, shared schemas, routing conventions, UI component standards, and test expectations.

This playbook is optimized for implementing new functionality across:

- **Shared domain models & types** (`shared/`)
- **Server routes/controllers** (`server/routes/`, `server/replit_integrations/`)
- **Server services (business logic)** (`server/services/`)
- **Client pages & components** (`client/src/pages`, `client/src/components`)
- **Automated tests** (`testsprite_tests/`, plus any unit/integration tests present)

---

## Repository Map (What to Touch)

### 1) Shared Layer (Types, Schema, Routes)
**Focus directories**
- `shared/`
- `shared/models/`

**Key files**
- `shared/schema.ts`  
  Contains core exported domain structures (e.g., `Product`, `Order`, `Account`, `Bucket`, `Notification`, etc.). This is the canonical place for shared model shape and validation/typing decisions.
- `shared/routes.ts`  
  Contains route utilities like `buildUrl` and likely route path definitions and client/server agreement points.

**When to change**
- Adding a new domain object, extending an existing object shape, or introducing shared request/response types used by both server and client.
- Adding a new API route contract or shared route builder logic.

---

### 2) Server Layer (Routes + Services)
**Focus directories**
- `server/routes/` (HTTP endpoints/controllers)
- `server/services/` (business logic orchestration)
- `server/replit_integrations/auth/` (auth-specific routing/integration)

**Key files**
- `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)  
  Example of route handlers. Use as a pattern for controller responsibilities: parse/validate input → call service → return response.
- `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)  
  Auth routing integration; follow conventions here when adding auth-protected features.
- `server/services/*.ts`  
  Service-layer pattern is strongly established:
  - `minio.service.ts` (`MinioService`, `MinioConfig`, `BucketInfo`, `UsageMetrics`, `StorageQuota`, etc.)
  - `sftpgo.service.ts` (`SftpGoService`, `SftpGoUser`, `SftpGoVirtualFolder`, etc.)
  - `notification.service.ts` (`NotificationService`, `NotificationType`, `NotificationPayload`)
  - `billing.service.ts` (`BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`)
  - `audit.service.ts` (`AuditService`, `AuditDetails`, `AuditLogPayload`)
  - `domain-service.ts` (`DomainVerificationResult`)

**When to change**
- New feature logic belongs in a service first; routes should remain thin.
- Cross-cutting concerns (notifications, auditing, billing implications) should leverage their dedicated services rather than being re-implemented in routes/components.

---

### 3) Client Layer (Pages + Components)
**Focus directories**
- `client/src/pages/` (screen-level components and routing targets)
- `client/src/components/` (reusable UI + domain components)
- `client/src/components/ui/` (design system primitives)
- `client/src/components/settings/`, `layout/`, `billing/`, `admin/` (feature areas)

**Key files/pattern anchors**
- Pages:
  - `client/src/pages/Dashboard.tsx` (dashboard patterns)
  - `client/src/pages/not-found.tsx`
- Layout & Providers:
  - `client/src/components/layout/DashboardLayout.tsx`
  - `client/src/components/theme-provider.tsx`
  - `client/src/components/branding-provider.tsx` (`BrandingProvider`, `useBranding`, `BrandingConfig`)
- Navigation:
  - `client/src/components/TopNavigation.tsx`
  - `client/src/components/MobileBottomNav.tsx`
- UI primitives and wrappers:
  - `client/src/components/ui/button.tsx` (`ButtonProps`)
  - `client/src/components/ui/badge.tsx` (`BadgeProps`)
  - `client/src/components/ui-custom.tsx` (`ButtonProps` — note there are multiple ButtonProps types; avoid ambiguous imports)
- Notifications UX:
  - `client/src/components/NotificationsBell.tsx`

**When to change**
- New screens: add a page under `client/src/pages/` and integrate with layout/navigation conventions.
- New reusable UI: add/extend primitives in `client/src/components/ui/` or feature components in `client/src/components/<area>/`.

---

### 4) Tests
**Focus directories**
- `testsprite_tests/`  
  Contains Python-based API validations (e.g., endpoint response-time/error handling tests). Your feature must not break these assumptions: consistent status codes, predictable error formats, and reasonable latency.

**When to change**
- Add or update tests when you introduce a new endpoint or modify behavior.
- If behavior changes intentionally (e.g., error format), update corresponding tests and document the contract change.

---

## Operating Principles (Codebase-Derived)

1. **Service-first design**
   - Put business logic in `server/services/*`.
   - Keep routes/controllers minimal: validate → call service → map result to HTTP response.

2. **Shared schema is the contract**
   - If the client consumes server data, define/extend types in `shared/schema.ts` (or the appropriate shared file).
   - Avoid duplicating types separately in client and server.

3. **Use dedicated cross-cutting services**
   - Notifications: `NotificationService`
   - Auditing: `AuditService`
   - Billing/usage: `BillingService`
   - Storage/object operations: `MinioService`
   - SFTP operations: `SftpGoService`

4. **UI consistency through primitives/providers**
   - Use existing UI components (`client/src/components/ui/*`) before introducing new patterns.
   - Respect theming/branding via `ThemeProvider` and `BrandingProvider`.

5. **Prefer predictable API behavior**
   - Tests emphasize endpoint error handling and validation; maintain consistent status codes and response shapes for errors.

---

## Standard Feature Workflow (End-to-End)

### Step 0 — Define the feature contract
Produce a short internal spec (in the PR description or feature doc) that answers:
- New/changed API endpoints (method + path + request/response)
- New/changed shared models (`shared/schema.ts`)
- UI entry points (page/component location)
- Side effects: audit logs, notifications, billing impact
- Migration/rollout concerns (backwards compatibility)

---

### Step 1 — Update shared contracts (types/models/routes)
**Where**
- `shared/schema.ts` for model/type additions
- `shared/routes.ts` if route builders or shared paths are required

**Checklist**
- Add/extend exported types in a backward-compatible way when possible.
- Keep naming consistent with existing exports (`Account`, `Bucket`, `Notification`, etc.).
- If the server will return a new field, ensure client types include it.

---

### Step 2 — Implement/extend service-layer logic
**Where**
- Add a new file in `server/services/` for a new domain service, or extend an existing one.

**Service design checklist**
- Keep the service API typed using shared types where appropriate.
- Do not import client code in services.
- Prefer small, composable methods (e.g., `getUsageMetrics`, `createBucket`, `sendNotification`, `writeAuditLog`).
- Handle external API failures defensively and return meaningful, typed results to controllers.

**Cross-cutting hooks**
- If the feature changes state or affects user-visible behavior:
  - Write an audit entry via `AuditService`.
  - Notify users/admins via `NotificationService` when appropriate.
  - Update billing/usage flows via `BillingService` if it affects quotas/limits/pricing.

---

### Step 3 — Add/extend route handlers (controllers)
**Where**
- `server/routes/*` (or relevant module like `server/replit_integrations/auth/routes.ts`)

**Controller responsibilities**
- Parse and validate inputs (body/query/path). If you introduce validation rules, ensure error responses remain consistent.
- Call the appropriate `server/services/*` method(s).
- Map domain/service errors to HTTP status codes deterministically.
- Avoid embedding business logic; keep it in services.

**Practical pattern**
- `handleX(req, res)` should read like:
  1) validate input
  2) call `SomeService.doThing(...)`
  3) `return res.status(200).json(result)` or `res.status(4xx/5xx).json({ ...error })`

---

### Step 4 — Implement client UI (pages + components)
**Where**
- Screen/page: `client/src/pages/`
- Feature component: `client/src/components/<area>/`
- UI primitives: `client/src/components/ui/` (only if truly reusable)
- Layout integration: `client/src/components/layout/DashboardLayout.tsx`
- Use theming/branding from:
  - `client/src/components/theme-provider.tsx`
  - `client/src/components/branding-provider.tsx`

**UI checklist**
- Use existing primitives (`button`, `badge`, etc.) and existing layout patterns.
- Ensure the feature works in both desktop navigation (`TopNavigation`) and mobile (`MobileBottomNav`) if it’s user-facing.
- Use `NotificationsBell` patterns if the feature introduces new notifications.

**Type safety**
- Import shared types rather than re-declaring interfaces locally.
- Watch for naming collisions (e.g., `ButtonProps` exists in more than one module); prefer explicit import paths and avoid ambiguous re-exports.

---

### Step 5 — Tests (don’t break existing suites)
**Where**
- `testsprite_tests/` includes API endpoint validation tests around error handling and response time.

**Testing checklist**
- Add tests for:
  - Happy path (valid input)
  - Validation errors (missing/invalid fields)
  - Authorization failures (if protected)
  - External dependency failures (MinIO/SFTPGo/etc.) → ensure controlled error responses
- Maintain consistent error response shapes and status codes (tests appear to validate these heavily).

---

### Step 6 — Hardening & review gates
Before PR:
- Confirm all new public routes are documented (at least in PR notes).
- Confirm service methods have clear, typed inputs/outputs.
- Confirm new UI uses existing providers and doesn’t bypass layout/theming.
- Confirm no secrets/config are hard-coded (SMTP, MinIO, etc.).
- Confirm audit/notification/billing implications are handled (or explicitly out of scope).

---

## Common Task Playbooks

### A) Add a new API endpoint backed by a service
1. **Define shared request/response types** in `shared/schema.ts` (or a shared types module if present).
2. **Add service method** in `server/services/<domain>.service.ts`.
3. **Add route handler** in `server/routes/<area>.ts`:
   - Validate input
   - Call service
   - Return response
4. **Update shared route utilities** in `shared/routes.ts` if the client uses `buildUrl` or shared paths.
5. **Add/extend tests** in `testsprite_tests/` (or existing test framework files) to cover error handling and validation.

---

### B) Extend MinIO-related functionality (Buckets, lifecycle, usage)
**Primary file**
- `server/services/minio.service.ts`

**Supporting types**
- `MinioConfig`, `BucketInfo`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`

**Implementation tips**
- Keep MinIO interaction code isolated inside `MinioService`.
- If returning lifecycle/usage data to the client, ensure the shape is captured in `shared/schema.ts`.
- Consider billing implications (quota/usage) and coordinate with `BillingService`.

---

### C) Add a notification-triggering feature
**Primary files**
- `server/services/notification.service.ts`
- Client: `client/src/components/NotificationsBell.tsx`

**Checklist**
- Use `NotificationType` and `NotificationPayload` consistently.
- If UI needs new notification rendering rules, implement in a feature-appropriate component, but reuse shared UI primitives.

---

### D) Add auditable actions (security/compliance)
**Primary file**
- `server/services/audit.service.ts`

**Checklist**
- Define what constitutes an auditable event (create/update/delete, permission changes, config changes like SMTP).
- Use a structured payload (`AuditLogPayload`) with enough metadata to diagnose issues later.
- Call audit logging from the service layer, not from UI.

---

### E) Add a new settings screen (branding/theme/admin-like config)
**Primary references**
- `client/src/components/settings/AppBranding.tsx`
- `client/src/components/branding-provider.tsx`
- `client/src/components/theme-provider.tsx`

**Checklist**
- Store and propagate branding config using `BrandingProvider` patterns.
- Ensure changes persist via a server endpoint if needed; define shared config types.

---

## Code Conventions & Best Practices (Enforced by Existing Structure)

### Backend
- Prefer **service classes** (`XService`) with exported types.
- Keep controllers thin and deterministic.
- Avoid leaking third-party API response shapes to the client; map to your shared schema.
- Centralize domain integration (MinIO/SFTPGo/SMTP) in dedicated services.

### Frontend
- Use `DashboardLayout` for authenticated areas unless explicitly standalone.
- Use `ui/` primitives for consistent styling/behavior.
- Respect branding/theming providers; do not hardcode colors/branding strings in feature components.

### Shared
- Treat `shared/schema.ts` as the contract boundary.
- Add fields carefully to preserve compatibility; avoid breaking removals/renames unless coordinated.

---

## Key Files & Their Roles (Quick Reference)

### Shared
- `shared/schema.ts` — canonical domain model exports (`Product`, `Order`, `Bucket`, `Notification`, etc.)
- `shared/routes.ts` — route building and shared route-related utilities (`buildUrl`)

### Server
- `server/routes/smtp.ts` — example route handler style (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` — auth route registration (`registerAuthRoutes`)
- `server/services/minio.service.ts` — storage operations, quotas, lifecycle, usage
- `server/services/sftpgo.service.ts` — SFTPGo integration, users/folders
- `server/services/notification.service.ts` — notification generation and dispatch patterns
- `server/services/audit.service.ts` — audit logging primitives
- `server/services/billing.service.ts` — pricing, usage summary, invoice data
- `server/services/domain-service.ts` — domain verification workflow (`DomainVerificationResult`)

### Client
- `client/src/pages/Dashboard.tsx` — dashboard patterns
- `client/src/pages/not-found.tsx` — 404 handling
- `client/src/components/layout/DashboardLayout.tsx` — main authenticated layout structure
- `client/src/components/TopNavigation.tsx` — desktop navigation
- `client/src/components/MobileBottomNav.tsx` — mobile navigation
- `client/src/components/NotificationsBell.tsx` — notifications UX entry point
- `client/src/components/branding-provider.tsx` — branding config/provider (`useBranding`)
- `client/src/components/theme-provider.tsx` — theme provider
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx` — UI primitives
- `client/src/components/ui-custom.tsx` — custom UI wrappers; watch type name collisions (`ButtonProps`)

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

---

## PR Definition of Done (Feature Developer)

- [ ] Shared types updated (if client/server contract changed)
- [ ] Service-layer implementation complete and typed
- [ ] Route/controller added/updated with input validation and stable error mapping
- [ ] UI implemented using existing layout/providers and UI primitives
- [ ] Notifications/audit/billing implications handled or explicitly documented
- [ ] Tests added/updated; endpoint validation/error handling tests pass
- [ ] No duplicated type definitions that belong in `shared/`
- [ ] No ambiguous imports (e.g., conflicting `ButtonProps`) in new code
- [ ] Feature is resilient to external dependency failures (MinIO/SFTPGo/SMTP)

---

## Collaboration Notes (How this agent should work with others)

- **QA Automation Engineer**: Provide endpoint contracts and error formats early; request new E2E/API validations for edge cases and failure modes.
- **Backend Specialist** (if present): Align on service boundaries and external integration patterns.
- **DevOps Engineer** (if present): Confirm config/env needs for SMTP/MinIO/SFTPGo changes and rollout safety.

---

## What Not To Do

- Don’t implement business logic directly in route handlers or React components.
- Don’t introduce new UI styling systems when `client/src/components/ui/*` already exists.
- Don’t change error response formats casually—existing tests specifically target error handling/validation behavior.
- Don’t duplicate shared model types in client or server; update `shared/schema.ts` instead.

---
