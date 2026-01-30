# Feature Developer Playbook — PrimeCloudProV2

## Mission
Deliver new features that span **shared types/schemas**, **server routes + services**, and **client pages/components**, while maintaining consistency with existing patterns (service-layer orchestration, shared schema usage, UI component conventions) and adding/adjusting tests where appropriate.

---

## Where to Work (Focus Areas)

### 1) Shared contracts (types, schemas, routes)
**Primary directory:** `shared/`  
**Key file:** `shared/schema.ts`  
- Contains exported domain models like `Product`, `Order`, `Account`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, and `LifecycleRule`.
- Treat this as the **source of truth** for cross-stack data shapes.

**Key file:** `shared/routes.ts`  
- Contains routing utilities like `buildUrl` (notably at/around `shared/routes.ts:711`).
- Use for consistent URL construction and route referencing across server/client.

**When to touch:**
- Adding new entities or fields that must be shared between server and client.
- Ensuring response/request shapes remain consistent.

---

### 2) Server HTTP layer (routes/controllers)
**Primary directories:**
- `server/routes/` (feature endpoints)
- `server/` (server bootstrap / composition)
- `server/replit_integrations/auth/` (auth-related routes)

**Notable route modules:**
- `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)

**When to touch:**
- Adding new API endpoints, wiring routes, validating input, handling errors.
- Adjusting existing endpoint behavior to match new feature specs.

---

### 3) Server service layer (business logic)
**Primary directory:** `server/services/`  
**Key services/patterns:**
- `MinioService` (`server/services/minio.service.ts`) — storage/buckets/usage/lifecycle patterns.
- `SftpGoService` (`server/services/sftpgo.service.ts`) — SFTPGo integration patterns.
- `NotificationService` (`server/services/notification.service.ts`) — notification types + payload patterns.
- `BillingService` (`server/services/billing.service.ts`) — pricing, usage summaries, invoices.
- `AuditService` (`server/services/audit.service.ts`) — audit logging patterns.
- `domain-service.ts` — domain verification patterns (`DomainVerificationResult`).

**When to touch:**
- Any feature requiring business rules, third-party integration, orchestration, or side effects.
- Keep routes thin; concentrate logic in services.

---

### 4) Client UI (pages, components, layout, settings, billing)
**Primary directories:**
- `client/src/pages/` — route-level UI (e.g., `Dashboard.tsx`, `not-found.tsx`)
- `client/src/components/` — reusable UI and feature components
- `client/src/components/ui/` — shared UI primitives (e.g., `button.tsx`, `badge.tsx`)
- `client/src/components/layout/` — global layouts (e.g., `DashboardLayout.tsx`)
- `client/src/components/settings/` — settings UIs (e.g., `AppBranding.tsx`)
- `client/src/components/billing/` — billing UIs (e.g., `StorageOverviewCard.tsx`)

**Notable components:**
- `TopNavigation.tsx`, `MobileBottomNav.tsx` (navigation)
- `theme-provider.tsx`, `mode-toggle.tsx` (theme)
- `branding-provider.tsx` + `settings/AppBranding.tsx` (branding)
- `NotificationsBell.tsx` (notifications UX)

---

### 5) Testing (API / UI / flows)
**Primary directories:**
- `testsprite_tests/` — Python-based scenario tests (API endpoint validation, response times, error handling)
- `tests/components/` — component-level tests (if present/active)

**Notable tests:**
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**When to touch:**
- New endpoints should come with updates/additions to error-handling and validation coverage.
- Performance/regression-sensitive endpoints should consider response time expectations.

---

## Architectural Conventions (What “Good” Looks Like Here)

### Service-layer first
- **Routes/controllers**: parse + validate input, call service, translate errors to HTTP responses.
- **Services**: implement business logic and integration details (Minio/SFTPGo/Billing/Notifications/Audit).
- **Shared schema**: define/extend domain types used across the stack.

### Shared types are the contract
- If server and client both need a field/type, add/update in `shared/schema.ts` (and keep naming consistent).
- Avoid “server-only” ad-hoc shapes in route handlers if the data is consumed by the UI—promote to shared.

### Consistent UI composition
- Prefer existing UI primitives in `client/src/components/ui/` (`button`, `badge`, charts, etc.).
- Keep pages (`client/src/pages/*`) as composition/root containers; push reusable parts into `client/src/components/*`.

### Cross-cutting concerns
- **Notifications**: use `NotificationService` + `NotificationType` patterns.
- **Audit**: log important state transitions and admin actions via `AuditService`.
- **Billing/usage**: prefer `BillingService` and established billing cards/tables patterns.
- **Storage**: prefer `MinioService` types (`BucketInfo`, `UsageMetrics`, `StorageQuota`, etc.).

---

## Standard Workflow: Implementing a New Feature (End-to-End)

### Phase 0 — Define scope and integration points
1. Identify the impacted domain:
   - Storage (Minio), SFTP (SftpGo), Billing, Notifications, Audit, Branding/Settings, Auth.
2. Determine whether the feature needs:
   - New DB/shared model fields (`shared/schema.ts`)
   - New/updated server endpoint(s) (`server/routes/*`)
   - New/updated service method(s) (`server/services/*`)
   - New/updated UI (pages/components)
   - New/updated tests (`testsprite_tests/*`, component tests)

**Deliverable:** a checklist of files to touch and acceptance criteria.

---

### Phase 1 — Shared contract changes (if needed)
1. Update `shared/schema.ts`:
   - Add/extend exported model(s) (e.g., `Notification`, `Bucket`, `Subscription`).
2. If URL patterns are needed by client and server:
   - Prefer using/adding to `shared/routes.ts` and use `buildUrl` consistently.

**Quality bar:**
- Shared naming is stable, fields are additive where possible.
- Avoid breaking changes unless explicitly required.

---

### Phase 2 — Service-layer implementation
1. Implement the feature logic in the relevant service:
   - Storage: `MinioService`
   - SFTP: `SftpGoService`
   - Billing: `BillingService`
   - Notifications: `NotificationService`
   - Audit: `AuditService`
2. Prefer:
   - Clear method boundaries (one responsibility per method)
   - Typed inputs/outputs aligned with shared schema types
3. Add audit/notification side effects where appropriate:
   - Account/admin actions → `AuditService`
   - User-facing updates → `NotificationService`

**Quality bar:**
- Minimal logic in routes; service methods are testable and reusable.
- Integration errors are surfaced with actionable messages (and loggable context).

---

### Phase 3 — API routes/controllers
1. Add or update endpoints in `server/routes/*`:
   - Validate inputs early.
   - Call service methods.
   - Return consistent response shapes (prefer shared types).
2. Follow established error-handling patterns:
   - Return appropriate status codes for validation vs. server errors.
   - Ensure endpoints behave well under error-handling tests (see `testsprite_tests/TC017*`, `TC014*`).

**Quality bar:**
- Input validation produces deterministic errors.
- Response time remains reasonable (no unnecessary round trips).

---

### Phase 4 — Client UI implementation
1. Identify where UX belongs:
   - Page-level changes in `client/src/pages/*`
   - Reusable widgets in `client/src/components/*`
2. Prefer existing composition:
   - Layout within `DashboardLayout`
   - Navigation updates via `TopNavigation` / `MobileBottomNav`
   - Consistent theming via `theme-provider` / `mode-toggle`
3. Reuse UI primitives:
   - `client/src/components/ui/button.tsx`, `badge.tsx`, chart components, etc.
   - If a new primitive is needed, add it to `client/src/components/ui/` and keep API consistent.

**Quality bar:**
- UI integrates with existing providers (branding/theme).
- Avoid duplicating component patterns that already exist (e.g., cards/tables in billing).

---

### Phase 5 — Testing and verification
1. **API behavior:**
   - Add/update `testsprite_tests` cases for new endpoints:
     - Validation errors (missing/invalid input)
     - Response time expectations where relevant
     - Error handling for upstream failures
2. **UI behavior:**
   - Add/extend component tests under `tests/components` if the repo uses them for the area you touched.
3. **Regression checks:**
   - Confirm existing flows (Dashboard, NotificationsBell, billing cards) still load and render.

**Quality bar:**
- New endpoints are covered for both “happy path” and validation failures.
- No unhandled exceptions during expected user interactions.

---

## Common Task Playbooks

### A) Add a new API endpoint backed by a service
1. Add service method in `server/services/<domain>.service.ts`.
2. Add route handler in `server/routes/<domain>.ts` (or relevant file).
3. Ensure request/response types align with `shared/schema.ts`.
4. Add/update `testsprite_tests` for:
   - invalid input → expect validation error
   - valid input → expect success shape
   - upstream failure simulation (if feasible) → expect controlled error response

**Files commonly touched:**
- `server/services/*.ts`
- `server/routes/*.ts`
- `shared/schema.ts`
- `testsprite_tests/*.py`

---

### B) Add a feature to the Dashboard
1. Locate entry page: `client/src/pages/Dashboard.tsx`.
2. Place reusable UI in `client/src/components/` (consider a domain folder if it exists).
3. Use layout: `client/src/components/layout/DashboardLayout.tsx`.
4. If feature relates to:
   - Notifications → integrate with `NotificationsBell.tsx` patterns
   - Billing/storage → reuse `client/src/components/billing/*` patterns
   - Branding/theme → ensure compatibility with `branding-provider.tsx` and `theme-provider.tsx`

---

### C) Extend notifications for a new event
1. Add a new `NotificationType` or payload shape in `server/services/notification.service.ts`.
2. Emit notifications from the relevant service (billing/storage/etc.).
3. Ensure UI updates are compatible with `client/src/components/NotificationsBell.tsx`.
4. Consider audit logging in parallel for admin/security relevance.

---

### D) Implement storage/bucket-related feature
1. Use/extend `MinioService` types:
   - `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`
2. Add route endpoint(s) to expose required operations.
3. Update billing/storage UI components:
   - `StorageOverviewCard.tsx`
   - `BucketUsageTable.tsx`

---

### E) Implement settings/branding feature
1. Review branding contract/provider:
   - `client/src/components/branding-provider.tsx`
   - `client/src/components/settings/AppBranding.tsx`
2. Ensure any persisted config has a shared type if server also uses it.
3. Keep theme interactions consistent with:
   - `client/src/components/theme-provider.tsx`
   - `client/src/components/mode-toggle.tsx`

---

## Codebase-Specific Best Practices

### Keep “contract drift” low
- If the client consumes a field, it should exist in a shared schema type (or a shared route contract).
- Avoid returning slightly different shapes across endpoints for the same entity.

### Prefer existing patterns for integrations
- Storage logic stays in `MinioService`.
- SFTP logic stays in `SftpGoService`.
- Billing computations live in `BillingService`.
- Logging and notifications should be centralized (Audit/Notification services).

### Build UI with existing primitives and layout
- Use `client/src/components/ui/*` primitives rather than bespoke button/badge styles.
- Ensure pages work within `DashboardLayout` and do not replicate navigation.

### Error handling matters (tests enforce it)
- `testsprite_tests` explicitly checks error handling and response time; keep endpoints robust:
  - Validate early
  - Return consistent error responses
  - Don’t leak internal stack traces to clients

---

## Key Files & What They’re For (Quick Reference)

### Shared
- `shared/schema.ts` — canonical domain models (`Product`, `Order`, `Account`, `Subscription`, `Bucket`, etc.).
- `shared/routes.ts` — route helpers; includes `buildUrl` for consistent URL creation.

### Server routes
- `server/routes/smtp.ts` — SMTP configuration/testing endpoints (pattern for route handlers).
- `server/replit_integrations/auth/routes.ts` — auth route registration.

### Server services
- `server/services/minio.service.ts` — storage/bucket operations + metrics/quota/lifecycle types.
- `server/services/sftpgo.service.ts` — SFTPGo integration and types (`SftpGoUser`, `SftpGoFilesystem`, etc.).
- `server/services/notification.service.ts` — notification types and dispatch logic.
- `server/services/billing.service.ts` — pricing/usage/invoice logic (`PricingConfig`, `UsageSummary`, `InvoiceData`).
- `server/services/audit.service.ts` — audit logging (`AuditDetails`, `AuditLogPayload`).
- `server/services/domain-service.ts` — domain verification (`DomainVerificationResult`).

### Client
- `client/src/pages/Dashboard.tsx` — dashboard entry.
- `client/src/pages/not-found.tsx` — 404.
- `client/src/components/layout/DashboardLayout.tsx` — primary authenticated layout.
- `client/src/components/TopNavigation.tsx` — top nav.
- `client/src/components/MobileBottomNav.tsx` — mobile nav.
- `client/src/components/NotificationsBell.tsx` — notifications UI.
- `client/src/components/branding-provider.tsx` — branding context and hooks.
- `client/src/components/settings/AppBranding.tsx` — branding settings screen.
- `client/src/components/theme-provider.tsx` — theme context.
- `client/src/components/mode-toggle.tsx` — theme toggle.
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx` — UI primitives.
- `client/src/components/billing/*` — billing and usage UI building blocks.

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — validation + error handling expectations.
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — response time + error handling expectations.

---

## Definition of Done (Feature Delivery Checklist)

### Functional
- [ ] Shared schema updated (if cross-stack contract changed)
- [ ] Service method(s) implemented with clear typed boundaries
- [ ] Route handler(s) added/updated with validation + consistent responses
- [ ] UI implemented using existing layout/primitives
- [ ] Notifications/audit added where relevant

### Quality
- [ ] Error cases return correct status codes and messages
- [ ] Endpoint behavior aligns with `testsprite_tests` expectations
- [ ] No duplicated UI primitives; reuse `client/src/components/ui/*`
- [ ] Changes are localized to the right layer (routes thin, services thick)

### Tests
- [ ] New/updated tests for validation and error handling
- [ ] Any performance-sensitive endpoint considered in response time tests

---

## Implementation Notes (Practical Guardrails)
- Prefer additive changes to `shared/schema.ts` to minimize breaking UI/server code.
- When adding a new workflow that changes state, consider:
  - `AuditService` for traceability
  - `NotificationService` for user visibility
- For storage-related features, reuse `MinioService` types to avoid type divergence (`UsageMetrics`, `StorageQuota`, etc.).
- For any new UI surface on the dashboard, ensure it works within `DashboardLayout` and respects theme/branding providers.
