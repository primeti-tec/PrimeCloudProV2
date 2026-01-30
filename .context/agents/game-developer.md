# Feature Developer Agent Playbook (PrimeCloudProV2)

A practical, codebase-aligned playbook for implementing product features end-to-end (DB/schema → server routes/services → client UI → tests) in `D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2`.

---

## 1) Mission & Scope

### What this agent is responsible for
- Delivering **new features** and **feature enhancements** across:
  - **Shared domain/models** (`shared/`)
  - **Server routes/controllers** (`server/routes`, `server/replit_integrations/auth`)
  - **Server services** (`server/services`)
  - **Client UI** (`client/src/pages`, `client/src/components`)
  - **Tests** (notably `testsprite_tests/` API-related validation)

### What “done” means in this repo
A feature is complete when:
- Types/models are defined centrally (typically in `shared/schema.ts`).
- Server behavior is implemented via **service layer** + **route handler**.
- Client exposes UX via **page + components** using existing UI patterns.
- Errors and validation are consistent.
- Tests exist or are updated (especially API validation & error handling tests).
- Feature is discoverable via existing navigation/layout patterns.

---

## 2) Codebase Map: Where to Work

### Shared: Domain models & cross-cutting types
**Primary location**
- `shared/schema.ts`  
  Key exported domain types include: `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`.

**Routing helpers**
- `shared/routes.ts`  
  Includes `buildUrl` (use for consistent URL construction / endpoint references where applicable).

**When to edit**
- Adding/changing a domain entity shape or DTO.
- Aligning server ↔ client typing.
- Defining new shared constants/types used by both sides.

---

### Server: Routes/controllers
**Primary locations**
- `server/routes/` (e.g., `server/routes/smtp.ts` contains `handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)

**When to edit**
- Introducing a new API endpoint.
- Wiring an endpoint to a service call.
- Adding request validation, auth checks, standardized error responses.

**Key principle**
- Keep controllers thin: parse/validate → call service → shape response.

---

### Server: Service layer (business logic)
**Primary locations**
- `server/services/minio.service.ts` (`MinioService`, `MinioConfig`, `BucketInfo`, `UsageMetrics`, etc.)
- `server/services/notification.service.ts` (`NotificationService`, `NotificationType`, `NotificationPayload`)
- `server/services/sftpgo.service.ts` (`SftpGoService` and related types)
- `server/services/billing.service.ts` (`BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`)
- `server/services/audit.service.ts` (`AuditService`, `AuditDetails`, `AuditLogPayload`)
- `server/services/domain-service.ts` (`DomainVerificationResult`)

**When to edit**
- Implementing feature logic, orchestration, integration with external systems.
- Adding new service methods that routes can call.
- Centralizing side effects (audit logging, notifications, billing impacts).

**Codebase pattern**
- Service Layer is a first-class pattern (strongly present). Prefer extending services over embedding business logic in routes or components.

---

### Client: Pages & components
**Primary locations**
- Pages: `client/src/pages/` (e.g., `Dashboard.tsx`, `not-found.tsx`)
- Layout: `client/src/components/layout/DashboardLayout.tsx`
- Navigation: `client/src/components/TopNavigation.tsx`, `client/src/components/MobileBottomNav.tsx`
- UI system:
  - `client/src/components/ui/*` (e.g., `ui/button.tsx`, `ui/badge.tsx`, `ui/chart.tsx`)
  - `client/src/components/ui-custom.tsx` (custom shared props like `ButtonProps`)
- Feature components:
  - Branding: `client/src/components/branding-provider.tsx`, `client/src/components/settings/AppBranding.tsx`
  - Billing widgets: `client/src/components/billing/*`
  - Notifications: `client/src/components/NotificationsBell.tsx`
  - Theme: `client/src/components/theme-provider.tsx`, `client/src/components/mode-toggle.tsx`

**When to edit**
- Implementing new screens or extending existing pages.
- Adding reusable components aligned with existing UI conventions.
- Extending existing “feature zones” (Billing, Settings/Branding, Notifications, Storage/Buckets).

---

### Tests
**Primary location**
- `testsprite_tests/`  
  Notable API-oriented tests:
  - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**When to edit**
- Adding endpoints: ensure error handling/validation is covered.
- Tightening response contracts: update tests to match.
- Performance regressions: update or add response-time-related checks.

---

## 3) Feature Delivery Workflow (End-to-End)

### A. Feature intake & design alignment (fast but explicit)
1. Identify the **domain object(s)** involved (e.g., `Bucket`, `Notification`, `Subscription`).
2. Identify the **service owner**:
   - Storage/buckets/lifecycle/usage → `MinioService`
   - Notifications → `NotificationService`
   - Billing/subscriptions/invoices/usage summaries → `BillingService`
   - Audit trail → `AuditService`
   - SFTP provisioning → `SftpGoService`
3. Decide whether this is:
   - **New endpoint + UI**
   - **Server-only** enhancement
   - **UI-only** enhancement (still ensure types match)

Deliverable at this step: a short “contract”:
- Endpoint(s) + request/response shape
- UI entry point (page/component)
- Audit/notification requirements
- Failure modes (validation errors, 404, permission denied, upstream failure)

---

### B. Shared types first (when applicable)
**Edit:** `shared/schema.ts`  
- Add/extend types used by both server and client.
- Prefer reusing existing exports (`Bucket`, `Notification`, etc.) to avoid drift.
- If introducing new concepts (e.g., “BucketPolicy”), add it here so server/client stay aligned.

**Rule:** If a payload crosses the network boundary, it should be typed in `shared/` (or clearly mapped from a shared type).

---

### C. Implement service logic (server/services)
**Edit:** appropriate service file (e.g., `server/services/minio.service.ts`)  
- Add a **single-purpose method** implementing the new capability.
- Handle external integration errors here; normalize them to meaningful errors for routes.
- If the feature impacts auditability or user visibility:
  - Call `AuditService` for security-relevant actions
  - Call `NotificationService` for user-facing events

**Service best practices (aligned with repo pattern)**
- Keep route handlers thin and push business logic into service methods.
- Use existing exported types (`UsageMetrics`, `LifecycleRule`, etc.) rather than reinventing shapes.
- Prefer returning structured result objects (typed) rather than raw strings.

---

### D. Wire up route/controller (server/routes)
**Edit:** a file in `server/routes/` (or add a new one consistent with existing patterns)
- Parse input parameters/body.
- Validate early (fail fast).
- Call the new service method.
- Return a consistent response shape.
- Ensure proper error mapping:
  - Validation → 400
  - Not found → 404
  - Permission/auth → 401/403
  - Upstream integration failure → 502/503 (or existing convention if present)

**Tip:** Use `shared/routes.ts`’s `buildUrl` when you need consistent route construction (especially for client link generation or cross-module route references).

---

### E. Client implementation (page + components)
**Edit:** `client/src/pages/*` and/or `client/src/components/*`
- Choose the right integration point:
  - New top-level feature page → add to `client/src/pages/` and wire into layout/navigation.
  - New panel/widget → add to the relevant feature folder (e.g., `billing/`, `settings/`).
- Reuse existing UI components:
  - Buttons from `client/src/components/ui/button.tsx`
  - Badges from `client/src/components/ui/badge.tsx`
  - Charts from `client/src/components/ui/chart.tsx`
  - Any custom button prop types from `client/src/components/ui-custom.tsx`
- Ensure consistent UX with:
  - `DashboardLayout` for authenticated app pages
  - `TopNavigation` and `MobileBottomNav` patterns
  - Theme integration via `ThemeProvider` and `ModeToggle`

**State & data fetching**
- Match existing patterns found in the app (avoid introducing a new state library unless the repo already uses it).
- Keep API response types aligned with `shared/schema.ts`.

---

### F. Tests & validation
**Edit/add:** `testsprite_tests/*`
- For new endpoints:
  - Add validation tests similar to `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - Add error-handling/perf coverage similar to `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
- Ensure:
  - Invalid input returns correct status and message.
  - Missing resources return 404.
  - Unauthorized access is rejected.
  - Response times remain within expected bounds (if tests enforce it).

---

## 4) Common Feature Recipes

### Recipe 1: Add a new API endpoint backed by an existing service
1. Add/confirm request/response types in `shared/schema.ts`.
2. Add a method to the relevant service in `server/services/*.ts`.
3. Add a route handler in `server/routes/*.ts` that calls the service.
4. Add/update client usage:
   - new page in `client/src/pages/` or component in `client/src/components/`.
5. Add tests in `testsprite_tests/` for validation + error handling.

---

### Recipe 2: Extend MinIO functionality (Buckets, Lifecycle, Usage)
**Files to focus**
- `server/services/minio.service.ts`
- Shared: `shared/schema.ts` for `Bucket`, `LifecycleRule` alignment
- Client: likely `client/src/components/billing/StorageOverviewCard.tsx`, `BucketUsageTable.tsx`

**Workflow**
1. Implement the new MinIO operation in `MinioService`.
2. Expose it via a route.
3. Update UI storage widgets and ensure metrics types match (`UsageMetrics`, `StorageQuota`, etc.).
4. Add API validation tests.

---

### Recipe 3: Add a user-visible event (Notification + Bell UI)
**Files to focus**
- `server/services/notification.service.ts`
- `client/src/components/NotificationsBell.tsx`
- Shared: `Notification` in `shared/schema.ts`

**Workflow**
1. Add a new `NotificationType` if needed.
2. Emit notifications from the service that owns the event (billing/minio/sftpgo/etc.) by calling `NotificationService`.
3. Ensure the client bell UI can render it (title/body/severity/time).
4. Add tests for the triggering endpoint to ensure notification emission doesn’t break error handling.

---

### Recipe 4: Add billing-related feature (usage summaries, invoices, upgrades)
**Files to focus**
- `server/services/billing.service.ts`
- Client billing components:
  - `client/src/components/billing/UpgradeRequestsCard.tsx`
  - `client/src/components/billing/ImperiusStatsCard.tsx`
  - `client/src/components/billing/StorageOverviewCard.tsx`

**Workflow**
1. Add/extend billing data types in shared if needed.
2. Add service method in `BillingService`.
3. Expose via route.
4. Update billing cards to display new data.
5. Add tests for performance/error handling (billing endpoints can be latency sensitive).

---

## 5) Codebase Conventions & Best Practices (Derived from Observed Structure)

### Architectural conventions
- **Service-first backend**: business logic belongs in `server/services/*`.
- **Shared types**: domain objects are exported from `shared/schema.ts`.
- **Component organization**: UI is organized by feature folders (billing/settings/layout/admin) and a `ui/` primitives layer.

### UI consistency rules
- Use existing `ui/` primitives rather than custom HTML styling in feature components.
- Place cross-app layout changes in `DashboardLayout`, navigation changes in `TopNavigation` / `MobileBottomNav`.
- Respect theming via `ThemeProvider` and `ModeToggle`.

### Maintainability rules
- Don’t duplicate types between server and client—promote to `shared/`.
- Keep route handlers thin; add orchestration to services.
- Ensure audit and notification side-effects are handled in services, not UI.

### Validation & error handling
- Validate at the edge (route layer), normalize errors in services.
- Keep error responses consistent to satisfy existing tests focused on error handling and validation.

---

## 6) Key Files & What They’re For (Quick Reference)

### Shared
- `shared/schema.ts` — canonical domain models (e.g., `Bucket`, `Notification`, `Subscription`).
- `shared/routes.ts` — route helpers (e.g., `buildUrl`).

### Server
- `server/routes/smtp.ts` — SMTP configuration/testing route handlers (`handleConfigureSMTP`, `handleTestSMTP`).
- `server/replit_integrations/auth/routes.ts` — authentication route registration (`registerAuthRoutes`).
- `server/services/minio.service.ts` — object storage operations, usage, lifecycle, quotas (`MinioService`).
- `server/services/notification.service.ts` — notification creation and typing (`NotificationService`, `NotificationType`).
- `server/services/sftpgo.service.ts` — SFTPGo integration/provisioning (`SftpGoService`).
- `server/services/billing.service.ts` — billing, pricing, invoices, summaries (`BillingService`).
- `server/services/audit.service.ts` — audit logging (`AuditService`).
- `server/services/domain-service.ts` — domain verification utilities (`DomainVerificationResult`).

### Client
- `client/src/pages/Dashboard.tsx` — dashboard entry.
- `client/src/pages/not-found.tsx` — 404 page.
- `client/src/components/layout/DashboardLayout.tsx` — standard authenticated layout.
- `client/src/components/TopNavigation.tsx` — top nav pattern.
- `client/src/components/MobileBottomNav.tsx` — mobile navigation.
- `client/src/components/NotificationsBell.tsx` — notifications UX entry point.
- `client/src/components/branding-provider.tsx` — branding configuration provider/hook (`useBranding`).
- `client/src/components/settings/AppBranding.tsx` — branding settings UI.
- `client/src/components/theme-provider.tsx` / `mode-toggle.tsx` — theming system.
- `client/src/components/ui/*` — UI primitives (`button`, `badge`, `chart`, etc.).
- `client/src/components/billing/*` — billing widgets and tables.

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — endpoint validation/error handling.
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — response time + error handling checks.

---

## 7) PR / Review Checklist (Feature Developer)

- [ ] Shared types updated (if payload crosses server-client boundary)
- [ ] Service method added/updated (business logic not in route)
- [ ] Route handler added/updated (validation + clean responses)
- [ ] UI implemented using existing layout/navigation and `ui/` primitives
- [ ] Notification/Audit side-effects included where appropriate
- [ ] Tests added/updated (validation + error handling; perf if applicable)
- [ ] No duplicated types across layers
- [ ] Feature is reachable/discoverable in UI (if user-facing)

---

## 8) When to Ask for Clarification (Stop-the-line triggers)
- Unclear ownership between services (e.g., billing vs minio vs audit responsibilities).
- Feature requires new domain model but its shape/fields aren’t specified.
- Error response contract must match existing tests but current conventions aren’t explicit in the touched area.
- UI navigation placement is ambiguous (top nav vs dashboard card vs settings vs admin).
