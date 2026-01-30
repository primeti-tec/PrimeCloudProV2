# Code Reviewer Agent Playbook (PrimeCloudProV2)

## 0) Mission & review outcomes

### Mission
Ensure every change is:
- **Correct** (meets requirements, handles edge cases)
- **Safe** (auth, validation, error handling, secrets)
- **Maintainable** (aligned with existing patterns and separation of concerns)
- **Tested** (unit/integration/e2e where applicable)
- **Consistent** (types, schemas, naming, conventions)

### Expected outputs
- A structured review comment with:
  1. **Blocking issues** (must fix before merge)
  2. **Non-blocking improvements** (should fix soon)
  3. **Questions/clarifications**
  4. **Praise only when it points to a reusable pattern** (avoid fluff)

---

## 1) Codebase map: where to focus

### A) Shared contract & routing (high impact)
**Directory**: `shared/`  
**Key files**
- `shared/schema.ts` — shared types/models across server/client. Critical for API contract stability.
- `shared/routes.ts` — route helpers such as `buildUrl` (exported @ ~711). Impacts client/server routing consistency.

**Review focus**
- Backward compatibility when changing exported types (`OrderWithDetails`, `AccountWithDetails`).
- Ensure schema changes are reflected in server handlers and client hooks.
- Avoid type drift between server responses and client expectations.

---

### B) Server entry + routing layer (security & correctness)
**Directories**: `server/`, `server/routes/`, `server/replit_integrations/auth/`  
**Key files**
- `server/index.ts` — server bootstrap and request handling integration points.
- `server/routes/smtp.ts` — SMTP endpoints (`handleConfigureSMTP`, `handleTestSMTP`).
- `server/replit_integrations/auth/routes.ts` — `registerAuthRoutes` (auth entry points).
- `server/replit_integrations/auth/storage.ts` — `IAuthStorage`, `AuthStorage` (auth persistence behavior).

**Review focus**
- Authentication/authorization boundaries and route protection.
- Input validation + error shape consistency.
- Logging without leaking secrets (SMTP credentials, tokens).
- Proper HTTP status codes; no “200 with error payload”.

---

### C) Service layer (business logic & integrations)
**Directory**: `server/services/`  
**Key files**
- `minio.service.ts` — `MinioService` + config/types (`MinioConfig`, `BucketInfo`, `ObjectStats`, etc.).
- `sftpgo.service.ts` — `SftpGoService` + related models (`SftpGoConfig`, `SftpGoUser`, etc.).
- `notification.service.ts` — `NotificationService`, `NotificationType`, payload patterns.
- `billing.service.ts` — `BillingService`, `PricingConfig`, `UsageSummary`, `InvoiceData`.
- `audit.service.ts` — `AuditService`, `AuditDetails`, `AuditLogPayload`.
- `domain-service.ts` — `DomainVerificationResult` and domain-specific workflows.

**Review focus**
- Services should encapsulate external calls; controllers should be thin.
- Proper retry/timeouts for external systems (MinIO/SFTPGo/SMTP).
- Idempotency and safe re-runs for billing/audit actions.
- Audit trails for sensitive operations (billing, auth, resource changes).

---

### D) Client hooks & API usage (contract + UX correctness)
**Directory**: `client/src/hooks/` (and `client/src/lib/`)  
**Key files**
- `client/src/lib/queryClient.ts` — `apiRequest` and query/mutation conventions.
- Hooks: `use-buckets`, `use-billing`, `use-audit-logs`, `use-admin-*`, `use-vps-order`, `use-backup-order`, etc.
- `client/src/lib/document-validation.ts` — formatting helpers (`formatCPF`, `formatCNPJ`, etc.)
- `client/src/lib/utils.ts` — `cn` classnames helper.

**Review focus**
- Hook changes must align with server API and `shared/schema.ts`.
- Error states and loading states are handled (no silent failures).
- Avoid duplicating validation rules already in shared/server libs.

---

### E) Scripts & operational tooling (safety)
**Directory**: `script/`  
**Key files**
- `sync-minio-buckets.ts`, `sync-minio-buckets-full.ts` — operational changes and data reconciliation.

**Review focus**
- Safe defaults, dry-run capabilities if applicable, clear logging.
- Avoid destructive actions without explicit confirmation.
- Credentials handling via env vars (never hardcode).

---

### F) Tests (e2e/automation signals)
**Directory**: `testsprite_tests/`  
**Key files**
- `TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
- `TC017_API_Endpoint_Error_Handling_and_Validation.py`

**Review focus**
- If API behavior changes, ensure these tests are updated (or new tests added).
- Preserve/strengthen error handling and validation guarantees.

---

## 2) Review workflow (step-by-step)

### Step 1 — Triage the change
1. Identify touched areas:
   - `shared/` contract changes?
   - `server/routes/` behavior changes?
   - `server/services/` integration changes?
   - `client/src/hooks/` API usage changes?
   - `script/` operational changes?
2. Classify risk:
   - **High**: auth, billing, audit, storage, SMTP credentials, shared schema.
   - **Medium**: service logic changes, route refactors, new API endpoints.
   - **Low**: UI-only, formatting-only, docs.

### Step 2 — Contract-first check (if server/client touched)
- If server responses changed, verify:
  - `shared/schema.ts` types still match reality.
  - Client hooks using `apiRequest` handle the new shape.
  - Error formats remain consistent.

### Step 3 — Validate boundaries (controller vs service)
- Controllers/routes should:
  - Parse/validate input
  - Enforce auth
  - Call services
  - Return standardized responses
- Services should:
  - Encapsulate external integrations and business rules
  - Be testable without HTTP context
  - Emit auditable events where appropriate (via `AuditService`/`NotificationService`)

### Step 4 — Error handling review (must be consistent)
- Ensure:
  - Correct HTTP status codes (4xx vs 5xx).
  - Errors don’t leak secrets/config.
  - External integration failures are handled (timeouts, retries if appropriate).
  - Validation errors are explicit and actionable.

### Step 5 — Security & privacy review
- Confirm:
  - Authorization checks exist (not just authentication).
  - Sensitive operations produce audit logs (`AuditService`) when relevant.
  - No secrets in logs, client payloads, or thrown errors.
  - Input validation for identifiers/documents (CPF/CNPJ) uses existing helpers.

### Step 6 — Testing expectations
- For high/medium risk changes, request:
  - Unit tests for service logic where feasible.
  - API-level tests (or updates to existing testsprite tests).
  - Regression coverage for known edge cases (timeouts, partial failures).

### Step 7 — Performance & reliability check
- Watch for:
  - N+1 patterns (especially in billing/usage aggregation).
  - Excessive sequential external calls (MinIO/SFTPGo).
  - Missing pagination for “list” endpoints.
  - Inefficient client polling or redundant queries in hooks.

### Step 8 — Provide review feedback in a consistent structure
Use this template:

**Blocking**
- [ ] Issue + file/path + why it’s risky + suggested fix (concrete)

**Non-blocking**
- [ ] Improvement + rationale + optional snippet

**Questions**
- Q: Clarify behavior/decision + suggest acceptance criteria

**Regression checks to run**
- List relevant scripts/tests/endpoints to validate

---

## 3) Best practices aligned to this repository

### A) Keep `shared/schema.ts` as the single source of truth
- Any new API response/request structure should have:
  - A type in `shared/schema.ts` (or relevant shared module)
  - Corresponding server implementation matching that type
  - Client hook usage aligned to that type

**Review smell**
- Client defines its own “response shape” instead of importing shared types.

---

### B) Favor service encapsulation for integrations
Integrations already live in `server/services/*`:
- MinIO: `MinioService`
- SFTPGo: `SftpGoService`
- Notifications: `NotificationService`
- Billing: `BillingService`
- Audit: `AuditService`

**Review rules**
- Don’t place MinIO/SFTPGo/SMTP raw calls directly inside controllers.
- Ensure service methods return typed, domain-level results (not raw SDK responses) when possible.

---

### C) Auditing and observability are first-class concerns
Given an existing `AuditService`, changes that should typically be audited:
- Auth-related actions (sessions, tokens, identity linking)
- Billing events (invoice creation, payment status changes, usage recalculation)
- Storage provisioning (bucket creation/deletion, quota changes, lifecycle policies)
- SMTP configuration changes

**Review checklist**
- Is the audit payload structured (`AuditDetails`/`AuditLogPayload`)?
- Are sensitive fields excluded or redacted?

---

### D) Validation: reuse existing document validation helpers
There are CPF/CNPJ validators on both server and client:
- Server: `server/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, `validateDocument`)
- Client: `client/src/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, formatting helpers)

**Review guidance**
- Don’t reimplement validation logic in random files.
- For server-side enforcement, prefer server lib; client formatting is UX-only.

---

### E) Client API access should go through `apiRequest`
`client/src/lib/queryClient.ts` exports `apiRequest`.

**Review rules**
- New hooks should follow existing query/mutation patterns (centralized error handling).
- Ensure hook invalidation/refetch logic is correct (avoid stale admin panels).
- Ensure proper typing for request/response.

---

## 4) Cross-cutting review checklists (copy/paste)

### 4.1 Server route/controller checklist
- [ ] AuthN/AuthZ present where needed (especially admin routes)
- [ ] Input validation (types, required fields, bounds)
- [ ] Uses service layer, not direct SDK/DB calls (unless established pattern)
- [ ] Correct status codes and consistent error body
- [ ] No secret leakage in responses/logs
- [ ] Handles external failures (timeouts, retries or graceful errors)

### 4.2 Service layer checklist
- [ ] Clear method boundaries (single responsibility)
- [ ] Typed inputs/outputs (prefer shared types when applicable)
- [ ] External calls have timeouts; errors are wrapped with context
- [ ] Idempotent behavior for provisioning/billing operations where feasible
- [ ] Emits audit/notification events for sensitive actions
- [ ] Avoids hidden global state; configuration injected or read centrally

### 4.3 Shared schema checklist
- [ ] Exported types remain compatible or versioned/migrated
- [ ] Naming is consistent (`*WithDetails` patterns already exist)
- [ ] No circular type dependencies introduced
- [ ] Client and server compile-time alignment is preserved

### 4.4 Client hooks checklist
- [ ] Uses `apiRequest` and consistent query keys
- [ ] Loading/error states handled (UI won’t hang silently)
- [ ] Sanitizes/validates user input before sending
- [ ] Avoids duplicating server-only rules in the client
- [ ] Proper cache invalidation on mutations

### 4.5 Scripts checklist (`script/`)
- [ ] Safe defaults; explicit “dangerous” operations
- [ ] Works with env var configuration; no secrets in repo
- [ ] Clear logs; non-zero exit on failure
- [ ] Can be re-run safely (idempotent or guarded)

---

## 5) Known “hot spots” in this repo (treat as higher scrutiny)

1. **SMTP routes**: `server/routes/smtp.ts`
   - Ensure configuration endpoints are protected.
   - Ensure test endpoints don’t allow SSRF-like misuse (e.g., arbitrary host/port).
   - Redact passwords/tokens in any logs/errors.

2. **Auth integration**: `server/replit_integrations/auth/*`
   - Confirm storage semantics (session persistence, token handling).
   - Verify route registration doesn’t expose unintended endpoints.

3. **Storage providers**: `server/services/minio.service.ts`, `server/services/sftpgo.service.ts`
   - Check permissions, bucket/user isolation, quota correctness.
   - Handle partial failures and cleanup (rollback) if provisioning fails mid-way.

4. **Billing & audit**: `server/services/billing.service.ts`, `server/services/audit.service.ts`
   - Confirm calculations are deterministic and based on authoritative data.
   - Ensure audit logs are written for billing-impacting changes.

5. **Shared models used widely**: `shared/schema.ts`
   - Small changes can ripple; request full impact analysis.

---

## 6) Review comment “severity rubric”

- **P0 (Blocker)**: security bug, data loss risk, auth bypass, billing mischarge risk, contract break without migration, secret exposure.
- **P1 (High)**: inconsistent error handling, missing validation, missing tests for critical logic, non-idempotent provisioning.
- **P2 (Medium)**: maintainability issues, unclear naming, missing docs, minor type drift.
- **P3 (Low/Nit)**: formatting, minor refactors, optional improvements.

---

## 7) Verification (V-phase) expectations

When a PR claims fixes are applied:
- Re-check the exact lines changed for:
  - Redaction of sensitive values
  - Correct status codes
  - Updated shared types and client hooks alignment
- Ensure tests were updated or an explanation is provided.
- Request proof of manual verification for integration paths when tests aren’t feasible:
  - SMTP configure/test endpoints
  - MinIO bucket sync scripts
  - Auth flows via `registerAuthRoutes`

---

## 8) Quick reference: key files & their purposes

- `server/index.ts` — server bootstrap; global middleware and routing integration.
- `shared/schema.ts` — cross-layer types and domain models.
- `shared/routes.ts` — URL/route building helpers (`buildUrl`).
- `server/routes/smtp.ts` — SMTP configuration & connectivity testing.
- `server/replit_integrations/auth/routes.ts` — auth route registration (`registerAuthRoutes`).
- `server/replit_integrations/auth/storage.ts` — auth storage contract and implementation.
- `server/services/minio.service.ts` — storage/buckets/metrics/quotas lifecycle operations.
- `server/services/sftpgo.service.ts` — SFTPGo user/filesystem provisioning.
- `server/services/notification.service.ts` — system notifications and types.
- `server/services/billing.service.ts` — pricing, usage summaries, invoice-related operations.
- `server/services/audit.service.ts` — audit logging payloads and persistence.
- `script/sync-minio-buckets*.ts` — operational sync scripts for MinIO.
- `client/src/lib/queryClient.ts` — `apiRequest` and API calling conventions.
- `client/src/hooks/*` — client-side orchestration of API queries/mutations and UI state.
- `testsprite_tests/*.py` — automated endpoint validation/error-handling checks.

---

## 9) Default “merge readiness” gate (what you should require)

A change is merge-ready when:
- Contract changes are reflected in `shared/` and all consumers.
- Security-critical paths include proper auth + redaction.
- Error handling is consistent and doesn’t leak sensitive info.
- Integration changes include reliability considerations (timeouts, retries, idempotency).
- Tests are updated or a credible verification plan is provided.

---
