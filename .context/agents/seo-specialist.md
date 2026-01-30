# Feature-Developer Agent Playbook — PrimeCloudProV2

## Mission
Deliver end-to-end product features (backend + frontend) while preserving the repository’s layered architecture and established service-driven patterns. Build changes that are:
- Type-safe across server/client using `shared/`
- Centered on service classes in `server/services/`
- Exposed via route handlers in `server/routes/`
- Reflected in UI via `client/src/pages/` and `client/src/components/`
- Observable via `AuditService` and `NotificationService` when appropriate

---

## 1) Where to Work (Primary Focus Areas)

### Shared (contracts + domain shapes)
**Purpose:** Keep types/schemas aligned between backend and frontend.
- `shared/schema.ts` — Canonical domain models (e.g., `Order`, `Subscription`, `Bucket`, `Notification`).
- `shared/routes.ts` — Route helpers (notably `buildUrl`), shared route definitions/patterns.

**When to touch:**
- Adding new entities, fields, or payload types used by both server and client.
- Extending existing domain objects (e.g., adding fields to `Bucket`, `Account`, `Subscription`).

---

### Backend (features live in services, not routes)
**Purpose:** Implement business logic and external integrations.
- `server/services/` — **Primary** feature-development surface.
  - `minio.service.ts` — storage/buckets/usage/lifecycle rules integration.
  - `sftpgo.service.ts` — SFTPGo users, virtual folders, filesystem mapping.
  - `billing.service.ts` — usage/pricing summaries + invoices.
  - `notification.service.ts` — notification dispatching + types.
  - `audit.service.ts` — compliance/event trail.
  - `domain-service.ts` — domain verification logic.

**Routing / controllers:**
- `server/routes/` — thin HTTP layer; validates input, calls services, maps errors to HTTP codes.
  - Example: `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`).

**When to touch:**
- New capability → add/extend service method(s) first, then add route handler(s).
- Any feature involving external systems (MinIO/SFTPGo) → implement in the corresponding service.

---

### Frontend (pages compose components; components use shared UI)
**Pages (route entry points):**
- `client/src/pages/` — screens like `Dashboard.tsx`, `not-found.tsx`

**Components:**
- `client/src/components/` — application and feature components
  - Layout/shell: `layout/DashboardLayout.tsx`, `TopNavigation.tsx`, `MobileBottomNav.tsx`
  - Branding/theming: `branding-provider.tsx`, `theme-provider.tsx`, `mode-toggle.tsx`
  - Notifications: `NotificationsBell.tsx`
  - Billing UI: `components/billing/*` (overview cards, usage tables)

**UI toolkit:**
- `client/src/components/ui/` — shadcn-based primitives (`button.tsx`, `badge.tsx`, `chart.tsx`)
- `client/src/components/ui-custom.tsx` — custom/extended UI wrappers

**When to touch:**
- New screen → add page in `client/src/pages/`, compose existing components.
- New reusable UI → implement in `client/src/components/` or `client/src/components/ui-custom.tsx`.

---

### Tests
- `testsprite_tests/` — Python-based integration/API tests (notably validation + error handling)
  - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**When to touch:**
- Adding/changing endpoints → update/extend these tests to match response/validation rules.

---

## 2) Feature Development Workflow (End-to-End)

### A. Define the feature boundaries
1. Identify affected domain entities (e.g., `Bucket`, `Account`, `Notification`).
2. Identify which service owns the logic:
   - Storage/buckets/objects/usage → `MinioService`
   - SFTP users/folders → `SftpGoService`
   - Pricing/usage summaries → `BillingService`
   - User-facing events → `NotificationService`
   - Compliance/audit → `AuditService`

**Rule of thumb:** If it’s business logic, it goes into a service class. Routes remain thin.

---

### B. Update shared contracts (if needed)
1. Add/extend types in `shared/schema.ts` for:
   - New request/response payloads
   - New entity fields used on both ends
2. If the client builds URLs via shared helpers, ensure route patterns align with `shared/routes.ts` / `buildUrl`.

**Acceptance check:** frontend can compile without duplicating backend types.

---

### C. Implement business logic in the appropriate service
1. Add a method to the relevant service class in `server/services/*`.
2. Follow existing conventions:
   - Encapsulate integration client initialization privately.
   - Export relevant interfaces/types (for complex responses).
   - Throw **descriptive** errors (routes convert these into HTTP responses).

**Cross-cutting concerns:**
- Record auditable actions via `AuditService` when a user-initiated action changes state (create/delete/update operations).
- Trigger user-visible feedback via `NotificationService` where appropriate (e.g., provisioning started/completed/failed).

---

### D. Expose the capability via server routes
1. Add a new route file under `server/routes/` or extend an existing feature route module.
2. Route handlers should:
   - Parse/validate request input
   - Call service methods
   - Map known failure cases to correct HTTP status codes
   - Return stable JSON shapes (aligned with `shared/schema.ts`)

**Pattern reference:** `server/routes/smtp.ts` for handler structure.

---

### E. Implement UI and wiring
1. Add/update page under `client/src/pages/` to expose the feature.
2. Use existing layout patterns:
   - Wrap pages in `DashboardLayout`
   - Ensure `TopNavigation` and `MobileBottomNav` behavior remains consistent
3. Build feature UI using:
   - `client/src/components/ui/*` primitives first
   - `ui-custom.tsx` for extended behaviors
4. Respect white-labeling:
   - Use `useBranding()` from `branding-provider.tsx` for brand-dependent UI.

---

### F. Validate with integration tests
1. Update/add `testsprite_tests/*` for:
   - Error handling & validation expectations (TC017)
   - Response time/error behavior (TC014) where applicable
2. Ensure endpoint errors are consistent and testable (stable error messages/codes if used).

---

## 3) Common Task Playbooks (Step-by-Step)

### 3.1 Add a new API endpoint that uses an existing service
1. **Service**: confirm needed method exists in `server/services/<domain>.service.ts`. Add if missing.
2. **Route**: create/extend `server/routes/<feature>.ts` with a handler.
3. **Register**: ensure the route module is wired into the server’s routing (commonly done in the server entry; follow existing registration pattern in the backend).
4. **Shared types**: add request/response types to `shared/schema.ts` if used by the client.
5. **Test**: update `testsprite_tests/TC017*` for validation and error handling.

**Do not:** place business logic in the route handler.

---

### 3.2 Add a new storage feature (MinIO)
Use `server/services/minio.service.ts` as the single integration point.

Steps:
1. Add method to `MinioService` (e.g., lifecycle/usage/bucket operation).
2. If it returns new shapes, export types (and mirror to `shared/schema.ts` when used in UI).
3. Route: add endpoints in `server/routes/` to call the new method.
4. UI: extend billing/storage components:
   - `client/src/components/billing/StorageOverviewCard.tsx`
   - `client/src/components/billing/BucketUsageTable.tsx`
   - Charts: follow `client/src/components/ui/chart.tsx` config patterns (`ChartConfig`).

---

### 3.3 Add a new notification type
1. Add a new enum/value in `NotificationType` in `server/services/notification.service.ts`.
2. Ensure payload shape aligns with `NotificationPayload`.
3. Trigger notifications from service methods (not in routes), especially around long-running or user-impactful operations.
4. UI should surface via existing notification UI:
   - `client/src/components/NotificationsBell.tsx`

---

### 3.4 Add auditable actions (recommended for state changes)
1. Determine the action category and payload structure.
2. Log via `AuditService` in the service method that performs the action.
3. Keep logs meaningful (who/what/when/target/result).

---

### 3.5 Add a new UI screen in the dashboard
1. Create a page in `client/src/pages/`.
2. Compose UI with `DashboardLayout`.
3. Prefer shadcn primitives from `client/src/components/ui/` and existing feature components.
4. Integrate branding:
   - Use `useBranding()` for brand colors/logos
   - Ensure dark mode compatibility via `theme-provider.tsx` and `mode-toggle.tsx`

---

## 4) Codebase-Derived Best Practices & Conventions

### Backend
- **Service-first architecture:** The repository strongly favors class-based services (`MinioService`, `SftpGoService`, `BillingService`, `AuditService`, `NotificationService`).
- **Thin controllers:** Route handlers should orchestrate HTTP only; logic stays in services.
- **Typed payloads:** Add shared types in `shared/schema.ts` when the client consumes server data.
- **Descriptive errors:** Services throw meaningful errors; routes convert to HTTP status codes (keeps logic reusable).

### Frontend
- **Consistency via UI primitives:** Use `client/src/components/ui/button.tsx`, `badge.tsx`, and chart patterns from `ui/chart.tsx`.
- **Branding-aware UI:** Any visual identity usage should go through `BrandingProvider` / `useBranding()` rather than hardcoding.
- **Layout discipline:** Keep authenticated experiences inside `DashboardLayout` and ensure mobile navigation remains functional.

### Testing
- **API error handling matters:** Existing TestSprite tests focus on endpoint validation and resilience. Any new endpoint should have predictable validation failures and error responses.

---

## 5) Key Files Index (What They’re For)

### Shared
- `shared/schema.ts` — Domain models and shared schemas (`Product`, `Order`, `Subscription`, `Bucket`, `Notification`, etc.).
- `shared/routes.ts` — Shared route helpers (`buildUrl`) and routing conventions.

### Server
- `server/services/minio.service.ts` — Storage integration (buckets, usage, lifecycle rules).
- `server/services/sftpgo.service.ts` — SFTPGo integration (users, folders, permissions).
- `server/services/billing.service.ts` — Pricing config, usage summaries, invoice shaping.
- `server/services/notification.service.ts` — Notification types and dispatch logic.
- `server/services/audit.service.ts` — Audit logging payloads and persistence behavior.
- `server/services/domain-service.ts` — Domain verification (`DomainVerificationResult`).
- `server/routes/smtp.ts` — Example route handlers (`handleConfigureSMTP`, `handleTestSMTP`).
- `server/replit_integrations/auth/routes.ts` — Auth route registration (`registerAuthRoutes`).

### Client
- `client/src/pages/Dashboard.tsx` — Main dashboard page.
- `client/src/pages/not-found.tsx` — 404.
- `client/src/components/layout/DashboardLayout.tsx` — Authenticated shell layout.
- `client/src/components/TopNavigation.tsx` — Primary navigation bar.
- `client/src/components/MobileBottomNav.tsx` — Mobile navigation.
- `client/src/components/theme-provider.tsx` — Theme context wiring.
- `client/src/components/mode-toggle.tsx` — Theme toggle UI.
- `client/src/components/branding-provider.tsx` — Branding context (`useBranding`, `BrandingProvider`).
- `client/src/components/NotificationsBell.tsx` — Notification UI entry point.
- `client/src/components/ui-custom.tsx` — Custom UI extensions.
- `client/src/components/ui/button.tsx`, `badge.tsx` — Standard UI primitives.
- `client/src/components/ui/chart.tsx` — Chart configuration patterns (`ChartConfig`).
- `client/src/components/billing/*` — Billing/usage visualization components.

### Tests
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py` — Validation/error handling expectations.
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py` — Timing and resilience expectations.

---

## 6) Definition of Done (Feature Checklist)

### Contracts & Architecture
- [ ] Shared types updated in `shared/schema.ts` (if client consumes the data)
- [ ] Business logic implemented in a `server/services/*` class (not in routes)
- [ ] Route handler added/updated in `server/routes/*` and wired into routing
- [ ] Errors are descriptive and mapped to correct HTTP statuses

### Cross-cutting
- [ ] Audit logging added via `AuditService` for state-changing actions
- [ ] User notifications added via `NotificationService` when relevant

### UI/UX
- [ ] UI implemented with existing primitives/components where possible
- [ ] Page uses `DashboardLayout` where appropriate
- [ ] Branding respected via `useBranding()`; works with theme provider (dark/light)
- [ ] Mobile behavior verified (navigation/layout)

### Tests
- [ ] TestSprite tests updated/added for new/changed endpoints
- [ ] Validation and error cases covered (TC017 patterns)

---

## 7) Practical “Routing + Service” Template (How to Think About It)

**Service method (source of truth):**
- Takes typed inputs
- Performs orchestration
- Calls external integration clients
- Writes audit log
- Emits notification
- Returns a typed result

**Route handler (HTTP adapter):**
- Validates request
- Calls service method
- Converts errors into HTTP responses
- Returns JSON using shared response shapes

This separation is the core feature-development convention in PrimeCloudProV2.
