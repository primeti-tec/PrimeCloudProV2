# Backend Specialist Playbook (PrimeCloudProV2)

## Mission & Success Criteria

### Mission
Own the backend architecture and implementation for PrimeCloudProV2: API routes, service-layer orchestration, integrations (MinIO, SFTPGo, SMTP, auth), and shared contracts used by the client.

### Success criteria (what “done” means)
- New/changed backend behavior is exposed through **server routes** and implemented in **server services**.
- Request/response shapes remain consistent with the **shared schema/types** and **shared routes** utilities.
- Errors are validated and handled consistently (aligned with existing API error-handling tests in `testsprite_tests`).
- Integration code (MinIO/SFTPGo/SMTP/auth) is robust: clear config, timeouts, retries where appropriate, and audit/notification hooks when relevant.
- Changes include adequate tests (or updated test expectations) and do not break existing endpoint response-time / validation checks.

---

## Primary Areas of Ownership (Focus Files & Directories)

### 1) Backend HTTP surface (routes/controllers)
**Where to work**
- `server/routes/*` (e.g., `server/routes/smtp.ts`)
- `server/replit_integrations/auth/routes.ts`
- `shared/routes.ts` (URL building/shared route definitions; `buildUrl` exported)

**Responsibilities**
- Define/extend HTTP endpoints
- Parse/validate inputs
- Call service layer and map results to HTTP responses
- Ensure consistent error handling and status codes

### 2) Service layer (business logic + integrations)
**Where to work**
- `server/services/*`
  - `minio.service.ts` (`MinioService`, config + bucket/object/usage/quota/lifecycle)
  - `sftpgo.service.ts` (`SftpGoService`, password generation, availability checks, user/filesystem/virtual folders)
  - `notification.service.ts` (`NotificationService`, `NotificationType`)
  - `billing.service.ts` (`BillingService`, pricing/usage summary/invoice)
  - `audit.service.ts` (`AuditService`, `AuditDetails`)
  - `domain-service.ts` (domain verification/token generation)

**Responsibilities**
- Integrate with external systems (MinIO/SFTPGo/SMTP provider, auth provider)
- Apply domain rules (quotas, lifecycle rules, access key creation/rotation, billing computations)
- Centralize retry/backoff/timeouts and normalization of third-party errors
- Emit audit logs/notifications where applicable

### 3) Shared contracts (models/types used across server + client)
**Where to work**
- `shared/schema.ts` (exports: `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`)
- `shared/routes.ts` (shared URL builders/route helpers; `buildUrl`)

**Responsibilities**
- Keep server response objects aligned with shared types
- Ensure schema changes are backward-compatible or versioned via careful route evolution

### 4) Test signals & quality gates
**Where to look**
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py`

**Responsibilities**
- Maintain API error/validation behavior
- Keep endpoints performant
- Ensure sensitive data isn’t leaked in logs/responses

---

## Key Files & What They’re For

### Routes / Controllers
- `server/routes/smtp.ts`
  - `handleConfigureSMTP`: configure SMTP settings/transport (server-side)
  - `handleTestSMTP`: send a test email or validate SMTP connectivity
- `server/replit_integrations/auth/routes.ts`
  - `registerAuthRoutes`: registers auth endpoints for Replit integration
- `shared/routes.ts`
  - `buildUrl`: canonical helper to build API URLs; use it for consistency across app layers

### Services
- `server/services/minio.service.ts`
  - `MinioService`: operations for buckets/objects, usage metrics, quotas, lifecycle rules, MinIO client initialization/config
  - exports include: `MinioConfig`, `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`, `getMinioConfig`
- `server/services/sftpgo.service.ts`
  - `SftpGoService`: SFTPGo admin API integration
  - utilities like `generateSecurePassword`, config discovery, availability checks
- `server/services/notification.service.ts`
  - `NotificationService`: create/dispatch notifications
  - `NotificationType` enum
- `server/services/billing.service.ts`
  - `BillingService`: pricing config, usage summaries, invoice payload generation
- `server/services/audit.service.ts`
  - `AuditService`: audit log recording (who did what, when, with what payload)
- `server/services/domain-service.ts`
  - domain ownership verification/token issuance: `generateVerificationToken`, `verifyDomainOwnership`

### Shared Schema
- `shared/schema.ts`
  - canonical types and domain objects used by server/client; treat this as the “contract”.

---

## Architecture & Conventions (Derived from This Codebase)

### Layering expectations
- **Routes** should be thin: validation + mapping + calling a service.
- **Services** should hold:
  - integration-specific logic
  - normalization of external APIs
  - transformation into shared domain objects
- **Shared schema** should define the shapes the server returns and the client expects.

### Naming & organization
- Service classes follow `XService` naming (`MinioService`, `SftpGoService`, etc.).
- Integration config types are exported from the corresponding service file (e.g., `MinioConfig`).
- Shared models/types are centralized in `shared/schema.ts`.

### Error handling (must preserve test expectations)
Given the presence of dedicated tests for API error handling/validation:
- Validate inputs at the route boundary.
- Prefer structured error responses (consistent fields) and correct HTTP status codes.
- Avoid leaking secrets in error messages (see security tests).

### Security and secrets
- Never return credentials, raw access keys, tokens, SMTP passwords, MinIO secrets, or SFTPGo admin secrets in responses.
- Ensure logs redact or omit secrets.
- When adding new endpoints that manage credentials, include an explicit redaction strategy.

---

## Standard Workflows

## 1) Add a New API Endpoint (route → service → shared types)

### Steps
1. **Define the contract**
   - If a new domain object is required, add/extend types in `shared/schema.ts`.
   - If it affects URL building, update `shared/routes.ts` and reuse `buildUrl` patterns.

2. **Implement/extend service logic**
   - Add a method to an existing service (preferred) or create a new service in `server/services/`.
   - Encapsulate external API calls and normalize responses/errors.

3. **Add route handler**
   - Add a new file under `server/routes/` or extend an existing route file.
   - Validate request body/query/path inputs.
   - Call the service method.
   - Return typed, minimal, secure responses.

4. **Hook into audit/notifications if needed**
   - For security-sensitive or account-impacting operations (keys, buckets, billing, auth):
     - record an audit event via `AuditService`
     - notify via `NotificationService` if user-facing

5. **Update/extend tests**
   - Ensure behavior matches existing expectations for:
     - validation failures
     - error handling shape/status
     - response time constraints (TC014)
     - sensitive data handling (TC017 security)

### Checklist
- [ ] Input validation at the route boundary
- [ ] Service method is isolated and testable
- [ ] Uses shared types (`shared/schema.ts`)
- [ ] No secret leakage in response/logs
- [ ] Proper HTTP status codes
- [ ] Audit log added for privileged actions

---

## 2) Implement or Modify MinIO Functionality (Buckets, Quotas, Lifecycle, Usage)

### Where
- `server/services/minio.service.ts`

### Typical tasks
- Create/list/delete buckets
- Manage lifecycle rules (`LifecycleRule`)
- Compute/report usage (`UsageMetrics`, `ObjectStats`)
- Enforce quotas (`StorageQuota`)
- Configure MinIO client via `initializeMinioClient` / `getMinioConfig`

### Steps
1. Identify the existing public method closest to your need in `MinioService`.
2. Use or extend the exported config types (`MinioConfig`) rather than introducing ad-hoc env reads in route files.
3. Normalize MinIO errors:
   - Map “not found”, “already exists”, auth failures, and connectivity issues to consistent backend error types.
4. When returning usage/metrics:
   - Prefer strongly typed outputs (`UsageMetrics`, `BucketInfo`, etc.).
5. If lifecycle rules are involved:
   - Keep shapes aligned with `shared/schema.ts`’s `LifecycleRule` export where applicable.

### Best practices
- Ensure all bucket/object identifiers are validated (length/charset) before calling MinIO.
- Avoid returning internal MinIO error dumps to clients; translate to safe messages.

---

## 3) Implement or Modify SFTPGo Functionality (Users, Folders, Credentials)

### Where
- `server/services/sftpgo.service.ts`

### Typical tasks
- Validate SFTPGo availability (`checkSftpGoAvailability`)
- Configure SFTPGo API client (`getSftpGoConfig`)
- Create/update SFTP users, filesystem, virtual folders (`SftpGoUser`, `SftpGoFilesystem`, `SftpGoVirtualFolder`)
- Generate credentials (`generateSecurePassword`)

### Steps
1. Ensure SFTPGo availability is checked for operations that rely on it (especially in provisioning flows).
2. Use `generateSecurePassword` for user credentials and ensure:
   - password never returned in plaintext unless explicitly required and justified
   - storage/transmission follows security guidelines (TC017 security)
3. Normalize SFTPGo API errors (auth/validation/conflict) into stable API errors.
4. Add audit events for user provisioning/rotation actions.

### Best practices
- Avoid logging the full SFTPGo payloads if they may include secrets or user credentials.
- Prefer idempotent operations where possible (create-or-update patterns) to reduce provisioning flakiness.

---

## 4) SMTP Configuration & Testing

### Where
- `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)

### Steps
1. For config endpoints:
   - validate host/port/secure/from fields
   - do not echo back passwords/secrets
2. For test endpoints:
   - enforce rate limits if available (or add simple throttling) to prevent abuse
   - return success/failure with safe error messages (no credential exposure)
3. On changes:
   - ensure error responses remain stable for API validation tests

### Best practices
- If SMTP settings are stored, ensure encryption-at-rest (or at minimum redaction) and never expose full config back to clients.

---

## 5) Billing/Usage/Invoices Changes

### Where
- `server/services/billing.service.ts`

### Steps
1. Update pricing configuration types (`PricingConfig`) and derived outputs (`UsageSummary`, `InvoiceData`) consistently.
2. Ensure usage inputs come from a stable source (often MinIO usage metrics).
3. Make computations deterministic and well-bounded (avoid unbounded loops over objects).
4. Add audit logs for invoice generation or billing-impacting changes.

### Best practices
- Be explicit about units (bytes vs GiB, hours vs seconds) and rounding rules.
- Avoid client-driven pricing parameters without server-side validation.

---

## 6) Audit & Notifications (Cross-cutting)

### Where
- `server/services/audit.service.ts`
- `server/services/notification.service.ts`

### When to use
- Any privileged action:
  - account changes, member invites/role changes
  - access key creation/rotation
  - bucket lifecycle/retention/quota changes
  - auth/security settings changes
  - billing/invoice events

### Steps
1. Add an audit log payload that includes:
   - actor identity (user/account)
   - action name
   - target resource identifiers
   - safe metadata (no secrets)
2. Add a notification for user-visible changes:
   - prefer `NotificationType` categories
   - include minimal useful context

---

## Error Handling & Validation Standards (Match Existing Test Emphasis)

### Input validation
- Validate early in route handlers:
  - required fields present
  - types correct
  - safe bounds (lengths, ranges, allowed enums)
- Return consistent error shapes and appropriate HTTP codes:
  - `400` for validation issues
  - `401/403` for auth/permission
  - `404` for missing resources
  - `409` for conflicts (already exists)
  - `500/502/503` for integration/service failures (depending on nature)

### Response-time considerations
Because response-time/error-handling tests exist:
- Avoid making multiple sequential external calls when one can be batched.
- Add timeouts for external integrations (MinIO/SFTPGo/SMTP) and fail fast with actionable errors.
- If an operation is inherently long-running (e.g., usage scans), consider:
  - caching
  - asynchronous jobs (if available in this codebase) or incremental computation

### Sensitive data handling
- Never include secrets in:
  - error messages
  - stack traces returned to clients
  - logs (unless redacted)
- For debugging, log correlation IDs and sanitized context, not raw payloads.

---

## Common Tasks: “Recipes”

## Recipe A: Add “List Buckets” Endpoint
1. Add service method in `MinioService` returning `BucketInfo[]`.
2. Add route in `server/routes/…`:
   - validate account/context
   - call `MinioService`
   - return list
3. Ensure output matches shared schema expectations (if `Bucket` type exists in `shared/schema.ts`, map to it).
4. Add audit event if listing is considered sensitive (optional; usually for create/delete).

## Recipe B: Add “Rotate Access Key” Endpoint
1. Define/confirm `AccessKey` type usage in `shared/schema.ts`.
2. Implement rotate logic in appropriate service:
   - generate new key
   - revoke old key (if supported)
3. Ensure response returns only what is safe (often only last 4 chars, createdAt, id).
4. Add `AuditService` record + `NotificationService` event.

## Recipe C: Improve Error Mapping for Integration Failures
1. Identify external errors thrown in `minio.service.ts` or `sftpgo.service.ts`.
2. Add a normalization layer:
   - map to internal error types/codes
   - ensure route returns stable status codes and messages
3. Verify against API error-handling tests (TC017).

---

## Code Review Guidelines (Backend Specialist)

### Must-check items
- Contract alignment: any response shape changes reflected in `shared/schema.ts` and/or consumers.
- No secret leakage: SMTP/S3/SFTP credentials never returned or logged.
- Error handling stability: consistent status codes and message shapes.
- Integration robustness: timeouts, retries where appropriate, good failure modes.
- Auditability: privileged actions produce audit logs.

### Nice-to-have
- Idempotency for provisioning endpoints
- Correlation IDs in logs
- Metrics around external dependencies (latency/error rates) if existing instrumentation exists

---

## Handoff Notes for Other Agents

### For frontend-specialist
- Prefer using `shared/routes.ts` `buildUrl` and shared types from `shared/schema.ts` to keep client/server aligned.
- Any endpoint contract changes should be communicated via shared schema updates.

### For QA/test agent
- Point them to `testsprite_tests` cases for API error/validation, response-time, and security checks.
- Provide sample requests/responses (sanitized) for new endpoints.

---

## “Do Not” List (Project-Specific)
- Do not implement business logic in `server/routes/*` beyond validation and orchestration.
- Do not introduce new ad-hoc request/response shapes without updating `shared/schema.ts` (or clearly isolating internal-only endpoints).
- Do not return raw third-party error objects to clients (MinIO/SFTPGo/SMTP/auth).
- Do not log secrets or store them unencrypted/plaintext (especially SMTP passwords and access keys).

---

## Quick Index (Jump Points)
- Services: `server/services/minio.service.ts`, `server/services/sftpgo.service.ts`, `server/services/billing.service.ts`, `server/services/audit.service.ts`, `server/services/notification.service.ts`, `server/services/domain-service.ts`
- Routes: `server/routes/smtp.ts`, `server/replit_integrations/auth/routes.ts`
- Shared contracts/utilities: `shared/schema.ts`, `shared/routes.ts`
- Test expectations: `testsprite_tests/TC014_*`, `testsprite_tests/TC017_*`
