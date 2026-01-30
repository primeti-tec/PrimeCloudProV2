# Feature Developer Agent Playbook — PrimeCloudProV2

Purpose: implement new product features end-to-end (DB/schema → server routes/services → client UI), aligned with the repo’s existing patterns (service layer, shared schema/types, client components), and delivered with appropriate tests and docs.

---

## 0) Quick Orientation (What this repo looks like)

### Core areas you will touch most
- **Shared domain schema & types**
  - `shared/schema.ts` — canonical domain models/types (e.g., `Product`, `Order`, `Account`, `Bucket`, `Notification`, `LifecycleRule`, etc.)
  - `shared/routes.ts` — shared routing helpers (e.g., `buildUrl`)
- **Server (backend)**
  - `server/routes/*` — HTTP endpoints / request handlers (e.g., `server/routes/smtp.ts`)
  - `server/services/*` — business logic and external integrations (strong service-layer pattern)
    - `server/services/minio.service.ts` — buckets, lifecycle, usage, quotas
    - `server/services/sftpgo.service.ts` — SFTPGo integration
    - `server/services/notification.service.ts` — notifications
    - `server/services/billing.service.ts` — pricing, usage summaries, invoices
    - `server/services/audit.service.ts` — audit logging
    - `server/services/domain-service.ts` — domain verification
  - `server/replit_integrations/auth/*` — auth routing integration (`registerAuthRoutes`)
- **Client (frontend)**
  - `client/src/pages/*` — feature pages (e.g., `Dashboard.tsx`, `not-found.tsx`)
  - `client/src/components/*` — reusable components and feature modules
    - UI primitives: `client/src/components/ui/*` (e.g., `button.tsx`, `badge.tsx`, `chart.tsx`)
    - App layout: `client/src/components/layout/DashboardLayout.tsx`
    - Navigation: `client/src/components/TopNavigation.tsx`, `MobileBottomNav.tsx`
    - Settings: `client/src/components/settings/AppBranding.tsx`
    - Billing widgets: `client/src/components/billing/*`
    - Notifications: `client/src/components/NotificationsBell.tsx`
    - Branding/theme: `client/src/components/branding-provider.tsx`, `theme-provider.tsx`, `mode-toggle.tsx`

### Testing signals present in repo
- `testsprite_tests/*` — API-oriented test scripts (Python). Examples include endpoint validation and error handling tests.

---

## 1) Primary Responsibilities of a Feature Developer Agent

1. **Clarify feature scope**: user story, acceptance criteria, UX, permissions, error states, telemetry/audit requirements.
2. **Implement full stack** when needed:
   - update/add shared types in `shared/schema.ts`
   - implement server service methods in `server/services/*`
   - expose API endpoints in `server/routes/*` (or relevant route registration)
   - implement UI pages/components in `client/src/pages/*` and `client/src/components/*`
3. **Ensure cross-cutting concerns**:
   - audit logging via `AuditService` where appropriate
   - notifications via `NotificationService` where appropriate
   - consistent routing via `shared/routes.ts` helpers
   - consistent UI via `client/src/components/ui/*` primitives
4. **Ship with tests**:
   - update/add `testsprite_tests/*` coverage for new/changed endpoints and error handling paths
5. **Document feature**:
   - update relevant docs if they exist (see `docs/README.md`, `AGENTS.md`, `CONTRIBUTING.md` references in the handbook)

---

## 2) Codebase Conventions & Patterns (Follow these)

### A) “Service Layer First” backend architecture
**Pattern**: services encapsulate business logic and integrations; routes handle HTTP parsing/validation and call services.

**Do**
- Put most logic in `server/services/*.ts` classes (e.g., `MinioService`, `BillingService`)
- Keep `server/routes/*.ts` thin: validation, auth/permission checks, mapping to service calls, consistent error responses
- Reuse existing services instead of duplicating logic

**Avoid**
- Putting complex business logic directly in route handlers
- Duplicating integration code (MinIO/SFTPGo/Billing/etc.) outside services

### B) Shared types are central
- If you add new domain concepts, define/extend them in `shared/schema.ts` to keep server/client aligned.
- Prefer importing shared types in both server and client rather than redefining.

### C) UI composition
- Use existing UI primitives in `client/src/components/ui/*` and any custom wrappers like `client/src/components/ui-custom.tsx`.
- Prefer placing feature-specific UI in `client/src/components/<feature>/...` or a dedicated module directory similar to `billing`, `settings`, `admin`, `layout`.

---

## 3) “Golden Path” Workflow for Delivering a Feature

### Step 1: Specification & Impact Analysis
Capture the following before coding:
- **User story**: who, what, why
- **Acceptance criteria**: measurable outcomes
- **API shape**: endpoints, request/response bodies, error codes
- **Permissions**: who can do what (especially for billing/admin settings)
- **Audit requirements**: should actions be logged via `AuditService`?
- **Notifications**: should `NotificationService` emit events?
- **Affected areas**:
  - shared: `shared/schema.ts`, `shared/routes.ts`
  - server: `server/services/*`, `server/routes/*`
  - client: `client/src/pages/*`, `client/src/components/*`
  - tests: `testsprite_tests/*`

Deliverable: a brief “Implementation Plan” in the PR description or task ticket.

---

### Step 2: Update/Introduce Shared Types (if needed)
Common reasons:
- new entity fields
- new DTO-like structures used by both client and server

**Where**
- `shared/schema.ts` — add/extend types like `Bucket`, `Notification`, `Subscription`, etc.

**Checklist**
- Name types consistently with existing exports (`Product`, `Order`, etc.)
- Keep backward compatibility if existing API depends on older shapes
- Ensure client and server both compile with the updated schema

---

### Step 3: Implement Backend Service Methods
**Where**
- `server/services/*` (choose the service that matches the domain)

**Examples**
- Storage/buckets/metrics: `MinioService`
- Users/filesystems/SFTP: `SftpGoService`
- Billing/pricing/invoices: `BillingService`
- Notifications: `NotificationService`
- Audit trail: `AuditService`
- Domain checks: `domain-service.ts`

**Checklist**
- Prefer adding methods to an existing service rather than creating a new one unless it’s a new domain
- Design method signatures around the shared types
- Centralize external API calls (MinIO/SFTPGo/etc.) in the relevant service only
- If the action changes state or is security-relevant, add audit logging via `AuditService`

---

### Step 4: Expose API via Routes
**Where**
- `server/routes/*` for feature endpoints
- potentially `server/replit_integrations/auth/routes.ts` for auth additions

**Checklist**
- Keep route handler logic minimal (validation, mapping, response)
- Use consistent URL construction patterns (see `shared/routes.ts` and `buildUrl`)
- Implement robust error handling (align with existing endpoint error-handling tests in `testsprite_tests`)

---

### Step 5: Implement Client UI
**Where**
- Page-level: `client/src/pages/*`
- Shared components: `client/src/components/*`
- UI primitives: `client/src/components/ui/*`
- Layout/navigation: `client/src/components/layout/*`, `TopNavigation`, `MobileBottomNav`

**Checklist**
- Reuse existing components (e.g., `DashboardLayout`, billing cards, `NotificationsBell`)
- Use branding/theming providers:
  - `client/src/components/branding-provider.tsx`
  - `client/src/components/theme-provider.tsx`
  - `mode-toggle.tsx`
- Keep feature UI modular: separate data fetching, presentation, and form components where possible

---

### Step 6: Add/Update Tests
**Where**
- `testsprite_tests/*` — API endpoint validation, response time, error handling patterns exist.

**What to cover**
- Happy path (expected 200/201)
- Validation errors (400)
- Unauthorized/forbidden (401/403) if applicable
- Not found (404) if referencing resources
- Server errors (500) handling behavior and message shape
- Response time expectations where relevant (based on existing tests)

---

### Step 7: Final Quality Gate
Before submitting:
- Ensure shared types compile across server and client
- Confirm UI uses existing primitives and layout patterns
- Ensure audit/notification side effects are correct and not duplicated
- Add minimal docs or update existing docs index if needed

---

## 4) Common Feature Recipes (Copy/Paste Checklists)

### Recipe A: Add a new Settings screen (Branding/Admin)
**Touchpoints**
- UI: `client/src/components/settings/*` (pattern example: `AppBranding.tsx`)
- Layout: `client/src/components/layout/DashboardLayout.tsx`
- Navigation: `TopNavigation.tsx` / `MobileBottomNav.tsx`
- If server-backed: add route in `server/routes/*` + service logic in appropriate `server/services/*`

**Checklist**
- Use `BrandingProvider` / `useBranding` (`client/src/components/branding-provider.tsx`) if branding-related
- Ensure it renders well in layout and mobile navigation
- Add API tests for configuration endpoints if applicable (similar to SMTP routes pattern: `server/routes/smtp.ts`)

---

### Recipe B: Add a billing-related feature (usage, invoices, plan changes)
**Touchpoints**
- Server: `server/services/billing.service.ts`
- Client: `client/src/components/billing/*`
- Likely page integration: `client/src/pages/Dashboard.tsx` if shown on dashboard
- Audit: `server/services/audit.service.ts` for important account changes

**Checklist**
- Extend `PricingConfig`, `UsageSummary`, `InvoiceData` patterns rather than inventing new structures
- Add UI cards/tables consistent with:
  - `StorageOverviewCard.tsx`
  - `BucketUsageTable.tsx`
  - `UpgradeRequestsCard.tsx`
- Add API tests for edge cases (missing usage data, invalid plan, etc.)

---

### Recipe C: Add storage/bucket capability (lifecycle rules, quotas, metrics)
**Touchpoints**
- Server: `server/services/minio.service.ts`
- Shared: `LifecycleRule` exists in both shared and service contexts—ensure you use the correct one and keep them consistent
- Client: likely new components under `client/src/components/...` or billing/storage cards

**Checklist**
- Keep MinIO-specific details inside `MinioService`
- Expose a clean API shape to the client (avoid leaking raw MinIO API structures)
- Test: endpoint validation + error handling + potentially response time

---

### Recipe D: Add notifications for a feature
**Touchpoints**
- Server: `server/services/notification.service.ts` (`NotificationService`, `NotificationType`, `NotificationPayload`)
- Client: `client/src/components/NotificationsBell.tsx` for display/interaction

**Checklist**
- Emit notifications at the service level where the event occurs
- Keep payloads consistent and versionable (prefer explicit fields)
- Ensure UI updates are compatible with existing bell behavior

---

### Recipe E: Add or modify external integration behavior (SFTPGo, Domain verification, SMTP)
**Touchpoints**
- SFTPGo: `server/services/sftpgo.service.ts`
- Domain: `server/services/domain-service.ts`
- SMTP routes: `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)

**Checklist**
- Encapsulate API calls + retries + mapping in service
- Validate configs in routes
- Add tests for invalid credentials, unreachable endpoints, and timeouts

---

## 5) Key Files & What They’re For (Reference Map)

### Shared
- `shared/schema.ts`
  - Source of truth for domain models (examples: `Product`, `Order`, `Account`, `Subscription`, `Bucket`, `Notification`)
- `shared/routes.ts`
  - Route helpers (e.g., `buildUrl`) to keep URL construction consistent

### Server
- `server/routes/smtp.ts`
  - SMTP configuration and testing routes; good example for “configure + test” endpoint pairing
- `server/replit_integrations/auth/routes.ts`
  - Auth-related route registration (`registerAuthRoutes`)
- `server/services/minio.service.ts`
  - Storage domain, MinIO integration, usage metrics, lifecycle, quotas
- `server/services/sftpgo.service.ts`
  - SFTPGo integration (users, folders, filesystem abstractions)
- `server/services/billing.service.ts`
  - Pricing, usage summaries, invoice data
- `server/services/notification.service.ts`
  - Notification types and dispatch
- `server/services/audit.service.ts`
  - Audit log payloads and persistence/dispatch

### Client
- `client/src/pages/Dashboard.tsx`
  - Central user-facing dashboard; frequently extended by new feature widgets
- `client/src/components/layout/DashboardLayout.tsx`
  - App shell; new pages should integrate here
- `client/src/components/TopNavigation.tsx`, `MobileBottomNav.tsx`
  - Navigation integration points for new pages/sections
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx`, `client/src/components/ui/chart.tsx`
  - UI primitives; prefer these for consistency
- `client/src/components/ui-custom.tsx`
  - Custom UI wrappers/utilities (use when the repo already prefers these props/patterns)
- `client/src/components/settings/AppBranding.tsx`
  - Example settings component patterns
- `client/src/components/billing/*`
  - Example feature module components for billing/usage UI

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
  - Patterns for validating endpoint behavior; extend similarly for new endpoints

---

## 6) Best Practices (Specific to this Repo)

1. **Keep business logic in services** (`server/services/*`), not routes.
2. **Use shared models** from `shared/schema.ts` for consistency across client and server.
3. **Prefer incremental extension** of existing services (`MinioService`, `BillingService`, etc.) rather than creating new parallel abstractions.
4. **Add audit logs** for account-affecting actions using `AuditService`.
5. **Emit notifications** through `NotificationService` when user-visible events happen (billing, storage, access keys, etc.).
6. **Build UI using existing primitives** (`client/src/components/ui/*`) and existing layout/navigation patterns.
7. **Cover negative paths** (validation, auth, error handling) in tests—this repo already values endpoint error-handling coverage.

---

## 7) Definition of Done (Feature PR Checklist)

- [ ] Shared types updated (if needed) in `shared/schema.ts` and used consistently
- [ ] Server logic implemented in an appropriate `server/services/*` class
- [ ] Route handlers added/updated under `server/routes/*` with consistent error handling
- [ ] UI implemented using existing primitives and integrated into layout/navigation
- [ ] Audit logs added for sensitive actions (`server/services/audit.service.ts`)
- [ ] Notifications added if user-facing events require them (`NotificationService`)
- [ ] Tests added/updated under `testsprite_tests/*` for new/changed endpoints
- [ ] Documentation updated if the feature adds new configuration, endpoints, or workflows

---

## 8) Prompt Template for Running This Agent Effectively

Paste into an AI task request (fill brackets):

**Goal:** Implement “[FEATURE NAME]”.

**User story:**  
As a [role], I want [capability], so that [benefit].

**Acceptance criteria:**
- [ ] …
- [ ] …

**Scope constraints:**
- Must update shared types? [yes/no]
- New endpoints? [list]
- UI entrypoint: [Dashboard / Settings / New page]

**Security/Compliance:**
- Auth rules: …
- Audit log required? [yes/no, what details]
- Notification required? [yes/no, type/payload]

**Files likely involved:**
- Shared: `shared/schema.ts`, `shared/routes.ts`
- Server: `server/services/[...].ts`, `server/routes/[...].ts`
- Client: `client/src/pages/[...].tsx`, `client/src/components/[...]/[...].tsx`
- Tests: `testsprite_tests/[new or existing].py`

**Definition of Done:** use the checklist in section 7.

---
