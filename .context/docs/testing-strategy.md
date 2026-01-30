# Testing Strategy (PrimeCloudProV2)

The quality of the PrimeCloudProV2 platform is maintained through a multi-layered testing strategy. This approach ensures that:

- Individual logic units work as expected (fast feedback)
- Services interact correctly with external systems (Minio, SFTPGo, database)
- End-user workflows remain stable across releases

The strategy emphasizes **shifting left**: run static checks and unit tests early, then validate business-critical workflows with integration and E2E tests.

---

## Goals

1. **Fast feedback** for developers (unit tests + linting)
2. **High confidence** in business-critical flows (integration + E2E)
3. **Repeatability** via deterministic test environments (dedicated test DB, controlled env vars)
4. **Coverage where it matters** (Billing/Auth/Storage services)

---

## Test Pyramid / Tiers

### 1) Unit Tests

**Purpose:** Validate isolated logic with minimal dependencies.

- **Framework:** Vitest (preferred for Vite compatibility) or Jest
- **Scope:**
  - Pure functions and utilities (e.g. document validation utilities)
  - Small, isolated component behavior
  - Logic that does not require DB or external services
- **React tooling:** `@testing-library/react`
- **Naming convention:** `*.test.ts` or `*.spec.ts`
  - Either adjacent to the source file, or inside a `__tests__` folder

**Examples of good unit-test targets:**
- `server/lib/document-validation.ts`
- `client/src/lib/document-validation.ts`
- Small helper functions in `client/src/lib/*`

---

### 2) Integration Tests

**Purpose:** Validate the interaction between **Controllers → Services → Database** and key infrastructure boundaries.

- **Framework:** Vitest + Supertest (for API routes)
- **Scope:**
  - API route behavior with real service wiring
  - Database reads/writes and transactional behavior
  - Business workflows (billing calculations, usage aggregation, account lifecycle)
  - Storage flows (bucket operations, permissions) where feasible
- **Tooling:**
  - Dedicated test database initialization/reset (see `scripts/db_test.ts`)
  - Mock external APIs when real infrastructure is not available
- **File pattern:** `tests/integration/**/*.test.ts`

**High-value integration areas in this repo:**
- `server/services/billing.service.ts`
- `server/services/minio.service.ts`
- `server/services/sftpgo.service.ts`
- API routes under `server/routes/*`

---

### 3) E2E (End-to-End) Tests

**Purpose:** Validate real user journeys through the UI + backend together.

- **Framework:** Playwright
- **Scope:** Full user flows such as:
  - Account registration/login
  - VPS ordering
  - File management in the dashboard (buckets/objects)
  - Billing visibility and invoice workflows (where applicable)
- **Execution model:** Runs against a built frontend and a staging-like backend environment
- **Priority note:** Critical paths are emphasized in the `testsprite_tests` directory

---

## What to Test (Recommendations)

### Backend
- **Services** should be covered with unit tests for pure logic and integration tests for DB/external side effects:
  - Billing/usage calculations (`BillingService`)
  - Storage operations (`MinioService`)
  - SFTP provisioning (`SftpGoService`)
  - Audit logging (`AuditService`)
  - Notifications (`NotificationService`)

### Frontend
- Prefer **component unit tests** for:
  - Rendering states (loading/empty/error)
  - Forms and validation feedback
  - Conditional UI (permissions/roles)
- Prefer **E2E** for:
  - Multi-step flows across pages
  - Auth/session-dependent navigation
  - Regression coverage for critical dashboard workflows

---

## Running Tests

> Ensure test environment variables are configured (especially DB and Minio credentials) before running tests.

### Run all tests
```bash
npm run test
```

### Watch mode (development)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

### Run a specific script/suite (example: Minio connectivity checks)
```bash
npx ts-node scripts/test-minio.ts
```

---

## Environment & Test Data

### Test environment variables
- Use a dedicated test environment configuration (commonly `.env.test`).
- Pay special attention to:
  - Database connection settings used by integration tests and `scripts/db_test.ts`
  - Minio/S3 endpoints and credentials used by `server/services/minio.service.ts`
  - SFTPGo configuration used by `server/services/sftpgo.service.ts`
  - Any Replit integration settings under `server/replit_integrations/*` if running locally

### External dependencies
Integration and E2E tests may require one of the following:
- Local containers for DB/Minio/SFTPGo
- A dev/staging environment that is safe for automated tests
- Mocks/stubs where live infrastructure is unavailable

---

## Quality Gates (Pre-Merge Requirements)

Before merging into `main` or `develop`, the following must pass:

1. **Linting & formatting**
   - `npm run lint` (ESLint)
   - Prettier formatting compliance

2. **Minimum coverage**
   - Global statement coverage: **80%**
   - Branch coverage: **75%**
   - Critical services (Billing, Auth, Minio): **95%**

3. **Build integrity**
   - `npm run build` must succeed
   - No TypeScript errors

4. **Automated checks**
   - Unit + integration test suites must pass in CI/CD

---

## Troubleshooting

### Flaky database tests
If database tests fail intermittently:

- Confirm `scripts/db_test.ts` resets schema/state correctly.
- Avoid concurrent tests colliding on the same DB instance:
  - Use unique schemas per worker, or
  - Run DB-dependent tests sequentially (as a last resort)

### External service timeouts (Minio/SFTPGo)
Tests involving `MinioService` or `SftpGoService` can fail due to slow startup/network:

- Increase timeouts for specific tests:
  ```ts
  vi.test("...", async () => {
    // ...
  }, { timeout: 10000 });
  ```
- Verify Minio connectivity:
  ```bash
  npx ts-node scripts/test-minio.ts
  ```

### Environment quirks (Replit integrations / SFTPGo)
- Local variables may differ from production.
- Keep `.env.test` synchronized with expectations in:
  - `server/services/sftpgo.service.ts`
  - `server/replit_integrations/auth/*`

---

## Conventions & Project Structure Notes

- **Backend**
  - Controllers/routes: `server/routes/*`
  - Services: `server/services/*`
  - Utilities: `server/lib/*`
- **Frontend**
  - Pages: `client/src/pages/*`
  - Components: `client/src/components/*`
  - Client utilities: `client/src/lib/*`
- **Shared**
  - Types/schemas: `shared/schema.ts`
  - Route builders/helpers: `shared/routes.ts`

This structure aligns well with the testing tiers:
- Utilities → unit tests
- Routes + services + DB → integration tests
- Pages + real flows → E2E tests

---

## See Also

- [Development Workflow](development-workflow.md) for how tests integrate into the PR process and day-to-day development.
