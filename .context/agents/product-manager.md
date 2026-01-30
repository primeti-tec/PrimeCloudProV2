# Feature Developer Agent Playbook — PrimeCloudProV2

## Purpose
Build end-to-end product features in **PrimeCloudProV2** safely and consistently: from shared schema/types → server routes/services → client pages/components → tests and validation.

This playbook is optimized for adding or changing user-facing functionality (UI + API + business logic), not for pure infrastructure work.

---

## Codebase Map (What to Touch, and When)

### 1) Shared (contracts between client/server)
**Primary responsibility:** canonical types and route helpers used across the app.

- **`shared/schema.ts`**
  - Home of exported domain models/types such as:
    - `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`
  - Feature work often starts here if you need new fields or new shared structures.
- **`shared/routes.ts`**
  - Contains `buildUrl` and likely route definitions/helpers used by client/server.
  - Update when adding new endpoints or changing route conventions.

**When to modify shared:**
- Adding a field to a core entity that is used in UI + API.
- Introducing a new DTO-like shape (request/response contract).
- Changing route paths or URL conventions.

---

### 2) Server (API, orchestration, integrations)
**Primary responsibility:** HTTP handling, auth, business logic, integrations.

#### Routes / Controllers
- **`server/routes/smtp.ts`**
  - `handleConfigureSMTP`, `handleTestSMTP`
  - Useful example of request handling patterns and error responses.
- **`server/replit_integrations/auth/routes.ts`**
  - `registerAuthRoutes`
  - Reference for auth-protected flows and route registration.

#### Services (feature logic lives here)
Service layer is a clear architectural pattern in this repo.

- **`server/services/minio.service.ts`**
  - `MinioService` + types: `MinioConfig`, `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`
  - Used for object storage operations, metrics, quotas, lifecycle rules.
- **`server/services/sftpgo.service.ts`**
  - `SftpGoService` + types: `SftpGoConfig`, `SftpGoUser`, `SftpGoFilesystem`, `SftpGoVirtualFolder`
- **`server/services/notification.service.ts`**
  - `NotificationService`, `NotificationType`, `NotificationPayload`
  - Central for emitting/recording user notifications.
- **`server/services/billing.service.ts`**
  - `BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`
  - Used for plan/usage/invoice related features.
- **`server/services/audit.service.ts`**
  - `AuditService`, `AuditDetails`, `AuditLogPayload`
  - For audit logging on sensitive actions.
- **`server/services/domain-service.ts`**
  - `DomainVerificationResult`
  - For domain verification type flows.

**When to modify services:**
- Any new business capability should be implemented in a service first.
- Routes should be thin: validate input, call service, shape output.

---

### 3) Client (UI pages and components)
**Primary responsibility:** user workflows, pages, reusable components, UI state.

#### Pages
- **`client/src/pages/Dashboard.tsx`**
  - Core authenticated landing page; good for patterns on data presentation.
- **`client/src/pages/not-found.tsx`**
  - Pattern for error/empty route state.

#### Layout / Providers
- **`client/src/components/layout/DashboardLayout.tsx`**
  - App shell; navigation and common layout conventions.
- **`client/src/components/TopNavigation.tsx`**
  - Primary navigation patterns and possibly auth/user actions.
- **`client/src/components/theme-provider.tsx`**, **`client/src/components/mode-toggle.tsx`**
  - Theme handling patterns.
- **`client/src/components/branding-provider.tsx`**
  - `BrandingProvider`, `useBranding`, `BrandingConfig`
  - Follow this when adding branded visuals or organization-level branding.

#### Feature Components
- **Notifications**
  - **`client/src/components/NotificationsBell.tsx`** (has `NotificationsBellProps`)
- **Settings**
  - **`client/src/components/settings/AppBranding.tsx`**
- **Billing**
  - **`client/src/components/billing/UpgradeRequestsCard.tsx`**
  - **`client/src/components/billing/StorageOverviewCard.tsx`**
  - **`client/src/components/billing/ImperiusStatsCard.tsx`**
  - **`client/src/components/billing/BucketUsageTable.tsx`**

#### UI primitives / design system
- **`client/src/components/ui/button.tsx`** (`ButtonProps`)
- **`client/src/components/ui/badge.tsx`** (`BadgeProps`)
- **`client/src/components/ui/chart.tsx`** (`ChartConfig`)
- **`client/src/components/ui-custom.tsx`** (`ButtonProps` — note there are multiple `ButtonProps` exports in repo)

**When to modify client:**
- Prefer adding new UI in feature folders/components mirroring existing patterns (e.g., `billing/`, `settings/`).
- Use existing UI primitives for consistency.

---

### 4) Tests
Two test “styles” appear:

- **`testsprite_tests/*.py`**
  - Example API tests with `run_test` and `find_locator` patterns:
    - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
    - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - These are valuable when introducing new endpoints or changing validation/error response semantics.

- **`tests/components`**
  - Component tests exist (directory present). Follow existing conventions there for UI behavior validation.

**When to add tests:**
- New endpoint: add/extend testsprite API test coverage for validation + error handling.
- UI feature: add/extend component tests where applicable; ensure empty/error states are covered.

---

## Feature Development Workflow (End-to-End)

### Step 0 — Clarify the “Contract”
Before coding, confirm:
- Which user persona triggers the feature?
- What API inputs/outputs are needed?
- Which shared types must represent this?

**Primary files:**
- `shared/schema.ts`
- `shared/routes.ts`

Deliverable: a concrete request/response shape and any new/updated types.

---

### Step 1 — Implement/Extend Service Logic (Server)
**Goal:** encapsulate business logic in `server/services/*`.

Checklist:
- Add a method to the appropriate service (or a new service if none fits).
- Prefer returning typed objects (`BucketInfo`, `UsageSummary`, etc.) or newly introduced shared types.
- Ensure errors are predictable (see “Error Handling” section).

**Common service choices:**
- Storage features → `MinioService`
- File transfer/users → `SftpGoService`
- Alerts → `NotificationService`
- Billing/usage → `BillingService`
- Audit trail → `AuditService`

Deliverable: unit-of-work method that can be invoked by a route.

---

### Step 2 — Add/Update Route Handler (Server)
**Goal:** thin controller that validates input and delegates to service.

Checklist:
- Add a route in the appropriate route module under `server/routes/*` (or wherever route registration is centralized).
- Validate request parameters/body early.
- Call the service and map to response DTO.
- Ensure error responses are consistent and testable.

Reference patterns:
- `server/routes/smtp.ts` for handler structure and “test” endpoint behavior.
- `server/replit_integrations/auth/routes.ts` for route registration/auth patterns.

Deliverable: a reachable endpoint with stable response schema.

---

### Step 3 — Wire Client Data Flow + UI
**Goal:** present the feature in UI with consistent layout and components.

Checklist:
- Decide placement:
  - Dashboard-level → `client/src/pages/Dashboard.tsx`
  - Settings → `client/src/components/settings/*`
  - Billing → `client/src/components/billing/*`
- Use existing layout wrappers:
  - `DashboardLayout`
  - `TopNavigation`
- Use UI primitives:
  - `Button`, `Badge`, charts, etc.
- Handle all UI states:
  - Loading
  - Empty
  - Error
  - Success
- If feature affects branding/theming, integrate with:
  - `BrandingProvider` / `useBranding`
  - Theme provider/mode toggle

Deliverable: UI that calls the endpoint and renders the results with full state coverage.

---

### Step 4 — Add Notifications and Audit (when appropriate)
Use when the feature changes data, affects billing, creates/deletes resources, or changes security posture.

- Emit notification via `NotificationService` (choose appropriate `NotificationType`).
- Add audit logging via `AuditService` (include relevant `AuditDetails`).

Deliverable: traceability and user visibility for important actions.

---

### Step 5 — Testing & Validation
**API:**
- Add tests in `testsprite_tests` focusing on:
  - Validation errors (bad input)
  - Auth errors (if applicable)
  - Response time expectations (if existing tests enforce it)
  - Correct error payload shape (align with existing tests TC014/TC017)

**UI:**
- Add/extend component tests under `tests/components` if the repo already uses a testing framework there.
- At minimum, validate:
  - Component renders with example data
  - Empty state
  - Error state

Deliverable: regression protection for the new feature.

---

## Best Practices (Derived from Repo Patterns)

### 1) Keep business logic in services
- Routes should not orchestrate multiple subsystems directly—delegate to `server/services/*`.
- If you find yourself writing “mini business rules” in a route, move them to a service method.

### 2) Use shared schema/types as the “source of truth”
- `shared/schema.ts` is the best place to ensure client/server agree.
- Prefer reusing existing exported types like `Account`, `Bucket`, `Notification` rather than duplicating shapes in UI.

### 3) Respect existing feature boundaries in client
- Billing UI → `client/src/components/billing/*`
- Branding/settings → `client/src/components/settings/*`
- Global shell/navigation → `layout/` and `TopNavigation`

### 4) Prefer existing UI primitives
- Use `client/src/components/ui/*` and established patterns.
- Note there is also `client/src/components/ui-custom.tsx` exporting `ButtonProps`. Be careful with naming collisions and imports—prefer the canonical UI primitives unless there’s a clear reason.

### 5) Bake in observability: notifications + audit
- For user-facing changes: consider a notification.
- For security/billing/resource changes: add audit logs.

---

## Common Feature Recipes (Concrete Play Patterns)

### Recipe A — Add a new “Bucket lifecycle rule” UI
1. **Shared**
   - Ensure lifecycle types align: `LifecycleRule` exists in both shared schema and `MinioService`.
2. **Server**
   - Add service method in `MinioService` for create/update/delete lifecycle rules.
   - Add route to call that method.
3. **Client**
   - Add a new component under `client/src/components/billing/` or storage-related area.
   - Display current rules, allow editing.
4. **Cross-cutting**
   - Send user notification on change.
   - Audit who changed what.
5. **Tests**
   - testsprite: validation (invalid rule, missing bucket), error handling.
   - UI: empty state when no rules exist.

---

### Recipe B — Add an admin setting (e.g., Branding or SMTP-like configuration)
1. **Client**
   - Extend `client/src/components/settings/AppBranding.tsx` or add adjacent settings component.
   - Use `BrandingProvider` patterns to apply the change.
2. **Server**
   - Add a route handler similar to `server/routes/smtp.ts`.
3. **Shared**
   - Add/extend config type in `shared/schema.ts` if it’s used by both sides.
4. **Tests**
   - API tests for validation and error payload shape.

---

### Recipe C — Add a billing usage widget
1. **Server**
   - Add method in `BillingService` returning `UsageSummary` or a new shared type.
2. **Client**
   - Add a card under `client/src/components/billing/*` (follow existing card patterns like `StorageOverviewCard.tsx`).
3. **UI**
   - Use chart primitives (`client/src/components/ui/chart.tsx`) if visualizing.
4. **Tests**
   - testsprite: endpoint response correctness and error handling.
   - Component tests for various usage states.

---

## Error Handling & Validation Conventions (Practical Guidance)
Because tests exist specifically for “error handling and validation” (TC014/TC017), treat this as a contract.

- Validate inputs at the API boundary (route handler).
- Return structured, consistent errors (status code + message + optional details).
- Ensure “sad path” responses are deterministic and testable:
  - Missing/invalid params
  - Unauthorized/forbidden
  - Dependency failures (MinIO/SFTPGo down)
  - Timeouts

When adding a new endpoint, also add a testsprite test case that:
- Sends invalid input and asserts the exact error schema.
- Measures response timing if the suite enforces thresholds.

---

## Conventions & Naming Tips
- **Services:** `XyzService` in `server/services/xyz.service.ts`
- **Props types:** `ComponentNameProps` where possible (already used: `NotificationsBellProps`, `DashboardLayoutProps`)
- **Shared models:** prefer exporting from `shared/schema.ts` and importing everywhere else.

---

## “Touch List” for Feature PRs (What reviewers will expect)
Include (as applicable):
- [ ] Shared type updates in `shared/schema.ts`
- [ ] Server service method(s) in `server/services/*`
- [ ] Route handler additions/changes in `server/routes/*` or auth routes as needed
- [ ] Client UI updates in `client/src/pages/*` and/or `client/src/components/*`
- [ ] Notifications and audit logging for sensitive actions
- [ ] Testsprite tests for API validation/error handling
- [ ] UI tests for new components and states
- [ ] Empty/loading/error states implemented

---

## Key Files Quick Reference
- **Shared contracts**
  - `shared/schema.ts` — domain models/types
  - `shared/routes.ts` — `buildUrl`, routing helpers
- **Server**
  - `server/routes/smtp.ts` — handler patterns
  - `server/replit_integrations/auth/routes.ts` — auth route registration
  - `server/services/minio.service.ts` — storage, buckets, lifecycle, metrics
  - `server/services/sftpgo.service.ts` — SFTPGo users/filesystems
  - `server/services/notification.service.ts` — user notifications
  - `server/services/billing.service.ts` — pricing, usage, invoices
  - `server/services/audit.service.ts` — audit logging
  - `server/services/domain-service.ts` — domain verification
- **Client**
  - `client/src/pages/Dashboard.tsx` — main page patterns
  - `client/src/components/layout/DashboardLayout.tsx` — shell/layout
  - `client/src/components/TopNavigation.tsx` — navigation
  - `client/src/components/branding-provider.tsx` — branding patterns
  - `client/src/components/settings/AppBranding.tsx` — settings example
  - `client/src/components/billing/*` — billing UI patterns
  - `client/src/components/ui/*` — primitives (button, badge, chart, etc.)
- **Tests**
  - `testsprite_tests/TC014_*` — response time + error handling
  - `testsprite_tests/TC017_*` — validation + error handling
  - `tests/components/*` — UI component tests

---

## Agent Operating Rules (Guardrails)
1. **Don’t bypass services.** If you need business logic, add/extend a service method.
2. **Don’t introduce untyped contracts.** Update `shared/schema.ts` for shared shapes.
3. **Don’t ship happy-path-only UI.** Always implement loading/empty/error.
4. **Don’t change error shapes casually.** Update testsprite tests if you must, but prefer backward-compatible errors.
5. **Prefer consistency over novelty.** Reuse existing UI primitives and patterns.

---
