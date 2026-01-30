# QA & Testing

This guide describes the testing strategy, toolchain, conventions, and procedures used in **PrimeCloudProV2**. It is intended for developers writing or maintaining tests across the server, client, and integration layers.

---

## Goals

- Validate core business logic and services (e.g., **MinIO**, **SFTPGo**, **Billing/Stripe**, **Notifications**).
- Ensure API routes behave correctly (request/response, auth, validation, error handling).
- Verify React UI behavior and regressions in key components/pages.
- Provide repeatable, isolated test runs for local development and CI.

---

## Tooling & Frameworks

### Primary test runner
- **Vitest** (unit + integration): https://vitest.dev/

### UI/component testing
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/

### API testing
- **Supertest** (run via Vitest) for HTTP-level route testing

### Database testing
- **Drizzle ORM** with a dedicated test database (recommended) to validate schema and DB interactions.

---

## Where Tests Live (Project Conventions)

Tests should be colocated with the code they cover when practical, or placed in one of the dedicated test directories:

- **Server service tests**: `server/services/*.test.ts`  
  Focus: business logic, DB behavior, external provider integration boundaries (mocked by default).

- **Server route tests**: `server/routes/*.test.ts`  
  Focus: HTTP behavior, input validation, auth/permissions, correct service calls, response shapes.

- **React component tests**:
  - `tests/components/`
  - `client/src/components/**/*.test.tsx`  
  Focus: rendering, user interactions, conditional UI, accessibility-focused queries.

- **Integration/E2E-style suites**:
  - `testsprite_tests/`  
  Focus: broader flows or repository-specific automated test suites.

- **Operational verification scripts (not unit tests)**:
  - `scripts/test-minio.ts`
  - `scripts/db_test.ts`  
  Use these to validate infrastructure connectivity and environment readiness.

---

## Running Tests

### Run all tests (single run)
```bash
npm test
```

### Watch mode (development)
```bash
npm test -- --watch
```

### Run a specific test file
Example: Billing service tests
```bash
npx vitest server/services/billing.service.test.ts
```

### Coverage
```bash
npm test -- --coverage
```

---

## Writing Tests

### 1) Service unit tests (server)

**Guideline:** Unit tests should isolate logic. Mock external dependencies (MinIO/S3, Stripe, SMTP, SFTPGo HTTP API) unless the test is explicitly marked as an integration test.

Example service test pattern (Vitest):

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MinioService } from "../server/services/minio.service";

describe("MinioService", () => {
  let minioService: MinioService;

  beforeEach(() => {
    vi.restoreAllMocks();
    minioService = new MinioService();
  });

  it("should generate a valid pre-signed URL", async () => {
    const bucket = "test-bucket";
    const object = "file.txt";

    const url = await minioService.getPresignedUrl(bucket, object);

    expect(url).toContain(bucket);
    expect(url).toContain(object);
  });
});
```

**Related code:**
- `server/services/minio.service.ts`
- `server/services/billing.service.ts`
- `server/services/sftpgo.service.ts`
- `server/services/notification.service.ts`
- `server/services/audit.service.ts`

---

### 2) React component tests (client)

Use **React Testing Library** to test behavior from the user’s point of view.

Key practices:
- Prefer `screen.getByRole(...)` and accessible queries.
- Avoid implementation details (internal state, class names).
- Mock network calls at the boundary (e.g., API utilities / hooks).

Example:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders and handles clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);

    fireEvent.click(screen.getByText("Click Me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

**Related code:**
- `client/src/components/**`
- `client/src/pages/**`
- Shared UI primitives: `client/src/components/ui/**`

---

### 3) API/route tests (server)

Route tests validate:
- HTTP status codes and response payloads
- Authentication / authorization rules
- Schema validation (request + response)
- Error handling paths

Recommended approach:
- Use Supertest against the server/app instance (depending on how the server is composed).
- Stub underlying services where necessary to avoid calling external providers.

Also validate response shapes using shared schemas.

**Related code:**
- `server/index.ts` (server entry)
- `server/routes/**`
- `shared/schema.ts` (Zod schemas & types)
- `shared/routes.ts` (route builders/helpers)

---

## Schema Validation in Tests (Recommended)

The codebase exports Zod schemas and typed request/response models in `shared/schema.ts`. Use them to validate runtime response shapes in route and integration tests.

Benefits:
- Prevents silent contract drift between client and server
- Makes API tests more robust than checking only individual fields

**Related code:**
- `shared/schema.ts`

---

## Mocking Strategy (External Providers)

Mock external services in unit tests by default. Only call real providers in explicitly-scoped integration runs.

### MinIO / S3
- Mock the `minio` SDK (`vi.mock('minio')`) or mock at the `MinioService` boundary.
- Keep “connectivity checks” in scripts (see below), not unit tests.

### Billing / Stripe
- Mock `BillingService` or the Stripe client dependency.
- Never run real transactions in unit tests.

### SMTP
- Mock the transporter or use route helper logic as reference:
  - `server/routes/smtp.ts` (e.g., `handleTestSMTP`)

### SFTPGo
- Ensure environment variables exist for integration checks:
  - `SFTPGO_ADMIN_USER`
  - `SFTPGO_ADMIN_PASSWORD`
- Prefer mocking SFTPGo HTTP calls in unit tests; only run live checks when explicitly requested.

---

## Infrastructure Verification Scripts (Operational Checks)

These are useful for validating environment readiness (credentials, network access, running services). They are **not** a replacement for unit tests.

### MinIO connectivity
```bash
npx ts-node scripts/test-minio.ts
```

### Database connectivity / integrity
```bash
npx ts-node scripts/db_test.ts
```

---

## Environment & Configuration

### Use a dedicated test environment
- Prefer a `.env.test` file for local testing.
- Never run tests against production data or production services.
- Keep credentials scoped and least-privileged.

### Database isolation
- Tests that touch the DB should:
  - start from a clean state, or
  - wrap operations in transactions (when supported) and roll back, or
  - use a per-test database/schema.

---

## Test Hygiene & Best Practices

1. **Isolation**
   - Tests must not depend on execution order.
   - Avoid shared mutable state without reset hooks.

2. **Clean state**
   - Use `beforeEach`/`afterEach` to reset mocks and clear database changes.
   - Use `vi.restoreAllMocks()` or equivalent patterns when needed.

3. **Determinism**
   - Control time with fake timers when testing time-based logic.
   - Avoid relying on randomness unless seeded/controlled.

4. **Contract correctness**
   - Validate API response shapes with shared Zod schemas (`shared/schema.ts`).

5. **Pragmatic layering**
   - Unit tests: mock externals.
   - Integration tests: use real DB and internal modules, but still avoid third-party calls unless specifically configured.
   - E2E/system tests: run in dedicated environments and pipelines.

---

## Related Documentation / Files

- **Shared contracts & schemas**: `shared/schema.ts`
- **Route helpers**: `shared/routes.ts`
- **Server entry**: `server/index.ts`
- **Core services**:
  - `server/services/minio.service.ts`
  - `server/services/sftpgo.service.ts`
  - `server/services/billing.service.ts`
  - `server/services/notification.service.ts`
  - `server/services/audit.service.ts`
- **SMTP routes (testing/reference)**: `server/routes/smtp.ts`
- **Operational check scripts**:
  - `scripts/test-minio.ts`
  - `scripts/db_test.ts`

---
