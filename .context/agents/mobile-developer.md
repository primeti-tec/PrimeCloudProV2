# Feature Developer Agent Playbook — PrimeCloudProV2

## Scope & Mission

You are a **feature-developer agent** for **PrimeCloudProV2**. Your job is to ship product features end-to-end across:

- **Shared domain + types** (`shared/`)
- **Server API + services** (`server/`)
- **Client UI** (`client/src/`)
- **Tests** (unit/integration + `testsprite_tests/` for API validation)

Your default mindset: **add/extend a capability in the service layer, expose it via routes/controllers, type it in shared schema/routes, then consume it in UI with consistent components, and add tests.**

---

## Architecture Map (Where to Work)

### 1) Shared Layer (contracts and types)
**Primary directories**
- `shared/`
- `shared/models/`

**Key files**
- `shared/schema.ts`  
  Canonical domain structures and exported models like `Product`, `Order`, `Bucket`, `Notification`, etc.
- `shared/routes.ts`  
  API route construction and shared route helpers like `buildUrl`.

**When you touch this layer**
- Any new domain model or change to existing fields
- Any API contract that client and server must agree on
- Any shared route helpers / API URL building behavior

---

### 2) Server Layer (business logic + endpoints)
**Primary directories**
- `server/services/` (core business logic lives here)
- `server/routes/` (HTTP handlers / controllers)
- `server/replit_integrations/auth/` (auth routing integration)

**Key files**
- `server/services/minio.service.ts` — buckets/objects/usage/quota/lifecycle ops
- `server/services/sftpgo.service.ts` — SFTPGo user/filesystem/virtual folder orchestration
- `server/services/notification.service.ts` — notification creation, type definitions, delivery patterns
- `server/services/billing.service.ts` — pricing, usage summary, invoices
- `server/services/audit.service.ts` — audit log payload/details and logging
- `server/services/domain-service.ts` — domain verification/related operations
- `server/routes/smtp.ts` — SMTP configure/test endpoints (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` — `registerAuthRoutes`

**When you touch this layer**
- Adding new business behavior (always start in services)
- Adding/changing endpoints
- Auditing, notifications, billing implications

---

### 3) Client Layer (pages + components)
**Primary directories**
- `client/src/pages/` — page-level screens like `Dashboard`, `NotFound`
- `client/src/components/` — composed UI building blocks
- `client/src/components/ui/` — base UI primitives (buttons, badges, charts)
- `client/src/components/layout/` — layout shells (e.g., `DashboardLayout`)
- `client/src/components/settings/` — settings screens (e.g., branding)
- `client/src/components/billing/` — billing-related UI cards/tables
- `client/src/components/admin/` — admin feature components

**Key files**
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/not-found.tsx`
- `client/src/components/layout/DashboardLayout.tsx`
- `client/src/components/TopNavigation.tsx`
- `client/src/components/NotificationsBell.tsx`
- `client/src/components/branding-provider.tsx`
- `client/src/components/settings/AppBranding.tsx`
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx`
- `client/src/components/ui-custom.tsx` (custom UI wrappers, includes `ButtonProps`)
- Billing widgets: `UpgradeRequestsCard`, `StorageOverviewCard`, `ImperiusStatsCard`, `BucketUsageTable`

**When you touch this layer**
- New UI for a feature (page + components)
- Integrate API changes into UI flows
- Add/adjust shared look-and-feel via existing primitives

---

### 4) Tests & Validation
**Primary directories**
- `testsprite_tests/` — API endpoint error-handling/validation/regression style tests (Python)
- `tests/components/` — component tests (if present/used by repo)

**Key test files**
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`

**When you touch tests**
- Any new endpoint must get at least validation coverage (happy path + failure modes)
- Any endpoint change should update these tests if they validate payload shape/errors

---

## Core Engineering Rules (Derived from This Codebase)

### Rule 1 — Service-first development
This repo strongly indicates a **service-layer pattern**. Implement logic in `server/services/*.ts` first, then expose via routes/controllers.

**Do**
- Add methods/types to `MinioService`, `BillingService`, etc.
- Keep routes thin: parse/validate request → call service → return response

**Avoid**
- Packing business logic into route handlers or client code

---

### Rule 2 — Shared contracts are real contracts
If the client consumes a server response, ensure types align in `shared/schema.ts` (for models) and/or `shared/routes.ts` (for route helpers).

**Do**
- Update shared model exports when adding fields (e.g., `Bucket`, `Notification`)
- Keep changes backward-compatible if possible

**Avoid**
- “Invisible” server response shape changes not reflected in shared types

---

### Rule 3 — Use existing UI primitives and layout shells
Client has a clear structure:
- Pages in `client/src/pages`
- Layout in `client/src/components/layout`
- Reusable UI primitives in `client/src/components/ui`

**Do**
- Use `button.tsx`, `badge.tsx`, and existing UI patterns
- Put cross-feature UI logic into components, not pages

**Avoid**
- One-off styling/components when a primitive exists

---

### Rule 4 — Audit & notification are first-class concerns
The codebase has `AuditService` and `NotificationService`. New admin/billing/storage actions should usually be auditable and may trigger notifications.

**Do**
- Log meaningful `AuditDetails` for sensitive actions
- Emit notifications for user-visible state changes or required attention

**Avoid**
- Adding high-impact actions without audit trails

---

## Typical Feature Workflows (Step-by-step)

### Workflow A — Add a New Server Capability + Endpoint
Use this when creating new functionality (e.g., “add bucket lifecycle rule”, “generate invoice”, “verify domain”).

1) **Clarify the feature contract**
   - Inputs, outputs, error conditions, permissions
   - Identify which service is responsible (`MinioService`, `BillingService`, etc.)

2) **Implement/extend the service**
   - File: `server/services/<domain>.service.ts`
   - Add types if needed (follow patterns like `UsageSummary`, `StorageQuota`, `NotificationPayload`)
   - Ensure errors are consistent and actionable (include message + context)

3) **Add the route/controller**
   - File: `server/routes/<topic>.ts` (or existing route file)
   - Keep handlers thin:
     - validate input
     - call service
     - map service errors to HTTP errors
   - Reuse patterns from `server/routes/smtp.ts` where applicable (configure/test style endpoints)

4) **Update shared routes/types**
   - If the client needs a new URL builder or shared route: `shared/routes.ts` (e.g., use/extend `buildUrl`)
   - If you added/changed domain shapes: `shared/schema.ts`

5) **Add tests**
   - Add or extend `testsprite_tests/` coverage:
     - happy path
     - invalid input
     - permission/unauthorized (if applicable)
     - error handling (timeouts, upstream failures, etc.)

6) **Client integration (if needed)**
   - Add UI entry point in `client/src/pages/` or within an existing page
   - Use existing UI components and layout patterns

---

### Workflow B — Add a New UI Feature Using Existing Patterns
Use this when the server capability exists, but UI needs a new workflow/card/settings screen.

1) **Locate the correct UI area**
   - Billing? → `client/src/components/billing/`
   - Settings/branding? → `client/src/components/settings/`
   - Admin? → `client/src/components/admin/`
   - Global layout/nav? → `client/src/components/layout/`, `TopNavigation`, `MobileBottomNav`

2) **Create a component-first implementation**
   - Add a new component under the right folder
   - Wire into a page like `Dashboard.tsx` or relevant existing page

3) **Use primitives**
   - Buttons: `client/src/components/ui/button.tsx` (or `ui-custom.tsx` wrappers)
   - Badges: `client/src/components/ui/badge.tsx`
   - Charts: `client/src/components/ui/chart.tsx`

4) **Handle states**
   - Loading, empty, error, success
   - Ensure errors from API are displayed clearly and do not crash rendering

5) **Notifications integration**
   - If feature produces user-notable events, ensure it surfaces in UI (consider `NotificationsBell`)

---

### Workflow C — Modify an Existing Domain Model (Breaking-change safe)
Use this when adding fields to things like `Bucket`, `Notification`, `Subscription`.

1) Update `shared/schema.ts` first (add optional fields if possible)
2) Update server mapping/serialization (service + route)
3) Update client usage (pages/components)
4) Update tests to assert new fields if needed
5) Prefer **backward compatibility** (optional fields, defaults)

---

## Best Practices & Conventions to Follow

### Server-side conventions
- **Services are authoritative**: keep orchestration and business decisions there.
- **Typed payloads**: prefer explicit types like `NotificationPayload`, `InvoiceData`, `AuditLogPayload`.
- **Error handling**: make errors predictable for tests like TC014/TC017 (validation + consistent failure behavior).
- **External systems**: MinIO / SFTPGo / SMTP are integration points—wrap calls in service methods; never scatter integration calls across routes.

### Client-side conventions
- Use established layout components: `DashboardLayout`
- Reuse UI primitives and avoid bespoke button/badge styling
- Prefer adding cohesive components under `client/src/components/<domain>/` rather than bloating pages
- Branding-related UI should flow through `BrandingProvider` / `useBranding`

### Cross-cutting concerns
- **Auditing**: record who did what and key details (via `AuditService`)
- **Notifications**: emit and present user-facing events (`NotificationService`, `NotificationsBell`)
- **Performance**: keep heavy logic out of rendering; use existing table/cards patterns (billing components show the preferred approach)

---

## Key Files Cheat Sheet (What They’re For)

### Shared
- `shared/schema.ts` — exported domain models (`LifecycleRule`, `Product`, `Order`, `Bucket`, `Notification`, etc.)
- `shared/routes.ts` — route helpers; contains `buildUrl`

### Server services
- `server/services/minio.service.ts` — storage operations, quotas, lifecycle
- `server/services/sftpgo.service.ts` — SFTPGo management
- `server/services/billing.service.ts` — pricing, usage, invoices
- `server/services/notification.service.ts` — notification types + creation
- `server/services/audit.service.ts` — audit logging payloads/details
- `server/services/domain-service.ts` — domain verification result types/logic

### Server routes/controllers
- `server/routes/smtp.ts` — SMTP configure/test controllers (good reference for handler structure)
- `server/replit_integrations/auth/routes.ts` — auth route registration

### Client
- `client/src/pages/Dashboard.tsx` — dashboard page
- `client/src/components/layout/DashboardLayout.tsx` — common shell for authenticated UI
- `client/src/components/TopNavigation.tsx` — top nav patterns
- `client/src/components/NotificationsBell.tsx` — notification display entry point
- `client/src/components/branding-provider.tsx` — branding config and hook
- `client/src/components/settings/AppBranding.tsx` — branding UI
- `client/src/components/ui/*` — primitive UI components
- `client/src/components/billing/*` — examples of card/table feature composition

### Tests
- `testsprite_tests/TC014_*` — response time + error handling
- `testsprite_tests/TC017_*` — endpoint validation and error handling

---

## Feature Implementation Templates (Use as a checklist)

### Template 1 — “New Endpoint + UI”
- [ ] Add/extend types in `shared/schema.ts` (if new/changed models)
- [ ] Add/extend route helper in `shared/routes.ts` (if needed)
- [ ] Add method in `server/services/<domain>.service.ts`
- [ ] Add handler in `server/routes/<topic>.ts`
- [ ] Add audit logging in `server/services/audit.service.ts` usage (if sensitive)
- [ ] Add notifications via `server/services/notification.service.ts` (if user-facing)
- [ ] Add UI component in `client/src/components/<domain>/`
- [ ] Wire into page/layout (`Dashboard.tsx` / `DashboardLayout.tsx`)
- [ ] Add/update `testsprite_tests` for validation + error cases

### Template 2 — “Add a new card to Dashboard”
- [ ] Create card component in appropriate domain folder (often `client/src/components/billing/` as reference style)
- [ ] Use `ui/button`, `ui/badge`, `ui/chart` where appropriate
- [ ] Load data via existing API patterns (align with shared routes/types)
- [ ] Add empty/loading/error states
- [ ] Add to `Dashboard.tsx`

---

## Mandatory Quality Bar (Before You Consider a Feature “Done”)

### Server/API
- [ ] Thin route handlers; logic in services
- [ ] Validation + predictable error responses (tests should be able to assert them)
- [ ] No contract drift: shared types updated if response shape changed
- [ ] Audit/notification hooks added where appropriate

### Client/UI
- [ ] Uses existing layout + UI primitives
- [ ] Handles loading/empty/error states
- [ ] No visual one-offs when a component exists (button/badge/etc.)

### Tests
- [ ] `testsprite_tests` updated/added for endpoint validation and error handling
- [ ] Existing tests still pass after contract changes

---

## “Ask Before Assuming” Prompts (Use when requirements are incomplete)

If the request is ambiguous, ask targeted questions before coding:

1) **Where does the feature belong?** (billing vs storage vs notifications vs settings)
2) **Who can access it?** (admin only, account owner, member roles)
3) **What’s the expected API contract?** (payload shape + error codes)
4) **Do we need audit logs and/or notifications?**
5) **Is this a backward-compatible change?** (existing clients / data)

---

## Practical Starting Points (If You Need to Orient Quickly)

- Storage feature → start at `server/services/minio.service.ts` and related UI tables/cards like `BucketUsageTable`
- Billing feature → start at `server/services/billing.service.ts` and UI cards under `client/src/components/billing/`
- Notification-related feature → start at `server/services/notification.service.ts` and UI at `NotificationsBell.tsx`
- Branding/settings feature → start at `client/src/components/branding-provider.tsx` and `settings/AppBranding.tsx`
- SMTP/email feature → see patterns in `server/routes/smtp.ts`

---

## Deliverable Expectations

For any feature request, your output should include:
- Files changed (grouped by shared/server/client/tests)
- What the new behavior is (API + UI)
- Edge cases handled (validation, errors)
- How to verify (manual steps + tests impacted)

This playbook is optimized for shipping cohesive, well-typed, service-driven features consistent with PrimeCloudProV2’s structure and conventions.
