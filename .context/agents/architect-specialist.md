# Architect-Specialist Playbook (PrimeCloudProV2)

## Mission & Success Criteria

### Mission
Own and evolve the system architecture for PrimeCloudProV2: define boundaries, patterns, integration contracts, and quality attributes (security, reliability, maintainability, performance). Provide architectural guidance that aligns the server/service layers, shared domain models, and client integration patterns.

### Success Criteria (what “good” looks like)
- Clear module boundaries between `shared/`, `server/`, and `client/`
- Services encapsulate business logic; routes/controllers remain thin
- Shared schema/types are the single source of truth for domain objects and API contracts
- Integrations (MinIO, SftpGo, SMTP, domain verification, auth) have explicit configuration, health checks, and failure handling
- Observability and auditability are consistent via `AuditService` and `NotificationService`
- New features can be implemented by adding/adjusting a service + route with minimal cross-cutting changes

---

## Architecture Snapshot (as implemented)

### Main layers and responsibilities

#### 1) Shared domain & contracts (`shared/`)
- **Role**: Single source of truth for domain data structures and route building.
- **Key files**
  - `shared/schema.ts` — exports core domain objects (e.g., `Product`, `Order`, `Account`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, `LifecycleRule`)
  - `shared/routes.ts` — route helpers like `buildUrl` used to keep endpoints consistent

**Architectural rule**: Any domain shape used by both server and client should be defined here (or re-exported from here).

#### 2) Server routes/controllers (`server/routes`, `server/replit_integrations/auth`)
- **Role**: Request handling and routing; delegates to services.
- **Key files**
  - `server/routes/smtp.ts` — `handleConfigureSMTP`, `handleTestSMTP`
  - `server/replit_integrations/auth/routes.ts` — `registerAuthRoutes`

**Architectural rule**: Routes validate input, call services, map errors to HTTP responses, return DTOs; do not embed business logic.

#### 3) Server services (`server/services/`)
- **Role**: Business logic, orchestration, integrations.
- **Key services**
  - `server/services/minio.service.ts` — `MinioService`, config (`MinioConfig`), types (`BucketInfo`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`), and exported `getMinioConfig`
  - `server/services/sftpgo.service.ts` — `SftpGoService`, config/types, secure password generation, availability checks
  - `server/services/notification.service.ts` — `NotificationService`, `NotificationType`, payload type
  - `server/services/billing.service.ts` — `BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`
  - `server/services/audit.service.ts` — `AuditService`, `AuditDetails`, `AuditLogPayload`
  - `server/services/domain-service.ts` — `verifyDomainOwnership`, `generateVerificationToken`, `DomainVerificationResult`

**Architectural rule**: Services are the primary unit of design. New business capabilities should appear as service methods with clear inputs/outputs and consistent error semantics.

#### 4) Client (`client/src`)
- **Role**: UI, client-side orchestration, branding.
- **Key file**
  - `client/src/components/branding-provider.tsx` — `BrandingConfig` and branding integration points

**Architectural rule**: Client consumes server APIs using shared contracts; avoid duplicating domain models.

#### 5) Tests (`testsprite_tests/`)
- **Role**: Black-box / automation checks (API behavior, error handling, domain config flows).
- **Notable tests**
  - `TC017_API_Endpoint_Error_Handling_and_Validation.py`
  - `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
  - `TC004_Custom_Domain_Configuration_with_DNS_Verification.py`

**Architectural rule**: These tests encode externally observable behavior; architectural changes must preserve contract expectations or update tests intentionally.

---

## Focus Areas (where this agent should spend time)

### A) Service boundaries & integration design
Primary: `server/services/*`
- Ensure each integration (MinIO, SftpGo, SMTP, Auth, Domain verification) has:
  - Centralized config retrieval (`getMinioConfig`, `getSftpGoConfig`, etc.)
  - Health/availability checks (`checkSftpGoAvailability`)
  - Consistent error mapping (service errors → route responses)
  - Auditing and notifications where appropriate

### B) Domain model coherence
Primary: `shared/schema.ts`
- Prevent divergence between server-side “truth” and client expectations
- Establish versioning and migration strategies when altering schema exports

### C) Route contract stability and API hygiene
Primary: `shared/routes.ts`, `server/routes/*`
- Keep routes predictable via `buildUrl`
- Standardize validation and error response patterns

### D) Cross-cutting concerns
Primary: `server/services/audit.service.ts`, `server/services/notification.service.ts`
- Ensure major workflows produce audit logs and user/system notifications consistently
- Standardize event names, payload shapes, and severity levels

### E) UI integration boundaries
Primary: `client/src/components/branding-provider.tsx` and API consumption sites (as needed)
- Make sure architecture decisions don’t leak server concerns into UI

---

## Key Files & Their Purposes (quick reference)

| Area | File | Purpose |
|---|---|---|
| Shared models | `shared/schema.ts` | Domain entities/types shared across system |
| Shared routing | `shared/routes.ts` | Central route building (`buildUrl`) |
| SMTP routing | `server/routes/smtp.ts` | Configure & test SMTP endpoints |
| Auth routing | `server/replit_integrations/auth/routes.ts` | Authentication route registration |
| Storage integration | `server/services/minio.service.ts` | MinIO orchestration, quotas, lifecycle, metrics |
| File transfer integration | `server/services/sftpgo.service.ts` | SftpGo users/folders/config, availability checks |
| Notifications | `server/services/notification.service.ts` | Notification dispatch + types |
| Billing | `server/services/billing.service.ts` | Usage aggregation, invoices/pricing |
| Auditing | `server/services/audit.service.ts` | Audit logging payloads and details |
| Domains | `server/services/domain-service.ts` | Token generation + domain ownership verification |
| Branding | `client/src/components/branding-provider.tsx` | Branding configuration for UI |
| API behavior tests | `testsprite_tests/TC014/TC017...py` | Response time + error handling validation |
| Domain flow test | `testsprite_tests/TC004...py` | DNS verification workflow validation |

---

## Canonical Architectural Patterns (as used here)

### 1) “Thin route, fat service”
**Pattern**
- Routes/controllers handle HTTP concerns.
- Services encapsulate business logic and integrate with external systems.

**Expected shape**
- Route: parse/validate input → call service → map service result/error to HTTP.
- Service: orchestrate steps, call dependencies, return typed results.

**Anti-patterns to avoid**
- Embedding MinIO/SftpGo/SMTP logic directly in routes
- Having client replicate business rules that should live in server services

### 2) Centralized configuration and initialization
**Pattern**
- Services expose helpers like `getMinioConfig` and `initializeMinioClient`
- SftpGo uses `getSftpGoConfig` and `checkSftpGoAvailability`

**Architectural requirements**
- Config should be loaded from environment/central config once per request scope or per process (depending on design), with clear failure modes.
- Provide a predictable “misconfiguration” error type and message (safe, non-secret).

### 3) Typed domain objects and exported symbols
**Pattern**
- Strong typing across services and shared schema
- Explicit exported types: `MinioConfig`, `UsageMetrics`, `PricingConfig`, etc.

**Architectural requirement**
- Any public service method should accept/return explicit types (not loose `any`/ad-hoc objects), preferably sourced from `shared/` when shared with client.

### 4) Observability hooks: audit + notifications
**Pattern**
- `AuditService` captures security/critical workflow events
- `NotificationService` communicates to users/system

**Architectural requirement**
- Identify “must-audit” flows (auth, access keys, billing events, domain verification, bucket policy changes, SMTP changes).
- Define a consistent taxonomy of notification/audit event types.

---

## Standard Workflows (step-by-step)

### Workflow 1: Introduce a new major capability (feature) end-to-end
Example: “Add bucket lifecycle policy management”

1. **Define the domain contract**
   - Add/extend types in `shared/schema.ts` (or re-export if already defined)
   - Ensure naming aligns with existing exports (e.g., `LifecycleRule` already exists)

2. **Design the service API**
   - Add methods to the relevant service (`MinioService` in this example)
   - Inputs/outputs must be typed (`LifecycleRule[]`, `BucketInfo`, etc.)
   - Decide on error semantics: what is “not found”, “forbidden”, “bad request”, “dependency unavailable”

3. **Add route/controller endpoints**
   - Use `shared/routes.ts` / `buildUrl` conventions for paths
   - Keep handlers thin; delegate to service
   - Validate input early; map known service errors to proper HTTP status codes

4. **Cross-cutting integration**
   - Add audit logs via `AuditService` for changes to lifecycle rules
   - Add notifications via `NotificationService` if users should be informed

5. **Update/extend tests**
   - Add or extend `testsprite_tests` to cover:
     - validation failures
     - dependency failures (MinIO down)
     - success paths and response time expectations

6. **Document the decision**
   - Create/update an ADR (see “Architecture Governance”) describing why the design fits existing patterns

---

### Workflow 2: Add a new external integration (new service)
Example: “Integrate a new DNS provider”

1. **Create a dedicated service in `server/services/`**
   - Mirror existing style: class-based service (like `MinioService`, `SftpGoService`)
   - Add types for config and DTOs

2. **Configuration strategy**
   - Provide `get<Integration>Config()` helper (pattern: `getMinioConfig`, `getSftpGoConfig`)
   - Ensure secrets never appear in logs or thrown errors

3. **Health and availability**
   - Provide `check<Integration>Availability()` for dependency readiness checks
   - Decide: fail fast vs degrade gracefully (architecture decision)

4. **Error taxonomy**
   - Define consistent error mapping:
     - Misconfiguration → 500 (safe message)
     - Dependency unavailable/timeouts → 503
     - Provider validation issues → 400/422
     - Permission/auth issues → 401/403
   - Keep raw provider error details out of client responses; keep them in server logs/audit (sanitized)

5. **Expose minimal route surface**
   - Add routes under `server/routes/` that call the service
   - Use `shared/routes.ts` for building consistent endpoints when applicable

6. **Audit + notify**
   - Audit creation/update/delete actions and provider failures that affect customer workflows
   - Notify users when an action fails or succeeds if it’s user-visible

---

### Workflow 3: Make a schema/domain change safely
1. **Identify owners and blast radius**
   - Check `shared/schema.ts` exports used by server services and client UI
   - Search usage of affected types across `server/` and `client/`

2. **Plan compatibility**
   - Prefer additive changes (new fields optional)
   - If breaking change is necessary:
     - introduce a new versioned type or field
     - support both shapes temporarily
     - update tests to cover both, then remove old shape intentionally

3. **Update services**
   - Ensure service method signatures and mapping logic align to the updated types

4. **Update client usage**
   - Ensure `client/src` uses updated types/contracts without duplicating models

5. **Update automation tests**
   - Adjust `testsprite_tests` to reflect new contract behavior

6. **Add an ADR**
   - Include migration plan and rollback strategy

---

### Workflow 4: Standardize error handling and validation for routes
This repository has tests focused on API error handling and response time (`TC014`, `TC017`). Architecturally standardize route behavior:

1. **Define an error envelope**
   - Decide on a consistent response shape for errors (e.g., `{ code, message, details? }`)
   - Ensure no sensitive information is returned

2. **Implement mapping rules**
   - Validation errors → 400/422
   - Not found → 404
   - Forbidden → 403
   - Dependency down/timeouts → 503
   - Unexpected → 500

3. **Apply to targeted routes**
   - Start with `server/routes/smtp.ts` and the most-used service endpoints

4. **Codify in tests**
   - Extend tests to verify status code + error envelope consistency

---

### Workflow 5: Performance and reliability review of service calls
1. **Inventory dependency calls**
   - MinIO operations (bucket/object stats, lifecycle, quota)
   - SftpGo API calls
   - SMTP test operations
   - Domain verification DNS lookups

2. **Set SLO-style expectations**
   - Response time budget per endpoint (align with tests like TC014)
   - Timeouts and retry policy per integration

3. **Apply resilience patterns**
   - Timeouts everywhere; retries only for idempotent operations
   - Circuit-breaker-like behavior where repeated failures happen (or at minimum fail fast)
   - Cache safe read-only calls when appropriate (e.g., config, some usage metrics) if consistent with product requirements

4. **Audit and observe**
   - Record dependency failures in audit logs (sanitized) for operational forensics

---

## Best Practices (derived from this codebase)

### Keep domain models centralized
- Prefer `shared/schema.ts` for shared types like `Account`, `Bucket`, `Subscription`, `Notification`.
- Avoid server-only DTO drift; if client needs it, define it in `shared/`.

### Use service classes as the primary design unit
- Follow patterns established by `MinioService`, `SftpGoService`, `BillingService`, `AuditService`, `NotificationService`.
- Keep method signatures typed and intention-revealing.

### Make configuration explicit and testable
- Use helper functions (`getMinioConfig`, `getSftpGoConfig`) and isolate initialization (`initializeMinioClient`).
- Validate config at startup or on first use with clear, non-secret errors.

### Treat audit and notifications as first-class architecture
- Security-sensitive operations should produce audit logs (`AuditService`).
- User-facing changes/failures should produce notifications (`NotificationService`).

### Preserve contract stability and route consistency
- Use `buildUrl` from `shared/routes.ts` where applicable.
- Make error responses predictable to satisfy existing API error-handling tests.

### Make external dependency behavior explicit
- Availability checks (`checkSftpGoAvailability`) are a pattern to reuse across integrations.
- Document timeouts, retry behavior, and fallback behavior for each dependency.

---

## Architecture Governance

### Architectural Decision Records (ADRs)
Create ADRs for:
- New service integrations
- Breaking schema changes
- Cross-cutting changes (error envelope, auth changes, audit policy)
- Multi-step workflows (billing calculation, domain verification lifecycle)

**ADR template**
- Context
- Decision
- Alternatives considered
- Consequences
- Rollout/migration plan
- Testing/validation plan

### Definition of Done (Architecture-level)
A change is architecturally “done” when:
- Service boundary is respected (no business logic in routes/UI)
- Shared types updated (if needed) and used consistently
- Error semantics are consistent and tested
- Audit/notification coverage added where required
- Tests updated/added (especially `testsprite_tests` for API behavior)

---

## Review Checklists

### Service design checklist
- [ ] Clear responsibility and name aligned to existing services
- [ ] Typed inputs/outputs; shared types reused where appropriate
- [ ] Config retrieval isolated and validated
- [ ] Timeouts and failure modes defined
- [ ] Errors are mapped predictably by callers (routes)
- [ ] Audit hooks for sensitive actions
- [ ] Notification hooks for user-visible outcomes

### Route/controller checklist
- [ ] Thin handler: validate → call service → map result
- [ ] Consistent error envelope and HTTP status codes
- [ ] No secrets in logs or responses
- [ ] Uses `buildUrl`/shared route conventions where appropriate
- [ ] Covered by API behavior tests (validation + error handling)

### Schema change checklist
- [ ] Additive when possible; breaking changes versioned/migrated
- [ ] Server and client updated together
- [ ] Tests updated to reflect contract changes
- [ ] ADR created for significant changes

---

## Concrete “Where to Start” Map (for common architecture tasks)

- **Storage lifecycle/usage/quota architecture** → `server/services/minio.service.ts`, `shared/schema.ts` (`Bucket`, `LifecycleRule`)
- **File transfer provisioning/security** → `server/services/sftpgo.service.ts` (password generation, availability checks)
- **System communications** → `server/services/notification.service.ts`, `server/routes/smtp.ts`
- **Billing correctness & extensibility** → `server/services/billing.service.ts`, plus audit/notification for billing events
- **Security and compliance traceability** → `server/services/audit.service.ts`, ensure routes/services call it
- **Domain verification workflow** → `server/services/domain-service.ts`, `testsprite_tests/TC004...py`
- **API error contract hardening** → align routes with expectations in `testsprite_tests/TC014...py` and `TC017...py`

---

## Expected Outputs From This Agent

- Architecture diagrams (C4-style) describing:
  - containers: client/server/external dependencies (MinIO, SftpGo, SMTP, Auth provider/DNS)
  - components: services and routes and their dependencies
- ADRs for major changes
- Refactoring proposals that:
  - reduce coupling between routes and integrations
  - consolidate duplicated types into `shared/`
  - standardize error handling and observability across services
- A migration plan for any breaking schema/API changes (including test updates)

---
