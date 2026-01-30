# Feature Developer Agent Playbook — PrimeCloudProV2

## Mission
Deliver end-to-end product features (API + services + UI) safely and consistently within the PrimeCloudProV2 architecture. Prefer extending existing patterns (service layer, shared schema/types, client components) over inventing new ones.

---

## Repository Orientation (What to Touch, Where)

### Core Areas (Primary)
#### 1) Shared Domain & Contracts
- **`shared/schema.ts`**
  - Central source of truth for domain models/types (e.g., `Product`, `Order`, `Account`, `Bucket`, `Notification`, `LifecycleRule`, etc.).
  - **When to edit:** Adding/adjusting domain fields, request/response shapes, or shared validation.
- **`shared/routes.ts`**
  - Contains routing helpers like **`buildUrl`**.
  - **When to edit:** Adding route builders, centralizing client/server route strings, or aligning API paths.

#### 2) Server (Backend)
- **`server/services/*`** (business logic layer)
  - **`minio.service.ts`** — storage/buckets/usage/lifecycle rules (`MinioService`, `LifecycleRule`, `UsageMetrics`, etc.).
  - **`sftpgo.service.ts`** — SFTPGo integration (`SftpGoService` and related types).
  - **`notification.service.ts`** — notifications (`NotificationService`, `NotificationType`).
  - **`billing.service.ts`** — pricing/usage/invoicing (`BillingService`, `PricingConfig`, etc.).
  - **`audit.service.ts`** — audit logs (`AuditService`, `AuditDetails`).
  - **`domain-service.ts`** — domain verification (`DomainVerificationResult`).
  - **When to edit:** Adding new business operations, integrating external systems, enforcing rules/permissions.
- **`server/routes/*`**
  - Example: **`server/routes/smtp.ts`** with `handleConfigureSMTP`, `handleTestSMTP`.
  - **When to edit:** Creating/adjusting HTTP endpoints that delegate to services.

#### 3) Client (Frontend)
- **Pages:** `client/src/pages/*`
  - Example: `Dashboard.tsx`, `not-found.tsx`.
  - **When to edit:** New screens, new workflows, route-level data fetching & composition.
- **Components:** `client/src/components/*`
  - Layout: `layout/DashboardLayout.tsx`
  - Navigation: `TopNavigation.tsx`, `MobileBottomNav.tsx`
  - Theming: `theme-provider.tsx`, `mode-toggle.tsx`
  - Branding: `branding-provider.tsx`, `settings/AppBranding.tsx`
  - Notifications: `NotificationsBell.tsx`
  - Billing UI: `billing/*` (e.g., `StorageOverviewCard.tsx`, `BucketUsageTable.tsx`)
  - UI primitives: `components/ui/*` (e.g., `button.tsx`, `badge.tsx`)
  - Custom UI wrappers: `ui-custom.tsx`
  - **When to edit:** Adding feature UI, adjusting existing modules, reusing design system primitives.

---

## Feature Development Workflow (End-to-End)

### Step 0 — Clarify Feature Boundaries (Fast Checklist)
Before coding, capture:
- User-facing behavior (what changes in UI?)
- API contract (inputs/outputs/errors)
- Data model impact (schema changes?)
- Permissions/auditing (should actions be logged?)
- Notifications (should users/admins be notified?)
- Billing/usage impact (does it affect quotas/invoices?)
- External integration (MinIO/SFTPGo/SMTP/domain verification)

Output: a short “feature brief” you can attach to PR description.

---

### Step 1 — Start From the Shared Contract
**Primary file:** `shared/schema.ts`

**Do this when adding/changing data:**
- Add or adjust the relevant exported types (e.g., `Bucket`, `Notification`, `AccountMember`).
- Prefer backward-compatible changes:
  - Add optional fields before making required changes.
  - Avoid renaming fields without a migration/compat layer.

**Definition of done:**
- Updated shared types reflect the feature.
- Server + client compile against the updated shared contract.

---

### Step 2 — Implement Business Logic in a Service (Server)
**Primary location:** `server/services/*`

**Rules:**
- Put orchestration, validations, and external API calls inside the relevant service class:
  - Storage feature → `MinioService`
  - Notifications → `NotificationService`
  - Billing changes → `BillingService`
  - Audit logging → `AuditService`
  - Domain verification → `domain-service.ts`
- Keep routes thin: routes should parse request → call service → map result to HTTP response.

**Typical service method checklist:**
- Validate inputs (types + runtime checks as needed)
- Enforce account/org boundaries
- Call external system if needed (MinIO/SFTPGo/etc.)
- Emit audit log entry (if action is meaningful)
- Trigger notification (if user should know)
- Return a typed result for the route

**Definition of done:**
- New method(s) added to the appropriate service
- Errors are handled and mapped to consistent API responses
- Unit/integration tests updated/added if patterns exist (see Testing section)

---

### Step 3 — Expose/Update an API Route (Server)
**Primary location:** `server/routes/*` (and any central route registration location used in this repo)

**Rules:**
- Route handler responsibilities:
  - Parse params/body
  - Call service method(s)
  - Translate known errors to HTTP status codes
  - Return JSON shaped according to `shared/schema.ts`
- Prefer reusing helper utilities if they exist in `shared/routes.ts` or server routing utilities.

**Error handling guidance (aligned with existing testsprite tests):**
- Ensure API endpoints:
  - Validate bad inputs (return 400-ish)
  - Handle service failures gracefully (return 500-ish with safe message)
  - Maintain consistent response shape

**Definition of done:**
- Endpoint works locally end-to-end
- Error cases return predictable status + payload

---

### Step 4 — Wire the UI (Client)
**Primary locations:** `client/src/pages/*`, `client/src/components/*`

**Rules:**
- Prefer composing existing components:
  - Use layout components like `DashboardLayout`
  - Use primitives from `components/ui/*` (`Button`, `Badge`, etc.)
  - Reuse notifications UI (`NotificationsBell`) when relevant
- Keep page components focused on composition; factor reusable feature blocks into `client/src/components/<feature>/...` if it grows.

**Branding & theme considerations:**
- If adding UI that depends on brand colors/logos, integrate with:
  - `BrandingProvider` / `useBranding` (`client/src/components/branding-provider.tsx`)
  - `ThemeProvider` (`client/src/components/theme-provider.tsx`)
  - `ModeToggle` for dark/light mode expectations

**Definition of done:**
- UI matches existing look/feel and is navigable
- Works in both theme modes if applicable
- Empty/loading/error states handled

---

### Step 5 — Cross-Cutting: Notifications, Auditing, Billing
Use these as “feature finishers” when relevant:

#### Notifications
- **Server:** `server/services/notification.service.ts` (`NotificationService`, `NotificationType`)
- **Client:** `client/src/components/NotificationsBell.tsx`
- Add a notification when:
  - A user needs awareness (success/failure of long-running actions, admin events, billing events)

#### Audit Logs
- **Server:** `server/services/audit.service.ts`
- Add audit entries for:
  - Security-sensitive actions (credentials, access keys, permissions)
  - Billing changes
  - Resource lifecycle changes (bucket policies/lifecycle rules)

#### Billing / Usage
- **Server:** `server/services/billing.service.ts`
- Ensure:
  - Any change affecting quotas, plans, or usage metrics is reflected in billing calculations
  - UI cards/tables in `client/src/components/billing/*` are updated if they display the impacted metrics

---

## Common Feature Recipes (Repeatable Playbooks)

### A) Add a New “Account-Level Setting”
1. Update type(s) in `shared/schema.ts` (e.g., `Account`)
2. Add service method in appropriate server service (or create one if missing)
3. Create/extend route in `server/routes/*`
4. Add UI under `client/src/components/settings/*` (see `AppBranding.tsx` as a pattern)
5. Add audit log entry for changes; notification if relevant

### B) Add a Storage/Bucket Capability (MinIO)
1. Add/extend contract types (`Bucket`, `LifecycleRule`, `UsageMetrics`) in `shared/schema.ts`
2. Implement in `server/services/minio.service.ts` (`MinioService`)
3. Route: add endpoint that calls `MinioService`
4. UI:
   - Overview widgets: `client/src/components/billing/StorageOverviewCard.tsx`
   - Tables: `client/src/components/billing/BucketUsageTable.tsx`
5. Verify quota/usage implications (billing)

### C) Add a Notification-producing Event
1. Add a new `NotificationType` (if needed) in `server/services/notification.service.ts`
2. Emit from the service that performs the action (not from the route)
3. Ensure the payload fits `NotificationPayload`
4. Confirm the bell UI renders it appropriately (`NotificationsBell.tsx`)

### D) Integrate a New SMTP-related Behavior
Follow the pattern in `server/routes/smtp.ts`:
- Add handler functions similar to `handleConfigureSMTP` / `handleTestSMTP`
- Validate inputs
- Return actionable errors
- Add UI in settings area if needed

---

## Codebase Conventions to Follow (Derived From Existing Structure)

### Architectural Conventions
- **Service Layer First:** Business logic belongs in `server/services/*`. Routes should be thin wrappers.
- **Shared Types:** Prefer `shared/schema.ts` for data shapes used across client/server.
- **Component Reuse:** Prefer existing primitives in `client/src/components/ui/*` and existing layout/navigation components.

### Naming & Organization
- Services are class-based and exported (e.g., `MinioService`, `BillingService`).
- Prefer feature grouping in client components (`components/billing/*`, `components/settings/*`, etc.).

### UI Consistency
- Use existing UI primitives: `Button`, `Badge`, and patterns from `ui-custom.tsx` where applicable.
- Respect theme/branding providers for new UI elements.

---

## Testing & Quality Gates

### Existing Test Signals
There are `testsprite_tests/*` that emphasize:
- API endpoint error handling and validation
- Response time and resiliency expectations

### What to do for any feature that adds/changes endpoints
- Verify:
  - Good path (200)
  - Bad input (4xx with clear error)
  - External dependency failure (5xx without leaking secrets)
- Add/adjust automated tests if the repo has a standard test runner; otherwise, document manual verification steps in the PR.

### Manual Verification Checklist (Minimum)
- Server endpoint works with realistic payloads
- UI renders and handles loading/error/empty
- Notification/audit entries appear when expected
- No sensitive data logged or returned

---

## Implementation Checklist (Use in Every PR)

### Backend
- [ ] Shared types updated (`shared/schema.ts`) if needed
- [ ] Service method added/updated in `server/services/*`
- [ ] Route added/updated in `server/routes/*`
- [ ] Error handling: consistent statuses + safe messages
- [ ] Audit log added for sensitive actions (`AuditService`)
- [ ] Notification emitted when user-facing (`NotificationService`)

### Frontend
- [ ] UI built using existing primitives (`client/src/components/ui/*`)
- [ ] Page composition follows existing layout (`DashboardLayout`, nav components)
- [ ] Branding/theme respected (`BrandingProvider`, `ThemeProvider`)
- [ ] Loading/error/empty states included

### Cross-Cutting
- [ ] Billing impact reviewed (`BillingService`, billing UI components)
- [ ] Storage/quota impact reviewed (`MinioService`, storage UI components)
- [ ] No secrets in responses/logs/config

---

## Key Files (Quick Reference)

### Shared
- `shared/schema.ts` — canonical domain types/models
- `shared/routes.ts` — route helpers (`buildUrl`)

### Server
- `server/services/minio.service.ts` — buckets/usage/lifecycle
- `server/services/sftpgo.service.ts` — SFTPGo integration
- `server/services/notification.service.ts` — notifications
- `server/services/billing.service.ts` — billing/pricing/invoices
- `server/services/audit.service.ts` — audit logging
- `server/services/domain-service.ts` — domain verification
- `server/routes/smtp.ts` — SMTP route handlers (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` — auth route registration (`registerAuthRoutes`)

### Client
- `client/src/pages/Dashboard.tsx` — main dashboard page
- `client/src/components/layout/DashboardLayout.tsx` — primary app layout
- `client/src/components/TopNavigation.tsx` — top nav
- `client/src/components/MobileBottomNav.tsx` — mobile nav
- `client/src/components/NotificationsBell.tsx` — notifications UI
- `client/src/components/branding-provider.tsx` — branding context (`useBranding`)
- `client/src/components/settings/AppBranding.tsx` — branding settings UI
- `client/src/components/theme-provider.tsx` — theme context
- `client/src/components/mode-toggle.tsx` — theme toggle
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx` — UI primitives
- `client/src/components/billing/*` — billing and storage-related UI cards/tables

---

## “Don’t Surprise the Codebase” Rules
- Don’t put business logic in routes; put it in services.
- Don’t invent new model shapes only on one side (server/client); update `shared/schema.ts`.
- Don’t build one-off UI patterns; reuse `components/ui/*` and existing layout/navigation.
- Don’t skip audit/notification/billing review when touching sensitive workflows.
- Don’t return raw upstream errors; sanitize and standardize API responses.

---

## Suggested PR Structure (Template)
1. **Summary:** what the feature does
2. **API/Contract changes:** `shared/schema.ts` + endpoints
3. **Service changes:** which service(s) and why
4. **UI changes:** pages/components touched + screenshots if applicable
5. **Verification:** good path + key error paths
6. **Risk notes:** external dependencies, migrations, backward compatibility
