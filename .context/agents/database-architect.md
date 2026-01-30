# Feature-Developer Agent Playbook (PrimeCloudProV2)

## Mission
Build product features end-to-end (UI → API → services → shared types) while preserving:
- **Type-safety** via shared schema/routes
- **Layering** (UI pages/components → server routes/controllers → service layer)
- **Consistency** with existing patterns in `server/services/*` and `client/src/components/*`

---

## 1) Where to Work (Primary Areas)

### Client (UI)
**Focus directories**
- `client/src/pages/` — page-level feature entry points (routing, data fetching, layout usage)
- `client/src/components/` — feature components (e.g., notifications, top nav, layout)
- `client/src/components/ui/` — design-system primitives (buttons, badges, charts)
- `client/src/components/settings/` — settings-related UX (e.g., branding)
- `client/src/components/billing/` — billing-related UI modules
- `client/src/components/layout/` — shared layouts (dashboard shell, nav)

**Key files (examples/pattern sources)**
- `client/src/pages/Dashboard.tsx` — dashboard page conventions
- `client/src/pages/not-found.tsx` — error/404 pattern
- `client/src/components/layout/DashboardLayout.tsx` — layout + composition
- `client/src/components/TopNavigation.tsx` — top-level navigation patterns
- `client/src/components/NotificationsBell.tsx` — notifications UI + props pattern
- `client/src/components/branding-provider.tsx` — app-wide branding context/provider
- `client/src/components/theme-provider.tsx`, `client/src/components/mode-toggle.tsx` — theming

### Server (API + business logic)
**Focus directories**
- `server/routes/` — HTTP route handlers and wiring
- `server/services/` — business logic (preferred place for non-trivial logic)
- `server/replit_integrations/auth/` — auth route integration

**Key files (examples/pattern sources)**
- `server/routes/smtp.ts` — controller/route handler style (`handleConfigureSMTP`, `handleTestSMTP`)
- `server/replit_integrations/auth/routes.ts` — auth routing registration pattern
- `server/services/minio.service.ts` — domain service with typed models and multiple operations
- `server/services/notification.service.ts` — notification domain logic + types
- `server/services/sftpgo.service.ts` — external integration service pattern
- `server/services/billing.service.ts` — billing computations/aggregation pattern
- `server/services/audit.service.ts` — auditing/logging service pattern
- `server/services/domain-service.ts` — domain verification/service return types

### Shared (types, routes, contracts)
**Focus directories**
- `shared/`, `shared/models/`
- `shared/schema.ts` — canonical exported domain models

**Key exports used across layers**
- Models: `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, `LifecycleRule`
- Routes helper: `buildUrl` in `shared/routes.ts`

### Tests
- `tests/components` — UI component tests (if present/used)
- `testsprite_tests/` — Python-based endpoint validation/performance/error handling tests (e.g., `TC014_*`, `TC017_*`)

---

## 2) Architecture & Conventions to Follow

### Layering rule (default)
1. **UI** calls API (or uses an existing client abstraction if present)
2. **Server routes/controllers** validate inputs and translate HTTP ↔ domain
3. **Service layer** (`server/services/*`) owns business logic and integrations
4. **Shared schema** (`shared/schema.ts`) owns cross-layer types/contracts

**Do**
- Add/extend logic in `server/services/*` first, then expose via routes.
- Reuse `shared/schema.ts` models for request/response payloads whenever feasible.

**Avoid**
- Putting business logic directly in route handlers or UI pages.
- Duplicating types in `client/` and `server/` when a shared type exists.

---

## 3) Common Feature Workflows (Step-by-Step)

### A) Add a New Feature (Full Stack)
1. **Define the feature contract**
   - Identify required domain objects (often already in `shared/schema.ts`).
   - If new types are needed, add them to `shared/schema.ts` and export them.

2. **Implement/extend service logic**
   - Add a method to the relevant service:
     - Storage/object features → `server/services/minio.service.ts`
     - Notifications → `server/services/notification.service.ts`
     - Billing/usage → `server/services/billing.service.ts`
     - Auditing → `server/services/audit.service.ts`
     - SFTPGo operations → `server/services/sftpgo.service.ts`
   - Keep service methods:
     - deterministic where possible
     - typed inputs/outputs
     - explicit about external failures (throw typed/known errors where used)

3. **Expose via API route**
   - Add a handler in `server/routes/*` (or create a new file if the domain is new).
   - Follow the style seen in `server/routes/smtp.ts`:
     - parse/validate input
     - call service
     - return consistent JSON
     - handle errors with meaningful status codes

4. **Add/extend shared route utilities (if needed)**
   - If the client needs URL building or shared route definitions, use `shared/routes.ts` and `buildUrl`.

5. **Build UI**
   - Page-level wiring in `client/src/pages/*` (e.g., new settings page, new dashboard section).
   - Create reusable pieces in `client/src/components/*`.
   - Prefer existing UI primitives in `client/src/components/ui/*` and patterns in `ui-custom.tsx`.

6. **Add tests**
   - API behavior/error handling: update/add `testsprite_tests/*` (especially for validation and error states).
   - UI: add/extend component tests under `tests/components` if the project uses them for that area.

7. **Audit + notifications (when relevant)**
   - If the feature changes user-visible state or security posture:
     - log via `AuditService`
     - notify via `NotificationService` where appropriate

---

### B) Add a New API Endpoint (Route + Service)
**Checklist**
- [ ] Service method exists and is unit-testable
- [ ] Handler validates input and maps errors to HTTP codes
- [ ] Response type aligns with `shared/schema.ts` exports
- [ ] Endpoint covered by error-handling tests in `testsprite_tests`

**Recommended pattern**
- Create/extend a handler file in `server/routes/<domain>.ts`
- Export handler functions (similar to `handleConfigureSMTP`, `handleTestSMTP`)
- Register routes in the server’s route registry (wherever existing route registration occurs)

---

### C) Add a New UI Page/Section (Dashboard/Settings)
1. Start at `client/src/pages/`:
   - Compose the page with `DashboardLayout` if it belongs in the dashboard.
2. Break UI into components under `client/src/components/<domain>/`:
   - e.g., `billing/*`, `settings/*`, `admin/*`
3. Use existing providers:
   - Branding → `BrandingProvider`/`useBranding` in `branding-provider.tsx`
   - Theme → `ThemeProvider`, `ModeToggle`
4. Use existing primitives:
   - Buttons → `client/src/components/ui/button.tsx`
   - Badges → `client/src/components/ui/badge.tsx`
   - Charts → `client/src/components/ui/chart.tsx`
5. Keep page files thin: orchestration + layout + data loading.

---

### D) Extend MinIO/Bucket/Lifecycle Features
**Where to work**
- `server/services/minio.service.ts` (core)
- `shared/schema.ts` (domain types like `Bucket`, `LifecycleRule`)
- UI tables/cards: `client/src/components/billing/BucketUsageTable.tsx`, `StorageOverviewCard.tsx` (usage-related UX)

**Best practices**
- Ensure lifecycle/usage objects match the shared `LifecycleRule` shape.
- Keep MinIO credentials/config encapsulated in `MinioService` and pass typed config (`MinioConfig`).

---

### E) Notifications Feature Work
**Where to work**
- Server: `server/services/notification.service.ts`
- UI: `client/src/components/NotificationsBell.tsx`
- Shared: `Notification` model in `shared/schema.ts`

**Best practices**
- Add a new notification category via existing enums/types:
  - e.g., `NotificationType` and `NotificationPayload`
- Keep payload minimal but sufficient for UI rendering.
- Ensure UI gracefully handles empty/unread states.

---

### F) Billing/Usage Feature Work
**Where to work**
- Server: `server/services/billing.service.ts` (`PricingConfig`, `UsageSummary`, `InvoiceData`)
- UI: `client/src/components/billing/*` cards and tables

**Best practices**
- Keep pricing rules in the server service (single source of truth).
- UI should not re-implement billing math—only display formatted results.

---

## 4) Codebase-Derived Best Practices

### Use shared models instead of duplicating types
- Prefer types exported from `shared/schema.ts` (`Account`, `Bucket`, `Notification`, etc.)
- If you introduce a new domain concept, add it to `shared/schema.ts` and re-export.

### Prefer service classes for business logic
This repo heavily uses a service layer:
- External integrations and complex operations belong in `server/services/*`.
- Route handlers should stay thin and orchestration-focused.

### Keep UI components modular and domain-grouped
The client is organized by domain folders (`billing/`, `settings/`, `admin/`, `layout/`).
- Add new feature UI under an existing domain folder when possible.
- Only add to `ui/` if it’s a reusable primitive.

### Validate and test error handling
There are dedicated endpoint tests for error handling/validation:
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

When adding endpoints:
- Return clear validation errors
- Ensure predictable status codes for common failures
- Add/extend tests to cover invalid inputs and failure modes

---

## 5) “Golden Paths” (Common Feature Recipes)

### Recipe: “Add a Settings Toggle”
- Shared: add config shape/type if it crosses server/client
- Server: add persistence or integration in relevant service
- Routes: add `GET` to fetch current setting + `POST/PUT` to update
- UI: add component under `client/src/components/settings/`
- Layout: mount in a settings page using existing layout patterns

### Recipe: “Add a Dashboard Card”
- UI: create card component under `client/src/components/<domain>/`
- Page: import into `client/src/pages/Dashboard.tsx` or relevant page
- Server: add a single API endpoint returning card-ready aggregated data
- Service: compute/aggregate in `BillingService`/`MinioService`/other domain service

### Recipe: “Add an Audit Trail for a Feature”
- Server: add calls into `AuditService` at state-changing points
- Include `AuditDetails`-like structured payloads
- Ensure audit is written even when notifications fail (best-effort secondary)

---

## 6) Pull Request Quality Checklist (Feature Developer)

### Contract & Types
- [ ] Shared types added/updated in `shared/schema.ts` (if needed)
- [ ] Client and server use the same exported types (no duplicate interfaces)

### Server
- [ ] Business logic lives in `server/services/*`
- [ ] Route handlers are thin and handle validation + status codes
- [ ] Errors are mapped consistently (validation vs auth vs integration failures)

### Client
- [ ] Page files orchestrate; components contain reusable UI
- [ ] Uses existing primitives (`ui/button`, `ui/badge`, etc.)
- [ ] Works with providers (branding/theme) when relevant

### Tests
- [ ] API endpoint tests updated/added under `testsprite_tests/` for:
  - invalid input
  - expected error codes
  - response-time expectations (where applicable)
- [ ] UI tests added if the repo’s `tests/components` is used for that area

### Observability & Safety
- [ ] Audit logs added for critical actions (when applicable)
- [ ] Notifications integrated appropriately (when user-visible)

---

## 7) Key Files & Their Purpose (Quick Reference)

### Shared
- `shared/schema.ts` — canonical exported domain models (`Account`, `Bucket`, `Notification`, etc.)
- `shared/routes.ts` — shared routing utilities including `buildUrl`

### Server
- `server/routes/smtp.ts` — example route/controller patterns and error handling
- `server/replit_integrations/auth/routes.ts` — auth route registration
- `server/services/minio.service.ts` — MinIO storage domain operations + metrics/quota/lifecycle
- `server/services/notification.service.ts` — notification creation/delivery logic
- `server/services/sftpgo.service.ts` — SFTPGo integration and user/filesystem provisioning
- `server/services/billing.service.ts` — pricing configuration and usage/invoice summaries
- `server/services/audit.service.ts` — audit logging and structured audit payloads
- `server/services/domain-service.ts` — domain verification abstractions/types

### Client
- `client/src/pages/Dashboard.tsx` — dashboard composition and page conventions
- `client/src/pages/not-found.tsx` — 404 pattern
- `client/src/components/layout/DashboardLayout.tsx` — main app layout shell
- `client/src/components/TopNavigation.tsx` — navigation patterns
- `client/src/components/NotificationsBell.tsx` — notification UI
- `client/src/components/branding-provider.tsx` — branding context/provider
- `client/src/components/settings/AppBranding.tsx` — branding settings UI
- `client/src/components/billing/*` — billing/usage UI modules
- `client/src/components/ui-custom.tsx` — custom UI wrappers/props conventions
- `client/src/components/ui/button.tsx`, `client/src/components/ui/badge.tsx` — shared UI primitives

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — validation/error handling checks
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — perf/error handling checks

---

## 8) Escalation / When to Ask for Help
Ask the user (or hand off to a specialized agent) when:
- A feature requires **schema or migration** work → use the `database-architect` agent
- You need to define **new domain entities** with unclear relationships or lifecycle
- Integration requirements are ambiguous (SMTP/MinIO/SFTPGo/auth providers)
- Error-handling requirements (status codes/messages) aren’t specified for public APIs
