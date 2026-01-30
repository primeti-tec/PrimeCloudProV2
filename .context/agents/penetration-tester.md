# Feature Developer Agent Playbook — PrimeCloudProV2

## Mission
Deliver product features end-to-end (DB/schema → server routes/services → client UI → tests) while preserving the project’s conventions:
- **Shared, typed domain models** live in `shared/schema.ts` and route helpers in `shared/routes.ts`.
- **Server-side business logic** is encapsulated in `server/services/*.ts`.
- **HTTP handling** is implemented in `server/routes/*.ts` (and auth in `server/replit_integrations/auth`).
- **Client UI** is implemented in `client/src/pages` and `client/src/components/**` using the existing UI patterns.
- **Tests/automation** exist under `testsprite_tests/` (Python), and there may also be `tests/components` for UI-level tests.

---

## Where to Work (Areas of Responsibility)

### 1) Shared domain + API contracts
**Primary files**
- `shared/schema.ts`  
  Contains exported domain models like `Product`, `Order`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, etc.
- `shared/routes.ts`  
  Includes `buildUrl` and (typically) route constants/helpers used by client/server.

**When to touch**
- Adding/changing a domain entity’s shape.
- Adding shared validation schemas/types used across server & client.
- Introducing new API endpoints that should be referenced consistently on both sides.

---

### 2) Server routes (HTTP controllers)
**Primary directories**
- `server/routes/`  
  Example: `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/`  
  Example: `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)

**When to touch**
- Adding a new endpoint or expanding an existing endpoint’s request/response.
- Integrating with a service method (routes should stay thin).

**Rule of thumb**
- Routes: validate input, call service, map errors to HTTP responses, return typed payloads.
- Services: the real work (business logic).

---

### 3) Server services (business logic)
**Primary directory**
- `server/services/`

**Key services to reuse**
- `server/services/minio.service.ts` (`MinioService`, `LifecycleRule`, `UsageMetrics`, etc.)
- `server/services/sftpgo.service.ts` (`SftpGoService`, config and user/filesystem types)
- `server/services/notification.service.ts` (`NotificationService`, `NotificationType`)
- `server/services/billing.service.ts` (`BillingService`, `PricingConfig`, `InvoiceData`, `UsageSummary`)
- `server/services/audit.service.ts` (`AuditService`, `AuditDetails`)
- `server/services/domain-service.ts` (`DomainVerificationResult`)

**When to touch**
- Adding a new piece of business logic or integrating external systems (MinIO, SFTPGo, billing, notifications).
- Ensuring side effects are tracked (audit) and user-visible events are communicated (notifications).

**Best practice**
- Keep service APIs cohesive: add small, composable methods.
- Ensure error paths are explicit and meaningful; propagate enough context for routes to respond correctly.

---

### 4) Client pages & components (UI)
**Primary directories**
- `client/src/pages/`  
  Example: `Dashboard.tsx`, `not-found.tsx`
- `client/src/components/`  
  Examples: `TopNavigation.tsx`, `NotificationsBell.tsx`, `branding-provider.tsx`
- `client/src/components/ui/` and `client/src/components/ui-custom.tsx`  
  UI primitives and custom wrappers.

**Notable components/areas**
- Layout: `client/src/components/layout/DashboardLayout.tsx`
- Branding/settings: `client/src/components/settings/AppBranding.tsx`, `client/src/components/branding-provider.tsx`
- Billing UI: `client/src/components/billing/*` (usage cards, tables, upgrade requests)
- Theme: `client/src/components/theme-provider.tsx`, `client/src/components/mode-toggle.tsx`

**When to touch**
- Implementing new screens, widgets, or enhancing existing dashboard/billing/admin settings experiences.
- Wiring UI to server endpoints via the project’s existing fetch/client patterns (follow local conventions in nearby files).

---

### 5) Tests & automation
**Primary directories**
- `testsprite_tests/` (Python)  
  Includes API validation/error-handling tests (e.g., `TC017_API_Endpoint_Error_Handling_and_Validation.py`).
- `tests/components/` (if present)  
  Component-level tests and patterns.

**When to touch**
- Add/extend API tests for new endpoints, especially around validation and error handling.
- Add regression coverage for high-impact UI components if the repo uses component tests.

---

## Core Conventions to Follow (Derived from the Codebase)

### Service-layer centric architecture
The repository strongly favors a **Service Layer** pattern:
- Put integrations and logic in `server/services/*`.
- Keep `server/routes/*` as orchestration and HTTP translation only.
- Client components should remain presentational where possible, delegating data operations to page-level logic (following existing patterns in the relevant page files).

### Shared models as the source of truth
`shared/schema.ts` exports domain objects used across the stack. When adding or changing fields:
- Update the shared model/type first.
- Ensure server responses include the new fields.
- Update the client rendering and any validations.
- Add tests.

### UI primitives and consistency
Prefer existing UI components (e.g., `client/src/components/ui/button.tsx`, `badge.tsx`) and custom wrappers (`ui-custom.tsx`) rather than introducing new ad-hoc styling patterns.

### Audit + Notifications are first-class concerns
When a feature introduces user-impacting changes (billing changes, bucket lifecycle changes, access key creation, etc.):
- Consider logging via `AuditService`.
- Consider notifying via `NotificationService`.

---

## Standard Feature Workflow (End-to-End)

### Step 0 — Scoping checklist
Before coding, define:
- User story and acceptance criteria
- Affected domain model(s) in `shared/schema.ts`
- New/changed API endpoints in `server/routes/*`
- Service(s) impacted in `server/services/*`
- UI entry points: page(s) and component(s)
- Test plan: what to add in `testsprite_tests/` and/or UI tests

---

### Step 1 — Update shared contract (if needed)
**Touch:** `shared/schema.ts`, `shared/routes.ts`

- Add or update exported types/models (e.g., extend `Bucket` with a new attribute).
- If adding endpoints, ensure there is a consistent route path helper (often via `shared/routes.ts`).

**Definition of done**
- Shared types compile.
- Both server and client can import and use updated types without duplicating definitions.

---

### Step 2 — Implement/extend service logic
**Touch:** `server/services/*.ts`

- Add a method to the relevant service (e.g., `MinioService`) for the new capability.
- Keep method boundaries clear and testable.
- Handle external API failures and return meaningful errors upward.

**Common integrations**
- Storage/buckets: `MinioService`
- File access/users: `SftpGoService`
- Billing/usage: `BillingService`
- Notifications: `NotificationService`
- Auditing: `AuditService`

**Definition of done**
- Service method is callable with typed inputs.
- Error cases are explicit and informative.
- Side effects (audit/notification) are considered.

---

### Step 3 — Wire an HTTP route (controller)
**Touch:** `server/routes/*.ts`

- Validate request input (shape/types).
- Call the service method.
- Convert service results into the response payload.
- Standardize error responses (status codes + message).
- If relevant, ensure auth middleware/route registration matches existing patterns (see `registerAuthRoutes`).

**Definition of done**
- Endpoint responds with correct payload shape.
- Validation failures return predictable errors.
- Unexpected failures don’t leak sensitive details.

---

### Step 4 — Build/extend UI
**Touch:** `client/src/pages/*`, `client/src/components/**`

- Add UI components using existing primitives (`button`, `badge`, charts).
- Keep layout consistent with `DashboardLayout`.
- If feature relates to branding/theme, route through `BrandingProvider` and existing providers.
- If feature relates to notifications, integrate with `NotificationsBell` patterns.

**Definition of done**
- UI is consistent with existing styling/components.
- Loading/error/empty states exist.
- Feature is accessible from the intended navigation entry points (`TopNavigation`, etc.).

---

### Step 5 — Add tests and coverage
**Touch:** `testsprite_tests/*` (and/or `tests/components/*`)

Minimum expectations for new API features:
- Happy path test
- Validation error test
- Error handling test (external integration failure, timeouts, etc.)

The repo already has API error-handling test patterns in:
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**Definition of done**
- New tests are deterministic and do not depend on fragile timing.
- Tests assert response codes and response shapes.

---

## Common Task Playbooks

### A) Add a new API endpoint (server + shared + tests)
1. **Define route contract**
   - Add route path helper in `shared/routes.ts` (or align with existing route pattern).
   - Add request/response types in `shared/schema.ts` if needed.
2. **Implement service method**
   - Add method in the appropriate `server/services/*`.
   - Include audit/notification where applicable.
3. **Add route handler**
   - Create/extend file in `server/routes/*`.
   - Validate inputs; call service; return typed response.
4. **Add tests**
   - Add a `testsprite_tests/TC0xx_...py` test covering success + validation + failure.

**Quality bar**
- No duplicated type definitions between server and client.
- Predictable error handling (especially for validation).

---

### B) Extend MinIO bucket behavior (lifecycle, quotas, metrics)
**Primary service:** `server/services/minio.service.ts`  
**Related shared model:** `LifecycleRule` in `shared/schema.ts` and/or `server/services/minio.service.ts`

Workflow:
1. Add/extend model/type if the UI needs new fields (shared contract first).
2. Extend `MinioService` with a single-purpose method:
   - Examples: add lifecycle rule, compute usage, return quotas.
3. Add route in `server/routes/*` to expose the new capability.
4. Update billing/storage UI:
   - `client/src/components/billing/StorageOverviewCard.tsx`
   - `client/src/components/billing/BucketUsageTable.tsx`
5. Add API tests focused on error-handling and validation.

---

### C) Add a notification-triggering feature
**Primary service:** `server/services/notification.service.ts`  
**UI surface:** `client/src/components/NotificationsBell.tsx`

Workflow:
1. Define notification payload shape and type usage:
   - Reuse/extend `NotificationType` and `NotificationPayload`.
2. Call `NotificationService` from the relevant business operation service.
3. Ensure UI properly renders and updates:
   - Align with existing `NotificationsBell` props and usage patterns.
4. Add an audit log if it’s a significant event:
   - Use `AuditService` where appropriate.

---

### D) Add a billing-related feature (pricing, invoices, usage)
**Primary service:** `server/services/billing.service.ts`  
**UI components:** `client/src/components/billing/*`

Workflow:
1. Extend billing service types (`PricingConfig`, `InvoiceData`, `UsageSummary`) as needed.
2. Ensure server endpoints return consistent shapes for UI cards/tables.
3. Update UI components:
   - `ImperiusStatsCard`, `StorageOverviewCard`, `UpgradeRequestsCard`.
4. Add tests for calculations and error paths.

---

## Implementation Checklists (Definition of Done)

### Backend DoD
- [ ] Shared schema/types updated (if contract changed)
- [ ] Service method implemented with clear inputs/outputs
- [ ] Route validates input and returns stable response schema
- [ ] Error handling covers validation and upstream dependency failures
- [ ] Audit/notifications considered (when applicable)

### Frontend DoD
- [ ] Uses existing UI primitives and layout patterns
- [ ] Handles loading/error/empty states
- [ ] Respects theme/branding providers if relevant
- [ ] No duplicated backend types (import shared types where appropriate)

### Testing DoD
- [ ] API tests for: success, validation error, error handling
- [ ] Regression coverage for critical flows
- [ ] Tests are reliable and environment-appropriate

---

## Key Files Reference (Quick Map)

### Shared
- `shared/schema.ts` — domain models and shared types (e.g., `Product`, `Order`, `Subscription`, `Bucket`, `Notification`)
- `shared/routes.ts` — route utilities (e.g., `buildUrl`)

### Server
- `server/routes/smtp.ts` — SMTP configure/test handlers (example of route handler patterns)
- `server/replit_integrations/auth/routes.ts` — auth route registration pattern
- `server/services/minio.service.ts` — storage/bucket/usage/lifecycle logic
- `server/services/sftpgo.service.ts` — SFTPGo integration (users, filesystem, folders)
- `server/services/notification.service.ts` — notifications
- `server/services/billing.service.ts` — billing, pricing, invoices, usage
- `server/services/audit.service.ts` — audit logs
- `server/services/domain-service.ts` — domain verification

### Client
- `client/src/pages/Dashboard.tsx` — dashboard entry point
- `client/src/components/layout/DashboardLayout.tsx` — primary authenticated layout
- `client/src/components/TopNavigation.tsx` — top navigation
- `client/src/components/NotificationsBell.tsx` — notifications UI
- `client/src/components/branding-provider.tsx` — branding context/provider
- `client/src/components/settings/AppBranding.tsx` — branding settings UI
- `client/src/components/theme-provider.tsx`, `mode-toggle.tsx` — theme management
- `client/src/components/ui/button.tsx`, `badge.tsx` — UI primitives
- `client/src/components/ui-custom.tsx` — custom UI wrappers/patterns
- `client/src/components/billing/*` — billing & usage UI modules

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — validation & error handling pattern
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — response time + error handling pattern

---

## Guardrails (Avoid These)
- Don’t put business logic directly in route handlers—add/extend a service.
- Don’t define “client-only” copies of domain models—update `shared/schema.ts` and import shared types.
- Don’t bypass UI primitives—reuse `client/src/components/ui/*` for consistency.
- Don’t add endpoints without tests for validation and failure modes (existing tests emphasize this).

---

## Feature Developer Operating Rhythm
1. Start from **shared contract** (what is the data?).
2. Implement in **service** (how does it work?).
3. Expose via **route** (how is it accessed?).
4. Render in **UI** (how is it used?).
5. Lock it in with **tests** (how do we prevent regressions?).

This playbook is optimized for PrimeCloudProV2’s service-centric architecture and shared schema approach—follow it to deliver features quickly without breaking conventions.
