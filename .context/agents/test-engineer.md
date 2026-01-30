# Feature-Developer Agent Playbook — PrimeCloudProV2

## Mission
Build end-to-end product features in **PrimeCloudProV2** (DB → services → API routes → UI) while preserving:
- Schema-driven types/validation from `shared/schema.ts`
- Service-layer orchestration in `server/services/*`
- Consistent UI conventions in `client/src/components/*` and `client/src/pages/*`
- Cross-cutting concerns: **audit logs**, **notifications**, **permissions**, and **branding/theming**

---

## 1) Where to Work (Focus Areas)

### Backend
**Core data + contracts**
- `shared/schema.ts` — canonical database schema + inferred types (Drizzle) and Zod validation schemas.
- `shared/routes.ts` — route helpers such as `buildUrl` (used to keep client/server routing consistent).

**HTTP routing / controllers**
- `server/routes/*` — request handlers (input validation, auth/permission checks, error mapping).
  - Example: `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`).

**Business logic**
- `server/services/*` — orchestration and integrations:
  - `minio.service.ts` — buckets, usage metrics, quotas, lifecycle rules.
  - `sftpgo.service.ts` — SFTPGo users/filesystems/virtual folders.
  - `billing.service.ts` — pricing, usage summaries, invoice data.
  - `notification.service.ts` — notification creation/dispatch (`NotificationType`, `NotificationService`).
  - `audit.service.ts` — audit logging for sensitive actions (`AuditService`).
  - `domain-service.ts` — domain verification flows (`DomainVerificationResult`).

### Frontend
**Pages (route-level)**
- `client/src/pages/*` — page composition and data loading (e.g., `Dashboard.tsx`, `not-found.tsx`).

**Components**
- `client/src/components/*` — reusable UI and feature components:
  - Layout/navigation: `layout/DashboardLayout.tsx`, `TopNavigation.tsx`, `MobileBottomNav.tsx`
  - Theming/branding: `theme-provider.tsx`, `branding-provider.tsx`, `settings/AppBranding.tsx`
  - Notifications: `NotificationsBell.tsx`
  - Billing widgets: `billing/*` (`StorageOverviewCard.tsx`, `BucketUsageTable.tsx`, etc.)
  - UI primitives: `components/ui/*` and project extensions in `ui-custom.tsx`

### Tests / automation
- `testsprite_tests/*` — API validation/error-handling tests (Python). Use as reference for expected API behavior and failure modes.

---

## 2) Architecture & Conventions (How the Repo is Shaped)

### Layering rules (enforce in PRs)
1. **Routes/controllers** do:
   - authentication/authorization checks
   - request parsing + Zod validation
   - calling the service layer
   - mapping domain errors → HTTP responses

2. **Services** do:
   - business logic + integrations (MinIO/SFTPGo/billing)
   - consistent error handling (throw meaningful errors; don’t return “magic” strings)
   - optional side effects: audit logs and notifications (or expose enough context for routes to do so)

3. **Schema** (`shared/schema.ts`) is the source of truth:
   - types for DB records
   - insert/update validation
   - shared domain objects used by server and client

4. **Client**:
   - pages compose feature components
   - components use UI primitives consistently
   - branding/theme must be respected via `BrandingProvider` / `useBranding`

---

## 3) Key Files (Purpose Cheatsheet)

### Shared
- `shared/schema.ts`
  - Defines domain models like `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `Subscription`, `Bucket`, `AccessKey`, `Notification`
- `shared/routes.ts`
  - Includes `buildUrl` for consistent URL construction

### Server
- `server/services/minio.service.ts`
  - `MinioService`, `MinioConfig`, `BucketInfo`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`, etc.
- `server/services/sftpgo.service.ts`
  - `SftpGoService` and related types (`SftpGoUser`, `SftpGoFilesystem`, etc.)
- `server/services/billing.service.ts`
  - `BillingService`, pricing + usage + invoices (`PricingConfig`, `UsageSummary`, `InvoiceData`)
- `server/services/notification.service.ts`
  - `NotificationService`, `NotificationType`, `NotificationPayload`
- `server/services/audit.service.ts`
  - `AuditService`, `AuditDetails`
- `server/routes/smtp.ts`
  - SMTP config/test endpoints (reference for route structure & validation patterns)
- `server/replit_integrations/auth/routes.ts`
  - Auth route registration (`registerAuthRoutes`)

### Client
- `client/src/pages/Dashboard.tsx`
  - Example: page-level composition and data display
- `client/src/components/layout/DashboardLayout.tsx`
  - Main authenticated layout + common layout rules
- `client/src/components/ui/*`
  - Shadcn-style primitives (e.g., `ui/button.tsx`, `ui/badge.tsx`)
- `client/src/components/ui-custom.tsx`
  - Project-level UI extensions (keep consistent with primitives)
- `client/src/components/branding-provider.tsx`
  - White-label theming/branding via context (`useBranding`)
- `client/src/components/settings/AppBranding.tsx`
  - Branding configuration UI
- `client/src/components/NotificationsBell.tsx`
  - Notification UI integration patterns
- `client/src/components/billing/*`
  - Billing-specific components and data display patterns

---

## 4) Core Workflows (Step-by-Step)

### Workflow A — Add a New Feature Backed by a New Entity (DB + API + UI)
**Goal:** introduce a new domain concept end-to-end.

1. **Define schema + validation**
   - Add table/columns and exported types/schemas in `shared/schema.ts`.
   - Ensure you have:
     - select type (read model)
     - insert/update Zod schema (write model)
   - Update/introduce any shared domain interfaces needed by services.

2. **Implement service logic**
   - Create or extend a class in `server/services/*`.
   - Keep service methods cohesive (one responsibility per method).
   - If the feature interacts with storage/billing/SFTP:
     - Prefer extending `MinioService` / `BillingService` / `SftpGoService` rather than duplicating integration code.

3. **Add route handlers**
   - Create a file in `server/routes/` or extend an existing one.
   - Validate input using Zod schemas (prefer reusing `shared/schema.ts` Zod models).
   - Enforce permission checks before calling service methods.
   - Map failures to consistent HTTP status codes (see “Error handling rules” below).

4. **Add audit + notification hooks**
   - For any sensitive/admin action, call `AuditService` with meaningful `AuditDetails`.
   - For user-visible events (quota reached, provisioning complete, payment issue), create a `NotificationService` entry.

5. **Frontend integration**
   - Add/extend client API calls/hooks (where your repo keeps them—commonly `client/src/lib/*`).
   - Update or create page in `client/src/pages/*`.
   - Build reusable UI components in `client/src/components/*` (prefer small composable components).
   - Respect branding via `useBranding()` and theme via `ThemeProvider`.

6. **Tests**
   - Add/extend API tests (reference `testsprite_tests/*` for error/validation patterns).
   - Validate:
     - happy path
     - invalid input (400)
     - unauthorized/forbidden (401/403)
     - not found (404)
     - integration failure (5xx with safe message)

---

### Workflow B — Add/Extend an API Endpoint for an Existing Service
**Goal:** new endpoint with minimal new domain modeling.

1. Identify the owning service (`MinioService`, `BillingService`, `SftpGoService`, etc.).
2. Add a method to the service if needed; otherwise call existing methods.
3. Create a route handler in `server/routes/*`:
   - Zod validate request
   - authorization check
   - call service
   - return JSON response
4. If user-impacting, add:
   - `AuditService` for sensitive changes
   - `NotificationService` for user-facing events
5. Update the UI to consume the new endpoint (hooks + components + page).

---

### Workflow C — Storage Feature (Buckets, Quotas, Lifecycle Rules)
**Files to start with**
- `server/services/minio.service.ts`
- `shared/schema.ts` (Bucket/LifecycleRule models)
- UI: billing/storage components such as `client/src/components/billing/*`

**Steps**
1. Add/extend `MinioService` method(s) for:
   - bucket creation/deletion
   - retrieving `UsageMetrics` / `ObjectStats`
   - quota evaluation (`StorageQuota`)
   - lifecycle rules (`LifecycleRule`)
2. Route:
   - validate bucket name and settings with Zod
   - enforce account ownership / permissions
3. Side effects:
   - audit log for destructive actions
   - notification for important state changes (e.g., “quota near limit”)
4. UI:
   - integrate into existing storage overview patterns (`StorageOverviewCard`, `BucketUsageTable`)
   - ensure friendly error states and loading states

---

### Workflow D — Billing Feature (Pricing, Usage, Invoices)
**Files to start with**
- `server/services/billing.service.ts`
- `client/src/components/billing/*`

**Steps**
1. Extend `BillingService` to expose required aggregation:
   - `UsageSummary`, `InvoiceData`, pricing changes
2. Ensure calculations are deterministic and unit-consistent.
3. Route:
   - validate date ranges, account IDs, filters
4. UI:
   - reuse billing cards/tables patterns for consistent display
5. Audit:
   - log pricing changes, invoice generation, plan upgrades
6. Notifications:
   - payment/upgrade-related notifications via `NotificationService`

---

### Workflow E — SFTPGo Feature (Users, Filesystems, Virtual Folders)
**Files to start with**
- `server/services/sftpgo.service.ts`

**Steps**
1. Extend `SftpGoService` with user/folder lifecycle methods.
2. Route:
   - validate usernames, folder paths, permissions
3. Audit:
   - log user creation, permission changes, deletions
4. UI:
   - create settings/admin panels under `client/src/components/settings/*` or `client/src/pages/*` as appropriate

---

### Workflow F — Branding / White-Label UI Feature
**Files to start with**
- `client/src/components/branding-provider.tsx`
- `client/src/components/settings/AppBranding.tsx`
- `client/src/components/theme-provider.tsx`

**Steps**
1. Use `useBranding()` instead of hardcoding:
   - product name, logo, primary colors, etc.
2. Ensure new UI components inherit theme tokens and Tailwind conventions.
3. If adding new branding settings:
   - add schema fields (likely `shared/schema.ts`)
   - add backend route to save/apply
   - update `BrandingProvider` consumption paths

---

## 5) Best Practices (Derived From This Codebase)

### Schema-first development
- Treat `shared/schema.ts` as the canonical domain contract.
- Reuse exported models (`Account`, `Subscription`, `Bucket`, `Notification`, etc.) across server/client.

### Service-layer discipline
- Prefer extending an existing service (MinIO/SFTPGo/Billing/Audit/Notification) rather than adding ad-hoc logic in routes.
- Keep integrations isolated to services.

### Audit & notifications are not optional for sensitive actions
Add `AuditService` calls for:
- deletion/destructive changes
- permissions/roles updates
- billing changes (plans, pricing, invoices)
- credential/access key changes
Add `NotificationService` entries for:
- user-visible state changes
- warnings (quota/usage)
- operational actions completion/failure when relevant

### UI consistency
- Prefer `client/src/components/ui/*` primitives.
- Use `ui-custom.tsx` only for project-wide extensions; avoid duplicating primitives.
- Keep pages thin; move logic into components/hooks.

### Branding/theming compliance
- Never hardcode organization/product identity in feature UI.
- Always route through `BrandingProvider` and theme providers.

---

## 6) Error Handling Rules (API)
Use consistent mapping:
- **400**: Zod validation failures, malformed inputs
- **401**: unauthenticated
- **403**: authenticated but lacking permission/account access
- **404**: resource not found (bucket/account/order/etc.)
- **409**: conflicts (duplicate resources, invalid state transitions)
- **429**: rate/limit scenarios (if implemented)
- **5xx**: integration/system failures (MinIO/SFTPGo/SMTP), return safe messages

For integration errors:
- include correlation info in logs
- keep client-facing message actionable but not sensitive

---

## 7) “Definition of Done” Checklist (Feature PR)
**Backend**
- [ ] `shared/schema.ts` updated (if data contract changed) with exported types/schemas
- [ ] Service methods added/updated with clear inputs/outputs
- [ ] Routes validate inputs (Zod) and enforce permissions
- [ ] Audit logs added for sensitive actions (`AuditService`)
- [ ] Notifications added where user-facing (`NotificationService`)
- [ ] Error handling returns correct HTTP codes and safe messages

**Frontend**
- [ ] UI uses existing primitives (`client/src/components/ui/*`)
- [ ] Branding respected (`useBranding`)
- [ ] Page integration complete (navigation/layout via `DashboardLayout`)
- [ ] Empty/loading/error states implemented

**Quality**
- [ ] Tests updated/added (reference `testsprite_tests/*` patterns)
- [ ] No duplicated business logic in routes/components
- [ ] Consistent naming: `PascalCase` components/classes, `camelCase` functions/vars

---

## 8) Common Feature Templates (Quick Start Patterns)

### Template: New route handler
- Validate input with Zod (prefer schemas from `shared/schema.ts`)
- Check auth/permissions
- Call service
- On success: return JSON
- On error: map to proper status + message
- Add audit/notification as needed

### Template: New UI feature component
- Compose from `components/ui/*` primitives
- Put feature-specific logic in a dedicated component under `client/src/components/<feature>/`
- Keep page components as composition shells
- Pull branding from `useBranding()`

---

## 9) Practical “Start Here” Map by Feature Type

- **Storage / Buckets / Quotas / Lifecycle:**  
  `server/services/minio.service.ts` → `server/routes/*` → `client/src/components/billing/*` (+ dashboard/cards)

- **SFTP provisioning / folder mgmt:**  
  `server/services/sftpgo.service.ts` → `server/routes/*` → settings/admin UI components

- **Billing / invoices / plan changes:**  
  `server/services/billing.service.ts` → `client/src/components/billing/*` → audit + notifications

- **Notifications UX:**  
  `server/services/notification.service.ts` → `client/src/components/NotificationsBell.tsx`

- **Branding/theming:**  
  `client/src/components/branding-provider.tsx` + `settings/AppBranding.tsx` + `theme-provider.tsx`

---

## 10) Agent Operating Rules (Non-Negotiables)
1. Do not bypass the service layer with direct integration calls in routes.
2. Do not introduce new domain shapes without updating `shared/schema.ts`.
3. Do not ship sensitive state changes without `AuditService` coverage.
4. Do not ship UI that ignores `useBranding()` / theming conventions.
5. Prefer extension over duplication (especially for MinIO/SFTPGo/Billing patterns).
