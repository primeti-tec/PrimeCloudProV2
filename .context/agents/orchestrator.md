# Feature-Developer Agent Playbook (PrimeCloudProV2)

> **Goal:** Implement product features end-to-end (DB/schema → server/services/routes → client UI) while preserving PrimeCloudProV2 patterns, types, and conventions. Optimize for correctness, maintainability, and consistent UX.

---

## 0) Project Snapshot (What You’re Building In)

### Architecture (Observed)
- **Shared types & schema:** `shared/schema.ts` (central domain models/types)
- **Server (API + business logic):**
  - Routes/controllers: `server/routes/**`, `server/replit_integrations/auth/**`
  - Service layer: `server/services/**` (class-based, encapsulated business logic)
- **Client (React UI):**
  - Pages: `client/src/pages/**`
  - Components: `client/src/components/**`
  - UI primitives: `client/src/components/ui/**` + `client/src/components/ui-custom.tsx`
- **Testing:** `tests/**` + `testsprite_tests/**` (includes Python-based endpoint checks)

### Most Important Existing Patterns
- **Service Layer is primary orchestration point** (e.g., `MinioService`, `BillingService`, `NotificationService`, `AuditService`, `SftpGoService`)
- **Shared domain models** exported from `shared/schema.ts` are used across layers
- **UI uses reusable primitives** (`client/src/components/ui/*`) and app-level components (layout, billing, settings, admin)

---

## 1) Where to Work: Ownership Map (Files/Areas to Focus)

### Shared / Domain
- **`shared/schema.ts`**
  - Exports core domain types: `Product`, `Order`, `Account`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, etc.
  - **Rule:** if you introduce/extend a domain entity used by both server and client, update here first.
- **`shared/routes.ts`**
  - `buildUrl` export suggests centralized route construction.
  - **Rule:** prefer route helpers over hard-coded paths when available.

### Server
- **`server/services/*.ts`**
  - Implement/extend business logic here first.
  - Existing services to learn from:
    - `server/services/minio.service.ts` (storage, usage, lifecycle rules)
    - `server/services/billing.service.ts` (pricing, invoices, usage)
    - `server/services/notification.service.ts` (notification payloads/types)
    - `server/services/audit.service.ts` (audit logs)
    - `server/services/sftpgo.service.ts` (SFTPGo integration)
- **`server/routes/*.ts`**
  - Controllers/handlers that translate HTTP → service calls.
  - Example: `server/routes/smtp.ts` exports `handleConfigureSMTP`, `handleTestSMTP`.
- **`server/replit_integrations/auth/routes.ts`**
  - Authentication-related route registration.

### Client
- **Pages:** `client/src/pages/*`
  - Route-level data fetching, page composition.
  - Examples: `Dashboard.tsx`, `not-found.tsx`
- **App components (feature areas):**
  - Layout: `client/src/components/layout/DashboardLayout.tsx`
  - Navigation: `client/src/components/TopNavigation.tsx`, `MobileBottomNav.tsx`
  - Branding: `client/src/components/branding-provider.tsx`, `client/src/components/settings/AppBranding.tsx`
  - Billing: `client/src/components/billing/*` (e.g., usage tables/cards)
  - Notifications: `client/src/components/NotificationsBell.tsx`
- **UI primitives:** `client/src/components/ui/*` and `client/src/components/ui-custom.tsx`
  - **Rule:** use existing primitives for consistent styling and behavior.

### Tests
- **`testsprite_tests/*.py`**
  - Includes API validation and error-handling checks (e.g., TC014/TC017).
  - **Rule:** if you add/modify endpoints, consider updating or adding tests here to cover response time, validation, and error behavior.

---

## 2) Golden Rules (Repo-Specific Best Practices)

1. **Service-first design:** implement domain logic in `server/services/*` and keep route handlers thin.
2. **Shared schema is the contract:** types in `shared/schema.ts` should match what server returns and client consumes.
3. **Consistency over novelty:** prefer existing components (cards, tables, buttons) and patterns in `client/src/components/**`.
4. **Audit & notifications are first-class concerns:**
   - For user-impacting changes, consider adding audit log entries (`AuditService`) and/or notifications (`NotificationService`) where appropriate.
5. **Error handling and validation matter:** testsprite includes endpoint error-handling validation—don’t return inconsistent shapes or silent failures.
6. **Use central route utilities:** prefer `shared/routes.ts` (`buildUrl`) where applicable to avoid route drift.
7. **Keep integrations isolated:** external systems (MinIO, SFTPGo, SMTP, etc.) should be wrapped in their respective service classes, not scattered across route handlers or UI.

---

## 3) Standard Workflow: Implementing a Feature End-to-End

### Step 1 — Define the feature boundary
- Which domain entity/entities are involved? (Account/Bucket/Subscription/Notification/etc.)
- Which service should own the logic? (MinIO → `MinioService`, Billing → `BillingService`, etc.)
- Which UI area owns it? (billing cards/tables, settings, admin, dashboard)

**Deliverable:** short “scope note” listing affected files (shared/server/client/tests).

---

### Step 2 — Update/Add Shared Types (Contract-First)
**When to edit `shared/schema.ts`:**
- New domain object
- New fields returned by API and consumed by UI
- Any shared validation shape

**Checklist:**
- [ ] Add/extend exported types (keep naming consistent with existing exports like `Bucket`, `Subscription`, etc.)
- [ ] Ensure server responses can be typed using these exports
- [ ] Ensure client state/props can use the same types

---

### Step 3 — Implement Service Logic (Server)
**Where:** `server/services/<domain>.service.ts`

**Typical pattern:**
- Add a method to the relevant service (or create a new service if truly new domain)
- Keep methods cohesive and testable (input → output, no UI concerns)
- Centralize integration calls (MinIO/SFTPGo/SMTP) in the service layer

**Checklist:**
- [ ] Add method signature + return type aligned with `shared/schema.ts`
- [ ] Handle error cases explicitly (bad request vs internal errors)
- [ ] Consider emitting audit logs (AuditService) for sensitive actions
- [ ] Consider notifications (NotificationService) for user-visible changes

---

### Step 4 — Add/Update Route Handler (Controller)
**Where:** `server/routes/**`

**Keep routes thin:**
- Parse/validate request
- Call service method
- Map result to response

**Checklist:**
- [ ] Ensure consistent HTTP codes (400/401/403/404/409/500 as appropriate)
- [ ] Ensure response shape matches shared types
- [ ] Avoid duplicating service logic in routes

---

### Step 5 — Wire Up Client UI
**Where:** `client/src/pages/**` and/or `client/src/components/**`

**Approach:**
- Use existing layout (`DashboardLayout`) and navigation components
- Use existing UI primitives (`client/src/components/ui/*`) and patterns from billing/settings/admin components

**Checklist:**
- [ ] Add/extend components with minimal prop surface
- [ ] Use shared types for props/state where possible
- [ ] Handle loading/empty/error states
- [ ] Keep pages as composition; push reusable UI into components

---

### Step 6 — Update Tests (Minimum Bar)
**Where:** `testsprite_tests/**` and/or `tests/**`

**Minimum bar for new/changed endpoints:**
- Validate error handling and response shape
- Cover validation failures (missing params, invalid payload)
- Cover response-time baseline if relevant (testsprite has response-time checks)

**Checklist:**
- [ ] Add/extend testsprite endpoint test for new route(s)
- [ ] Verify status codes and error messages are stable and meaningful

---

## 4) Common Feature Recipes (Copy the Pattern)

### A) “Add a new API endpoint to expose metrics/data”
1. Add shared type(s) in `shared/schema.ts` (e.g., `UsageMetrics`)
2. Add service method in an existing domain service (e.g., `MinioService.getUsageMetrics()`)
3. Add route handler under `server/routes/*`
4. Add client UI:
   - A card/table in `client/src/components/billing/*` or relevant feature folder
   - Wire into `Dashboard.tsx` or appropriate page
5. Add testsprite test verifying:
   - success response
   - invalid inputs
   - error behavior

---

### B) “Add a settings screen / settings option”
1. Define config shape in shared schema (if shared)
2. Implement server storage/update logic in a service (or existing service)
3. Add route handler(s)
4. Add UI under `client/src/components/settings/*`
   - Follow pattern of `AppBranding.tsx`
5. Consider audit logging for settings changes

---

### C) “Add a notification-triggering action”
1. Implement core action in the owning service
2. Use `NotificationService` to create and dispatch appropriate payload
   - Align with `NotificationType` and `NotificationPayload`
3. Ensure UI can display it (bell component exists: `NotificationsBell.tsx`)
4. Add test coverage for:
   - action result
   - notification creation behavior (as applicable)

---

### D) “Add storage/bucket behavior”
1. Prefer `MinioService` (types already exist: `BucketInfo`, `ObjectStats`, `StorageQuota`, `LifecycleRule`)
2. Keep MinIO integration within `server/services/minio.service.ts`
3. Expose data via a route
4. Render via existing billing/storage components:
   - `StorageOverviewCard.tsx`
   - `BucketUsageTable.tsx`

---

## 5) Conventions to Follow (From Existing Files)

### Naming & structure
- **Services:** `XxxService` in `server/services/xxx.service.ts`
- **Props & types:** `XxxProps` in component files (e.g., `DashboardLayoutProps`, `NotificationsBellProps`)
- **Shared models:** exported types in `shared/schema.ts` (single source of truth)

### UI consistency
- Prefer existing primitives:
  - `client/src/components/ui/button.tsx` (`ButtonProps`)
  - `client/src/components/ui/badge.tsx` (`BadgeProps`)
  - `client/src/components/ui-custom.tsx` (custom wrapper primitives)
- Prefer existing layout scaffolding:
  - `DashboardLayout.tsx`
  - `TopNavigation.tsx`
  - theme/branding providers

### Error handling consistency
- Testsprite includes endpoint error handling/validation checks; ensure:
  - predictable status codes
  - consistent JSON error shape (don’t return random strings in one route and JSON in another)
  - validation failures return 4xx, not 500

---

## 6) Feature Delivery Checklist (Definition of Done)

### Functional
- [ ] Feature works across relevant roles/accounts
- [ ] UI shows success + handles empty/loading/error states
- [ ] Server returns consistent, typed responses

### Code quality
- [ ] Business logic lives in `server/services/*`, not in routes/pages
- [ ] Shared schema updated for any cross-layer types
- [ ] Components are reusable and follow existing patterns

### Observability & safety
- [ ] Audit log recorded for sensitive actions (if applicable via `AuditService`)
- [ ] Notification generated for user-impacting events (if applicable via `NotificationService`)
- [ ] External integrations remain isolated (MinIO/SFTPGo/SMTP only in their services)

### Tests
- [ ] Endpoint(s) covered by testsprite test(s) for validation and error handling
- [ ] Any critical UI logic has appropriate tests (if the repo uses them in `tests/**`)

---

## 7) Key Files Reference (What They’re For)

### Shared
- `shared/schema.ts` — canonical domain types/models (Product/Order/Account/Subscription/Bucket/etc.)
- `shared/routes.ts` — route building utilities (`buildUrl`)

### Server
- `server/services/minio.service.ts` — storage lifecycle/usage/quota, bucket/object metrics
- `server/services/sftpgo.service.ts` — SFTPGo user/filesystem management integration
- `server/services/billing.service.ts` — pricing config, usage summary, invoices
- `server/services/notification.service.ts` — notification types/payloads + delivery orchestration
- `server/services/audit.service.ts` — audit logging payload/details
- `server/services/domain-service.ts` — domain verification (`DomainVerificationResult`)
- `server/routes/smtp.ts` — SMTP configure/test endpoints
- `server/replit_integrations/auth/routes.ts` — auth route registration

### Client
- `client/src/pages/Dashboard.tsx` — main dashboard page composition
- `client/src/components/layout/DashboardLayout.tsx` — app layout shell
- `client/src/components/TopNavigation.tsx` — top nav
- `client/src/components/NotificationsBell.tsx` — notifications UI entry point
- `client/src/components/branding-provider.tsx` + `client/src/components/settings/AppBranding.tsx` — branding configuration and UI
- `client/src/components/billing/*` — usage/upgrade/storage UI (cards and tables)
- `client/src/components/ui/*` and `client/src/components/ui-custom.tsx` — shared UI primitives

### Tests
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`

---

## 8) Practical “Start Here” Playbook for a New Feature

1. **Locate the closest existing feature folder** (billing/settings/admin/dashboard) and mirror structure.
2. **Add/confirm domain types** in `shared/schema.ts`.
3. **Implement service method** in the appropriate `server/services/*`.
4. **Expose via route handler** in `server/routes/*`.
5. **Integrate UI** using existing primitives and layout.
6. **Add/update testsprite tests** for endpoint validation + error handling.
7. **Sanity pass:** ensure audit/notification implications are handled for user-impacting changes.

---

## 9) Anti-Patterns to Avoid (Specific to This Repo)

- Putting MinIO/SFTPGo/SMTP API calls directly in route handlers or client code (keep them in services).
- Duplicating domain types in client-only files instead of using/expanding `shared/schema.ts`.
- Hardcoding URLs when `shared/routes.ts` utilities exist.
- Inconsistent error formats across endpoints (testsprite will surface this).
- Building one-off UI styles instead of using `client/src/components/ui/*` primitives.

---
