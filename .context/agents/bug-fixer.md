# Bug-Fixer Agent Playbook (PrimeCloudProV2)

## Mission & Success Criteria

**Mission:** Take a bug report (error message, failing test, user symptom, production log) and deliver a fix that:
1. **Reproduces** the issue locally (or explains why reproduction is not possible and uses logs/telemetry + targeted tests instead).
2. **Identifies root cause** at the correct layer (client vs server vs shared schema).
3. **Implements minimal-risk code change** consistent with repository conventions.
4. **Adds/updates regression coverage** (automated tests where possible; otherwise deterministic reproduction steps).
5. **Verifies end-to-end** via relevant test suites and/or API/UI flows.

**Definition of done:**
- Bug no longer reproduces.
- No new lint/type errors.
- Relevant tests pass (and new regression test exists when feasible).
- Error handling aligns with existing patterns (auth, validation, and service-layer exceptions).

---

## Where to Look First (by Symptom)

### 1) API errors / request validation / routing issues
**Primary areas:**
- `server/routes/**` (example: `server/routes/smtp.ts`)
- `shared/routes.ts` (`buildUrl` and route building)
- `server/replit_integrations/auth/routes.ts` (auth routing integration)
- `shared/schema.ts` (shared models and likely validation/typing source)

**Common signals:**
- 4xx/5xx responses, missing fields, inconsistent request/response shapes, wrong URL/path construction.

### 2) Business logic bugs (storage, billing, notifications, SFTP)
**Primary areas (service layer):**
- `server/services/minio.service.ts` (`MinioService`, config types, lifecycle rules, quotas)
- `server/services/sftpgo.service.ts` (`SftpGoService`)
- `server/services/notification.service.ts` (`NotificationService`, `NotificationType`)
- `server/services/billing.service.ts` (Billing workflows)
- `server/services/audit.service.ts` (Audit trails)

**Common signals:**
- Incorrect computed values, unexpected side effects, idempotency issues, external API failures, timeouts.

### 3) Authentication/authorization problems (client-side)
**Primary areas:**
- `client/src/lib/auth-utils.ts` (`isUnauthorizedError`)
- `client/src/lib/queryClient.ts` (`apiRequest`)
- `client/src/pages/**` (screens that trigger calls and handle errors)

**Common signals:**
- Login loops, silent failures, stale token/session handling, incorrect unauthorized detection.

### 4) Document validation/formatting (CPF/CNPJ)
**Primary areas:**
- `server/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, `validateDocument`)
- `client/src/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, formatting helpers)

**Common signals:**
- Client and server disagree on validity; formatting inconsistencies; edge-case inputs.

### 5) Test harness failures / API validation & response-time checks
**Primary areas:**
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**Common signals:**
- Failing contract expectations, slow endpoints, error payload mismatches, missing validations.

---

## Key Files & Their Purposes (High-Leverage Index)

### Shared (types, schema, routes)
- `shared/schema.ts`
  - Exports core domain models: `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`.
  - **Bug-fix relevance:** type mismatches between client/server, validation expectations, serialization differences.
- `shared/routes.ts`
  - Contains `buildUrl` and route construction logic.
  - **Bug-fix relevance:** broken endpoints due to incorrect URL building; environment base URL issues.

### Server (routes, services, utilities)
- `server/routes/smtp.ts`
  - SMTP configuration and testing handlers: `handleConfigureSMTP`, `handleTestSMTP`.
  - **Bug-fix relevance:** email sending failures, validation, config storage, sensitive data handling.
- `server/replit_integrations/auth/routes.ts`
  - Auth route registration via `registerAuthRoutes`.
  - **Bug-fix relevance:** auth flow, callback routing, middleware ordering issues.
- `server/services/*.ts`
  - Encapsulated business logic:
    - `minio.service.ts` (storage/buckets/lifecycle/usage/quotas)
    - `sftpgo.service.ts` (SFTP provisioning/management)
    - `notification.service.ts` (notification creation/dispatch)
    - `billing.service.ts` (billing operations)
    - `audit.service.ts` (audit logs)
  - **Bug-fix relevance:** most “logic bugs” live here; add unit/integration tests around service boundaries.
- `server/lib/document-validation.ts`
  - Canonical server-side CPF/CNPJ validation.
  - **Bug-fix relevance:** authoritative validation; keep in sync with client expectations.

### Client (API access, auth handling, UI)
- `client/src/lib/queryClient.ts`
  - `apiRequest` wrapper for network calls.
  - **Bug-fix relevance:** headers, error normalization, base URL, JSON parsing.
- `client/src/lib/auth-utils.ts`
  - `isUnauthorizedError` for detecting auth failures.
  - **Bug-fix relevance:** correct classification of 401/403 and “session expired” states.
- `client/src/lib/utils.ts`
  - `cn` helper (className composition).
  - **Bug-fix relevance:** rare; mostly UI regressions.
- `client/src/pages/**`
  - Screens and user flows.
  - **Bug-fix relevance:** broken UX paths, incorrect state handling, missing loading/error states.

### Test harness
- `testsprite_tests/*.py`
  - Automated checks for API endpoint validation/error handling and response-time expectations.
  - **Bug-fix relevance:** contract enforcement; use these failures to drive backend fixes and error-shape consistency.

---

## Standard Workflow (End-to-End)

### Step 0 — Intake & Triage
Collect:
- Exact error text / stack trace / failing test output
- Endpoint + request payload (for API issues)
- Expected vs actual behavior
- Environment details (dev/prod, browser, node version if known)

Classify bug type:
- **Contract/validation**, **auth**, **service logic**, **external dependency**, **performance**, **UI state**, or **schema mismatch**.

### Step 1 — Reproduce
Pick the tightest reproduction loop:
- **Automated:** run the failing `testsprite_tests` case if applicable.
- **API:** reproduce via the same request made by `client/src/lib/queryClient.ts` (or curl/Postman equivalent).
- **UI:** reproduce in the specific `client/src/pages/**` route.

Capture:
- Actual HTTP status and body
- Server logs or thrown errors
- Timing (for response-time failures)

### Step 2 — Locate the Failing Layer
Use symptom mapping:
- URL/path mismatch → `shared/routes.ts` / server route registration
- Validation mismatch → `shared/schema.ts` and server route validation logic
- Business logic exception → `server/services/*.ts`
- Unauthorized handling loop → `client/src/lib/auth-utils.ts` and `apiRequest`

### Step 3 — Identify Root Cause
Common root-cause patterns in this codebase:
- **Client/server divergence** between `client/src/lib/document-validation.ts` and `server/lib/document-validation.ts`.
- **Route building drift** (incorrect base path/params) from `shared/routes.ts`.
- **Service edge cases** (null/undefined configs, missing bucket/account, external API returning unexpected shape).
- **Inconsistent error mapping** causing tests to fail (status code, error payload).
- **Timeout/slow path** in storage or upstream calls affecting testsprite response-time checks.

### Step 4 — Implement Minimal-Risk Fix
Principles:
- Prefer fixing **at the correct layer** (don’t “patch” UI to ignore a server contract bug unless that’s intended).
- Keep changes narrow; avoid refactors during bug fixes unless required for correctness.
- Add guardrails:
  - Validate inputs at route boundaries.
  - Normalize external responses at service boundary.
  - Standardize error responses for API consumers/tests.

### Step 5 — Add Regression Coverage
Pick the closest fit:
- If the issue is API contract/validation/error handling, extend the relevant `testsprite_tests` case or add a new one in the same style.
- If the issue is in a service, prefer a focused unit/integration test (if a JS/TS test setup exists). If not available, add deterministic API-level coverage.
- If UI-only regression, add a minimal test (if a UI test framework exists) or provide deterministic manual steps plus a small unit test around the broken logic.

### Step 6 — Verify & Prevent Recurrence
- Run the failing test(s) again.
- Exercise the impacted endpoint(s) through `apiRequest`.
- Sanity-check surrounding flows (auth, permissions, and dependent services).
- Confirm no schema/type regressions (especially around `shared/schema.ts`).

---

## Task-Specific Runbooks

### A) Fixing API endpoint error-handling and validation failures (Testsprite-driven)
**Relevant tests:**
- `testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`
- `testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`

**Workflow:**
1. Run/inspect failing testsprite case and identify:
   - Endpoint URL, method, payload
   - Expected status codes and error body shape
2. Locate server handler in `server/routes/**`.
3. Ensure:
   - Required fields are validated early (return 400 with consistent error message/body).
   - Unauthorized returns 401/403 in a way the client and tests expect.
   - Exceptions are caught and mapped to stable error responses (avoid leaking stack traces).
4. Align URL construction if needed (`shared/routes.ts`).
5. Re-run the testsprite case; ensure response time is within expected limits for TC014.

**Best practices for this repo:**
- Keep error semantics consistent across endpoints (same shape and predictable status codes).
- If response-time is the issue: avoid extra upstream calls in request path, and consider caching/reusing clients (especially for storage services).

### B) Fixing SMTP configuration/testing issues
**Key file:** `server/routes/smtp.ts`

**Workflow:**
1. Reproduce with the same payload used by UI/config page (check `client/src/pages/**` if relevant).
2. Validate input: host, port, credentials, TLS flags, sender.
3. In `handleTestSMTP`:
   - Ensure timeouts are set so tests don’t hang.
   - Normalize failures into a readable error response.
4. In `handleConfigureSMTP`:
   - Ensure secrets aren’t returned in responses/logs.
   - Confirm persistence/storage path is correct.
5. Add regression:
   - API-level test to assert invalid configuration yields 400 and valid yields 200/201.

### C) Fixing auth/unauthorized loops or incorrect error classification
**Key files:**
- `client/src/lib/auth-utils.ts` (`isUnauthorizedError`)
- `client/src/lib/queryClient.ts` (`apiRequest`)
- `server/replit_integrations/auth/routes.ts`

**Workflow:**
1. Identify whether the server is returning 401 vs 403 vs 302 and what the client expects.
2. Check if `apiRequest` normalizes errors (e.g., fetch errors vs HTTP errors).
3. Adjust `isUnauthorizedError` to correctly detect:
   - Raw HTTP 401/403
   - Structured error payloads (if used)
4. Verify auth routes are registered and reachable (route prefixes and middleware ordering).
5. Add regression:
   - A minimal client-side test around `isUnauthorizedError` inputs (if test harness exists), or a testsprite API check ensuring 401 on protected endpoints.

### D) Fixing CPF/CNPJ validation inconsistencies
**Key files:**
- `server/lib/document-validation.ts`
- `client/src/lib/document-validation.ts`

**Workflow:**
1. Capture the failing input(s) and expected behavior.
2. Ensure both client and server:
   - Treat formatting characters consistently (strip punctuation before validation).
   - Share the same edge-case rules (leading zeros, repeated digits, length checks).
3. Prefer server as source of truth; update client to match server logic and formatting helpers.
4. Add regression:
   - Table-driven tests for representative CPF/CNPJ inputs (valid/invalid), ideally both client and server.

### E) Fixing storage/minio lifecycle/quota issues
**Key file:** `server/services/minio.service.ts`

**Workflow:**
1. Identify affected operation: bucket creation, lifecycle rule parsing, usage metrics, quota enforcement.
2. Reproduce with a minimal request path from server route into `MinioService`.
3. Add guards for:
   - Missing/invalid config (`MinioConfig`)
   - Null/empty bucket identifiers
   - Unexpected upstream response shape
4. Ensure changes preserve exported types (e.g., `LifecycleRule` also exists in `shared/schema.ts`; avoid drift).
5. Add regression:
   - API test validating correct error on invalid input and correct output shape on success.

---

## Codebase Conventions & Best Practices (Derived from Structure)

### Prefer service-layer fixes for business rules
Most domain logic is encapsulated in `server/services/*.ts`. Bug fixes involving behavior should generally land in the service, with routes focused on:
- Input validation
- Auth checks
- Calling service methods
- Mapping results/errors to HTTP responses

### Keep shared types aligned
The repository exports core models from `shared/schema.ts`. When fixing a bug caused by type/shape mismatch:
- Update shared type definitions first.
- Update both server and client usage to match.
- Avoid “temporary” divergence (it creates repeated bugs).

### Normalize error handling
Given tests focused on “Error Handling and Validation,” stability matters:
- Consistent status codes (400 validation, 401/403 auth, 404 missing resource, 500 unexpected)
- Consistent error payload shape (avoid endpoint-by-endpoint novelty)
- Avoid leaking secrets and internal stack traces in response bodies

### Be careful with sensitive data
Routes like SMTP configuration can involve credentials. Ensure:
- No credential echo in JSON responses
- No logging of secrets in server logs

### Performance-sensitive endpoints
Testsprite includes response-time checks. When addressing perf regressions:
- Avoid repeated client initialization inside handlers
- Ensure timeouts for upstream calls
- Consider memoizing expensive lookups within request scope

---

## Bug Fix PR Checklist (Use for Every Change)

- [ ] Repro steps documented (test, curl, or UI steps)
- [ ] Root cause explained in 1–3 sentences
- [ ] Fix is minimal and localized to the correct layer
- [ ] Input validation added/adjusted where appropriate
- [ ] Error response is consistent with existing API expectations
- [ ] Regression coverage added (testsprite and/or unit test)
- [ ] No secrets logged or returned (SMTP/auth)
- [ ] Verified impacted flows (auth, storage, notifications) still work

---

## Quick “File Targeting” Cheatsheet

| Bug Symptom | Likely Files |
|---|---|
| Endpoint 404 / wrong URL | `shared/routes.ts`, `server/routes/**` |
| Validation mismatch / schema confusion | `shared/schema.ts`, `server/routes/**`, `testsprite_tests/*` |
| SMTP failures | `server/routes/smtp.ts` |
| Unauthorized loop / auth not detected | `client/src/lib/auth-utils.ts`, `client/src/lib/queryClient.ts`, `server/replit_integrations/auth/routes.ts` |
| CPF/CNPJ invalid when it shouldn’t be | `server/lib/document-validation.ts`, `client/src/lib/document-validation.ts` |
| Bucket/quota/lifecycle bugs | `server/services/minio.service.ts`, `shared/schema.ts` |
| Notification logic errors | `server/services/notification.service.ts` |
| SFTP provisioning issues | `server/services/sftpgo.service.ts` |
| Billing inconsistencies | `server/services/billing.service.ts` |
| Missing audit entries | `server/services/audit.service.ts` |

---

## Output Expectations for This Agent

When delivering a bug fix, include in the final response (or PR description):
1. **Reproduction:** how to trigger the bug (including endpoint/payload if applicable)
2. **Root cause:** file(s) and logic summary
3. **Fix summary:** what changed and why
4. **Tests:** what was run and what new regression coverage was added
5. **Risk notes:** anything that might impact other flows (auth, schema, services)
