# Feature-Developer Agent Playbook — PrimeCloudProV2

## Mission
Deliver end-to-end product features (API + services + UI) **safely and consistently** within the PrimeCloudProV2 architecture. Prefer incremental changes that align with established patterns: **shared schema/types**, **server routes → services**, and **client pages/components**.

---

## 1) Where to Work (Focus Areas)

### A. Shared Domain Models & Contracts
Use shared types to keep server + client aligned.

- **Primary file**
  - `shared/schema.ts`  
    Exports key domain models: `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`.
- **Routing helpers**
  - `shared/routes.ts` (notable export: `buildUrl`)

**When to touch**
- Adding/changing a domain field used by both API and UI.
- Introducing a new domain entity or extending an existing one.

**Rule**
- Prefer adding fields in `shared/schema.ts` first, then update server/service logic and UI usage.

---

### B. Server (API + Business Logic)
Server is structured around route handlers and service classes.

- **Services (core business logic)**
  - `server/services/minio.service.ts` — `MinioService` and related types (`MinioConfig`, `BucketInfo`, `UsageMetrics`, etc.)
  - `server/services/sftpgo.service.ts` — `SftpGoService` + SFTPGo domain types
  - `server/services/notification.service.ts` — `NotificationService`, `NotificationType`
  - `server/services/billing.service.ts` — `BillingService`, billing types (`PricingConfig`, `InvoiceData`)
  - `server/services/audit.service.ts` — `AuditService`, audit payload types
  - `server/services/domain-service.ts` — domain verification (`DomainVerificationResult`)
- **Routes / controllers**
  - `server/routes/smtp.ts` — `handleConfigureSMTP`, `handleTestSMTP`
  - `server/replit_integrations/auth/routes.ts` — `registerAuthRoutes`

**When to touch**
- Any feature involving integrations (MinIO, SFTPGo), billing, notifications, audit logging, or SMTP.

**Rule**
- Put orchestration and domain logic in `server/services/*` and keep routes thin (validate → call service → respond).

---

### C. Client (UI)
React UI is organized by pages and reusable components.

- **Pages**
  - `client/src/pages/Dashboard.tsx`
  - `client/src/pages/not-found.tsx`
- **Layout / navigation**
  - `client/src/components/layout/DashboardLayout.tsx`
  - `client/src/components/TopNavigation.tsx`
  - `client/src/components/MobileBottomNav.tsx`
- **UI system**
  - `client/src/components/ui/*` (e.g., `ui/button.tsx`, `ui/badge.tsx`, `ui/chart.tsx`)
  - `client/src/components/ui-custom.tsx` (custom `ButtonProps`)
- **Branding & theming**
  - `client/src/components/branding-provider.tsx` (`BrandingProvider`, `useBranding`)
  - `client/src/components/theme-provider.tsx`
  - `client/src/components/mode-toggle.tsx`
  - `client/src/components/settings/AppBranding.tsx`
- **Feature components**
  - Notifications: `client/src/components/NotificationsBell.tsx`
  - Billing:  
    `client/src/components/billing/UpgradeRequestsCard.tsx`  
    `client/src/components/billing/StorageOverviewCard.tsx`  
    `client/src/components/billing/ImperiusStatsCard.tsx`  
    `client/src/components/billing/BucketUsageTable.tsx`
- **Admin**
  - `client/src/components/admin/*` (directory present; inspect for patterns before extending)

**Rule**
- Reuse existing UI components (`ui/*`) and patterns from existing feature cards (billing components) to keep UX consistent.

---

### D. Tests / Regression Coverage
- `testsprite_tests/*` includes API tests such as:
  - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**Rule**
- For new endpoints or endpoint behavior changes, add/update tests in this suite (or mirror their style/patterns).

---

## 2) Feature Delivery Workflow (End-to-End)

### Step 0 — Define the Feature Contract
1. Identify the domain object(s) impacted (e.g., `Bucket`, `Notification`, `Subscription`).
2. Update/add types in `shared/schema.ts` if the contract changes.
3. Identify the UI entry point:
   - New page vs extending `Dashboard` vs adding a card/component.

**Deliverable:** short “contract” note: request/response shapes + UI state needs.

---

### Step 1 — Implement/Extend Service Layer (Server)
1. Find the correct service:
   - Storage-related: `MinioService`
   - File transfer/users: `SftpGoService`
   - Billing: `BillingService`
   - Events/alerts: `NotificationService`
   - Compliance/tracking: `AuditService`
2. Add a new method or extend an existing one.
3. Ensure service methods return clean typed objects (matching shared types where applicable).
4. Add audit/notification hooks if the feature changes state or is security-relevant.

**Best practice (repo-derived):**
- Prefer adding types near the service (`MinioConfig`, `UsageMetrics`, etc.) and exporting them if used elsewhere.
- Keep integration details (SDK calls, credentials handling) inside service classes.

---

### Step 2 — Add/Update Route Handler (Controller)
1. Add a route handler file or extend an existing one (e.g., pattern like `server/routes/smtp.ts`).
2. Validate inputs (and fail fast with clear errors).
3. Call the service method.
4. Return consistent JSON responses and HTTP status codes.
5. If auth is required, follow patterns in `server/replit_integrations/auth/routes.ts` (inspect before implementing new auth gating).

**Deliverable:** endpoint documented in a short block comment + tests.

---

### Step 3 — Wire Client UI
1. Choose the right UI location:
   - Dashboard card? Look at billing cards.
   - Settings panel? Look at `settings/AppBranding.tsx`.
   - Layout-level behavior? Use `DashboardLayout` / `TopNavigation`.
2. Use the established UI primitives in `client/src/components/ui/*`.
3. For theme/branding-aware UI:
   - Use `useBranding()` from `branding-provider.tsx`
   - Respect theme via `theme-provider.tsx` and `mode-toggle.tsx`.

**Best practice (repo-derived):**
- Follow the “card component” pattern used in `client/src/components/billing/*` for dashboard widgets.
- Keep visual components reusable; keep data-fetching logic near pages or feature-level components (mirror existing structure).

---

### Step 4 — Testing & Validation
1. Add/update API tests in `testsprite_tests` for:
   - Validation errors (bad input)
   - Error handling (service failures)
   - Performance expectations (response time checks)
2. Manually verify UI flows (especially Dashboard + notifications bell + settings).

**Definition of Done**
- Endpoint covered by at least one automated test.
- UI changes verified in both light/dark mode and (if relevant) with branding settings.

---

### Step 5 — Observability & Operations Readiness
1. If the feature emits user-facing events: integrate with `NotificationService`.
2. If the feature changes critical state: add an `AuditService` call capturing:
   - actor, action, target, metadata (`AuditDetails`, `AuditLogPayload` patterns).
3. For integration features (MinIO/SFTPGo/SMTP), ensure failures:
   - return actionable errors
   - do not leak secrets
   - are logged/audited appropriately

---

## 3) Common Task Playbooks

### A) Add a New API Endpoint Backed by a Service
**Checklist**
- [ ] Add/extend service method in `server/services/*.ts`
- [ ] Add route handler in `server/routes/*.ts` (or relevant route module)
- [ ] Use `shared/schema.ts` types for request/response objects
- [ ] Add/extend tests in `testsprite_tests/*`

**Implementation pattern**
- Route: parse/validate → call service → map to response → send status code

---

### B) Extend a Domain Model Used by UI + Server
**Steps**
1. Update `shared/schema.ts` export (add field; keep naming consistent).
2. Update service to populate/consume the field.
3. Update UI components to display/use it.
4. Update tests to cover the new behavior (especially validation and null/optional handling).

**Guardrails**
- Avoid breaking changes: prefer optional fields when possible, then migrate callers.

---

### C) Add a New Dashboard “Card” Component
**Where**
- `client/src/components/billing/*` shows existing “card” patterns.
- Place new card under a relevant domain folder (`components/billing`, `components/admin`, or create `components/storage` if needed).

**Steps**
1. Create the component with a focused API (`props` typed).
2. Reuse `ui/*` primitives (buttons, badges, charts).
3. Add to `Dashboard.tsx` and ensure it fits `DashboardLayout`.

---

### D) Implement Notifications for a Feature
**Server**
- Use `NotificationService` + `NotificationType`
- Align payload with `NotificationPayload` and shared `Notification` model if used on client.

**Client**
- Ensure UI hooks into existing notification surface (see `NotificationsBell.tsx`).

---

### E) Branding/Theming-Aware UI Changes
**Rules**
- Use `BrandingProvider`/`useBranding` rather than hardcoding brand colors.
- Respect theme via theme provider and avoid inline colors when tokens/components exist.

**Touchpoints**
- `client/src/components/branding-provider.tsx`
- `client/src/components/settings/AppBranding.tsx`
- `client/src/components/theme-provider.tsx`

---

### F) SMTP Features
**Server**
- Extend existing handlers in `server/routes/smtp.ts`:
  - `handleConfigureSMTP`
  - `handleTestSMTP`

**Rule**
- Keep configuration changes auditable; ensure test endpoint does not expose secrets.

---

## 4) Codebase Conventions & Best Practices (Derived from Repo)

### Service-first architecture
- Business logic belongs in `server/services/*` classes.
- Route handlers should remain thin.

### Strong typing & shared contracts
- Use `shared/schema.ts` exports for cross-layer consistency.
- Export new types if they are used across modules.

### UI consistency through shared primitives
- Prefer `client/src/components/ui/*` and established patterns (e.g., existing billing cards).
- Avoid introducing new button/badge variants unless necessary; extend existing ones carefully.

### Safe integrations
- MinIO/SFTPGo/SMTP should be wrapped behind service methods.
- Handle errors explicitly; return consistent error shapes.

### Auditing and notifications as first-class concerns
- Use `AuditService` and `NotificationService` where user-impacting changes occur.

---

## 5) Key Files & What They’re For (Quick Map)

### Shared
- `shared/schema.ts` — canonical domain models and shared types
- `shared/routes.ts` — URL/route helpers (`buildUrl`)

### Server
- `server/services/minio.service.ts` — storage operations, buckets, usage metrics, lifecycle rules
- `server/services/sftpgo.service.ts` — SFTPGo user/filesystem management
- `server/services/notification.service.ts` — notification creation and delivery patterns
- `server/services/billing.service.ts` — pricing, invoices, usage summaries
- `server/services/audit.service.ts` — audit log recording (`AuditDetails`, `AuditLogPayload`)
- `server/services/domain-service.ts` — domain verification workflows
- `server/routes/smtp.ts` — SMTP configure/test endpoints
- `server/replit_integrations/auth/routes.ts` — auth route registration

### Client
- `client/src/pages/Dashboard.tsx` — main authenticated landing/dashboard
- `client/src/pages/not-found.tsx` — 404 view
- `client/src/components/layout/DashboardLayout.tsx` — primary layout wrapper
- `client/src/components/TopNavigation.tsx` — top nav UI
- `client/src/components/NotificationsBell.tsx` — notification UI entry
- `client/src/components/branding-provider.tsx` — branding context + hook
- `client/src/components/theme-provider.tsx` / `mode-toggle.tsx` — theme control
- `client/src/components/ui/*` — UI primitives (button, badge, chart, etc.)
- `client/src/components/billing/*` — examples of feature cards & tables

### Tests
- `testsprite_tests/TC017_*` — endpoint validation & error handling tests
- `testsprite_tests/TC014_*` — response time + error handling tests

---

## 6) Quality Gates (Use Before Merging)

### API Gate
- [ ] Input validation implemented
- [ ] Errors have clear messages; no secret leakage
- [ ] Service method covered by at least one test (directly or via endpoint test)
- [ ] Audited where appropriate

### UI Gate
- [ ] Uses `ui/*` primitives and matches existing layout patterns
- [ ] Works with theme + branding
- [ ] Empty/error/loading states handled

### Cross-layer Gate
- [ ] Shared types updated and used (no duplicated shapes)
- [ ] Any new field is handled in server + client consistently

---

## 7) Collaboration Notes (How to Use Other Agents)
- Use **code-archaeologist** when:
  - You must extend unclear legacy logic in services/routes
  - You suspect hidden coupling or side effects
- Use **test-engineer** (if available) when:
  - Adding new endpoints or changing validation/error behavior
  - You need characterization tests before refactors
- Use **security-auditor** (if available) when:
  - Touching auth routes, SMTP secrets, access keys, billing, or domain verification

---

## 8) Output Template (What to Produce Per Feature)

Include in your PR/feature delivery notes:

```markdown
## Feature Summary
- What changed (1–3 bullets)

## API
- Endpoint(s):
- Request/Response shapes:
- Error cases:

## Server Implementation
- Services touched:
- Routes touched:
- Audit/Notifications:

## UI
- Pages/components:
- States: loading / empty / error

## Tests
- testsprite_tests:
- Manual verification steps:
```

This playbook is optimized for PrimeCloudProV2’s current structure: **shared contracts**, **service-driven server**, and **componentized dashboard UI** with **branding/theme support**.
