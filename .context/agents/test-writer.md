# Test Writer Agent Playbook (PrimeCloudProV2)

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Writes comprehensive tests and maintains test coverage  
**Additional Context:** Focus on unit tests, integration tests, edge cases, and test maintainability.

---

## 1. Mission (REQUIRED)

The Test Writer Agent increases confidence in PrimeCloudProV2 by creating and maintaining automated tests that verify business logic, API behavior, and critical utilities. Engage this agent when:

- A new feature is added (especially in `server/services` or `server/routes`).
- Bugs are fixed and regression coverage is needed.
- Refactors risk breaking behavior (service orchestration, route validation, auth).
- External integrations change (MinIO/S3, SftpGo, SMTP, auth providers).
- Coverage gaps are identified, or flaky tests appear.

This agent’s output should be maintainable test suites that clearly encode expected behavior, including edge cases and failure modes, while avoiding brittle implementation-coupled assertions.

---

## 2. Responsibilities (REQUIRED)

- Write **unit tests** for service-layer business logic (mocking external clients and IO).
- Write **integration tests** for API routes/handlers (request validation, auth, response shape, error codes).
- Add **regression tests** for reported bugs (minimal reproduction + assertion of expected fix).
- Create **edge-case matrices** (invalid input, empty states, boundary values, timeouts, transient failures).
- Ensure tests are **deterministic** (no real network, stable time, controlled randomness).
- Maintain and improve **test readability** (naming, structure, helper factories, fixtures).
- Identify and reduce **test flakiness** (isolate shared state, remove ordering dependencies).
- Keep tests aligned with existing patterns (TypeScript tests + existing Python `testsprite_tests` patterns).
- Document testing assumptions and reusable helpers where appropriate.

---

## 3. Best Practices (REQUIRED)

- Prefer **behavioral assertions** over implementation details:
  - Assert returned values, thrown errors, HTTP statuses, and side effects (e.g., “sendMail called with…”), not internal private calls.
- Use **table-driven tests** for validators and formatters (CPF/CNPJ/document formatting).
- Isolate external dependencies:
  - Mock MinIO/S3, SMTP, SftpGo, and any HTTP clients.
  - Avoid real filesystem, real env secrets, and real network.
- Cover both **happy path** and **failure modes**:
  - Invalid params → `400`
  - Unauthorized/forbidden → `401/403`
  - Downstream dependency failure → expected error mapping (`5xx` or domain errors)
- Keep tests **fast**:
  - Unit tests should run in milliseconds; integration tests should avoid spinning up full stacks unless required.
- Make fixtures explicit:
  - Use helper builders for configs, request payloads, and service dependencies.
- Use stable time:
  - If logic depends on time, mock time (`Date.now()`/timers) and assert with fixed timestamps.
- Prefer **minimal test data**:
  - Only include the fields required for the behavior under test.
- Maintain clear naming:
  - `should <result> when <condition>` or `returns <x> for <y>`.
- Add tests near the impacted module when possible (co-locate) unless repo conventions require centralization.

---

## 4. Key Project Resources (REQUIRED)

- Repository README: [`README.md`](README.md)
- Docs index: [`../docs/README.md`](../docs/README.md)
- Agents handbook: [`../../AGENTS.md`](../../AGENTS.md)
- Contributor guidance (if present in repo): search for `CONTRIBUTING.md`, `docs/contributing*`, or “Contributing” section in `README.md`

---

## 5. Repository Starting Points (REQUIRED)

- `server/` — Backend application code (routes/controllers, services, libs).
- `server/routes/` — API handlers (e.g., SMTP handlers). Primary target for integration tests.
- `server/services/` — Business logic and external integrations. Primary target for unit tests.
- `server/lib/` — Shared backend utilities (e.g., document validation). Ideal for fast unit tests.
- `shared/` — Shared types/routes/utilities (e.g., centralized route builder). Useful for API contract tests.
- `client/src/lib/` — Frontend utilities (query client, formatting/validation). Target with unit tests where applicable.
- `client/src/pages/` — UI pages; only test critical logic components where stable selectors exist.
- `testsprite_tests/` — Existing Python tests (API validation/error handling). Extend using existing patterns when needed.

---

## 6. Key Files (REQUIRED)

- Central route definitions:
  - [`shared/routes.ts`](shared/routes.ts) — includes `buildUrl` and route construction patterns (important for API contract consistency).
- SMTP route handlers:
  - [`server/routes/smtp.ts`](server/routes/smtp.ts) — `handleConfigureSMTP`, `handleTestSMTP` (integration tests should validate status codes + validation).
- Auth integration routes:
  - [`server/replit_integrations/auth/routes.ts`](server/replit_integrations/auth/routes.ts) — `registerAuthRoutes` (auth behavior tests: unauthorized/authorized).
- Service layer:
  - [`server/services/minio.service.ts`](server/services/minio.service.ts) — `MinioService` + related types (mock object storage client).
  - [`server/services/sftpgo.service.ts`](server/services/sftpgo.service.ts) — `SftpGoService` (mock remote service API).
  - [`server/services/notification.service.ts`](server/services/notification.service.ts) — `NotificationService`, `NotificationType` (mock transport).
  - (Also referenced by detected pattern) `server/services/billing.service.ts`, `server/services/audit.service.ts` (add tests for orchestration + side effects).
- Document validation utilities:
  - [`server/lib/document-validation.ts`](server/lib/document-validation.ts) — `isValidCPF`, `isValidCNPJ`, `validateDocument`.
  - [`client/src/lib/document-validation.ts`](client/src/lib/document-validation.ts) — `isValidCPF`, `isValidCNPJ`, `formatCPF`, `formatCNPJ`, `formatDocument`.
- Client API helper:
  - [`client/src/lib/queryClient.ts`](client/src/lib/queryClient.ts) — `apiRequest` (test request formation/error mapping if feasible without brittle network stubs).
- Existing Python tests (patterns to follow):
  - [`testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`](testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py)
  - [`testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`](testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py)

---

## 7. Architecture Context (optional)

- **Controllers / Routing**
  - Directories: `server/routes`, `server/replit_integrations/auth`, `client/src/pages`, `testsprite_tests`
  - Key exports:
    - `buildUrl` — [`shared/routes.ts`](shared/routes.ts)
    - `handleConfigureSMTP`, `handleTestSMTP` — [`server/routes/smtp.ts`](server/routes/smtp.ts)
    - `registerAuthRoutes` — [`server/replit_integrations/auth/routes.ts`](server/replit_integrations/auth/routes.ts)
  - Testing focus:
    - Integration tests for request validation, auth gates, status codes, and response schemas.

- **Services (Business Logic)**
  - Directory: `server/services`
  - Key exports:
    - `MinioService` and types — [`server/services/minio.service.ts`](server/services/minio.service.ts)
    - `SftpGoService` — [`server/services/sftpgo.service.ts`](server/services/sftpgo.service.ts)
    - `NotificationService`, `NotificationType` — [`server/services/notification.service.ts`](server/services/notification.service.ts)
  - Testing focus:
    - Unit tests with mocks verifying orchestration, retries/errors, mapping to domain outputs.

- **Utilities**
  - Directories: `server/lib`, `client/src/lib`
  - Key exports:
    - Backend: `isValidCPF`, `isValidCNPJ`, `validateDocument` — [`server/lib/document-validation.ts`](server/lib/document-validation.ts)
    - Frontend: `formatCPF`, `formatCNPJ`, `formatDocument` — [`client/src/lib/document-validation.ts`](client/src/lib/document-validation.ts)
  - Testing focus:
    - Table-driven input validation and formatting idempotence.

---

## 8. Key Symbols for This Agent (REQUIRED)

### Controllers / Routes
- `buildUrl` — [`shared/routes.ts`](shared/routes.ts)
- `handleConfigureSMTP` — [`server/routes/smtp.ts`](server/routes/smtp.ts)
- `handleTestSMTP` — [`server/routes/smtp.ts`](server/routes/smtp.ts)
- `registerAuthRoutes` — [`server/replit_integrations/auth/routes.ts`](server/replit_integrations/auth/routes.ts)

### Services
- `MinioService` — [`server/services/minio.service.ts`](server/services/minio.service.ts)
- `MinioConfig` — [`server/services/minio.service.ts`](server/services/minio.service.ts)
- `BucketInfo` / `ObjectStats` / `UsageMetrics` / `StorageQuota` / `LifecycleRule` — [`server/services/minio.service.ts`](server/services/minio.service.ts)
- `SftpGoService` — [`server/services/sftpgo.service.ts`](server/services/sftpgo.service.ts)
- `NotificationService` — [`server/services/notification.service.ts`](server/services/notification.service.ts)
- `NotificationType` — [`server/services/notification.service.ts`](server/services/notification.service.ts)

### Utilities
- `isValidCPF` / `isValidCNPJ` / `validateDocument` — [`server/lib/document-validation.ts`](server/lib/document-validation.ts)
- `isValidCPF` / `isValidCNPJ` / `formatCPF` / `formatCNPJ` / `formatDocument` — [`client/src/lib/document-validation.ts`](client/src/lib/document-validation.ts)
- `apiRequest` — [`client/src/lib/queryClient.ts`](client/src/lib/queryClient.ts)
- `cn` — [`client/src/lib/utils.ts`](client/src/lib/utils.ts)

### Existing Python test entry points (for extending the same harness)
- `find_locator` / `run_test` — [`testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py`](testsprite_tests/TC014_API_Endpoint_Response_Time_and_Error_Handling.py)
- `find_locator` / `run_test` — [`testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py`](testsprite_tests/TC017_API_Endpoint_Error_Handling_and_Validation.py)

---

## 9. Documentation Touchpoints (REQUIRED)

- Project overview and setup: [`README.md`](README.md)
- Documentation index: [`../docs/README.md`](../docs/README.md)
- Agent coordination and standards: [`../../AGENTS.md`](../../AGENTS.md)
- Testing-related docs (if present): look for and reference in PRs
  - `docs/testing.md`, `docs/quality.md`, `docs/architecture.md`, `CONTRIBUTING.md`
- API/route conventions (implicit source-of-truth):
  - [`shared/routes.ts`](shared/routes.ts)

---

## 10. Collaboration Checklist (REQUIRED)

1. **Confirm assumptions**
   - [ ] Identify the change scope (service, route, util, client helper).
   - [ ] Determine test level needed (unit vs integration vs Python tests).
   - [ ] Confirm expected behavior with existing code paths and route definitions in [`shared/routes.ts`](shared/routes.ts).

2. **Locate targets and dependencies**
   - [ ] Read the implementation file(s) and list dependencies (clients, transport, config, env vars).
   - [ ] Identify which dependencies must be mocked and which can be real (pure functions only).

3. **Select or create test placement**
   - [ ] Co-locate tests near source when consistent with repo conventions (e.g., `*.test.ts`).
   - [ ] For API routes, prefer integration tests that exercise handlers end-to-end (within process).
   - [ ] For `testsprite_tests`, follow the existing `run_test` / `find_locator` structure.

4. **Design test cases**
   - [ ] Add **happy path** coverage.
   - [ ] Add **validation failures** (missing fields, wrong types, boundary values).
   - [ ] Add **auth failures** where applicable (`401/403`).
   - [ ] Add **dependency failures** (timeouts, network error, downstream 5xx) and assert error mapping.
   - [ ] Add **edge cases** (empty results, duplicates, quota limits, unexpected nulls).

5. **Implement tests with maintainability**
   - [ ] Use builders/factories for payloads/configs.
   - [ ] Use table-driven tests for repetitive validation scenarios.
   - [ ] Avoid brittle snapshotting unless the output is stable and intentional.

6. **Run and verify**
   - [ ] Run the relevant test suite(s) locally.
   - [ ] Ensure tests are deterministic (no order dependence, no real network).
   - [ ] Check runtime is reasonable.

7. **Review PR quality**
   - [ ] Ensure tests fail without the fix (when writing regression tests).
   - [ ] Ensure assertions match desired behavior, not internal implementation.
   - [ ] Ensure new tests include clear names and minimal fixtures.

8. **Update docs and capture learnings**
   - [ ] If new patterns/helpers are introduced, document them (link in PR description and/or update docs index).
   - [ ] Note any discovered gaps (missing validation, unclear error mapping) for follow-up tasks.

---

## 11. Hand-off Notes (optional)

When handing off test work, summarize:

- What behaviors are now covered (list modules/routes and scenarios).
- What remains untested (e.g., hard-to-mock integration, missing hooks for DI).
- Any flakiness risks (timers, async retries, external service assumptions).
- Suggested follow-ups:
  - Introduce dependency injection seams in services that are tightly coupled to external clients.
  - Add shared test utilities for repeated mocks (MinIO/SftpGo/SMTP transports).
  - Add CI coverage thresholds if not already enforced.

---
