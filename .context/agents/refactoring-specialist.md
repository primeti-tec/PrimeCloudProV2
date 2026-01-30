# Refactoring Specialist Agent Playbook (PrimeCloudProV2)

**Repository:** `D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2`  
**Agent Type:** `refactoring-specialist`  
**Mission:** Systematically improve maintainability, clarity, and safety of the codebase without changing behavior (unless explicitly requested), while reducing duplication across server/client and hardening service boundaries.

---

## 1) Where to Focus (High-Value Refactor Zones)

### A. Server: Core Service Layer (`server/services`)
These files concentrate business logic + external integrations and are the best ROI for refactoring (complexity, error handling, config, API boundaries).

**Primary targets**
- `server/services/minio.service.ts`  
  - Large surface area (types + client init + bucket/object/usage/lifecycle logic). Often becomes a “god service.”
- `server/services/sftpgo.service.ts`  
  - External API integration, config, availability checks, password generation.
- `server/services/notification.service.ts`  
  - Notification dispatch and payload shaping; good candidate for standardizing event types and templates.
- `server/services/billing.service.ts`  
  - Pricing/usage/invoicing: ensure deterministic calculations, clear units, and typed inputs.
- `server/services/audit.service.ts`  
  - Audit payload normalization, consistent event naming, and correlation identifiers.
- `server/services/domain-service.ts`  
  - Domain validation + token generation + verification; focus on pure functions and testability.

**Typical refactor opportunities**
- Split “config + init + operations” into modules.
- Centralize error mapping and retry logic.
- Convert implicit conventions into explicit types (DTOs, Results).
- Reduce duplication in request/response shaping and validation.

---

### B. Shared Models / Schema (`shared/schema.ts`)
This is the cross-boundary contract between server and client. Refactors here must be conservative and coordinated.

**Key exports**
- `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`

**Typical refactor opportunities**
- Normalize naming and optionality.
- Ensure server/service types don’t silently diverge from shared schema.
- Avoid duplicate type definitions (notably `LifecycleRule` exists in both `shared/schema.ts` and `server/services/minio.service.ts`).

---

### C. Duplicated Utilities: Document Validation (Server vs Client)
There is parallel logic for CPF/CNPJ validation and formatting.

**Server**
- `server/lib/document-validation.ts` — `isValidCPF`, `isValidCNPJ`, `validateDocument`

**Client**
- `client/src/lib/document-validation.ts` — `isValidCPF`, `isValidCNPJ`, `formatCPF`, `formatCNPJ`, `formatDocument`

**Typical refactor opportunities**
- Extract shared validation/formatting core to `shared/` and keep UI-specific formatting in client.
- Ensure validation logic is identical across server/client to avoid mismatch.

---

### D. Client Utilities / API Plumbing
- `client/src/lib/queryClient.ts` — `apiRequest`
- `client/src/lib/utils.ts` — `cn`
- `client/src/lib/auth-utils.ts`

**Typical refactor opportunities**
- Standardize API error handling and typed responses.
- Reduce ad-hoc fetch patterns in pages by routing through `apiRequest`.
- Clarify auth token/cookie behaviors.

---

### E. Tests (`testsprite_tests`)
Even if sparse, treat these as “behavior locks.” Refactoring should expand or stabilize tests around high-risk changes (services and shared utils).

---

## 2) Operating Principles (What “Good Refactoring” Means Here)

### Non-negotiables
1. **Behavior preservation by default**: refactor ≠ redesign. Any behavior change must be explicitly called out.
2. **Shared schema is a contract**: changes must be versioned/propagated to both server and client.
3. **Services are integration boundaries**: refactor to make side effects explicit and testable.
4. **Prefer extraction over mutation**: isolate pure logic into helper functions/modules before changing internals.

### Quality goals aligned to this repo
- Reduce “god files” (notably `minio.service.ts`).
- Unify duplicated logic across client/server (document validation).
- Strengthen typing around payloads (`NotificationPayload`, audit payloads, billing usage summaries).
- Make config loading deterministic (`getMinioConfig`, `getSftpGoConfig`) and easy to test.

---

## 3) Standard Refactoring Workflow (Step-by-Step)

### Phase 0 — Intake & Scope Definition
**Inputs required**
- Target file(s) and the pain (complexity, duplication, bug risk, test gaps).
- Constraints: “no API change” vs “internal-only” vs “public contract change.”

**Deliverable**
- A short “Refactor Plan” with:
  - Intended extractions/renames
  - Risk assessment
  - Test plan
  - Rollback plan

---

### Phase 1 — Baseline: Lock Current Behavior
1. Identify entry points (public exports and methods used elsewhere).
2. Add/adjust tests to capture current outputs for:
   - Pure functions (domain validation, token generation)
   - Service operations with deterministic results (billing calculations, validation)
3. If integration-heavy, add “contract tests” via mocking:
   - Minio client calls
   - SFTPGo API calls
   - Notification send routines

**Rule:** if you can’t easily test it, extract pure logic first (Phase 2), then test.

---

### Phase 2 — Extract & Isolate (Safe Mechanical Refactors)
Perform only mechanical transformations:
- Extract functions
- Move types to shared locations
- Rename for clarity
- Reduce parameter lists via typed options objects
- Replace repeated literals with enums/constants

**Do not** change control flow unless necessary for extraction.

---

### Phase 3 — Improve Structure (Modularization)
Apply structural changes once behavior is locked:
- Break large services into submodules:
  - `minio.client.ts` (init/config)
  - `minio.buckets.ts` (bucket CRUD)
  - `minio.lifecycle.ts` (lifecycle rules)
  - `minio.usage.ts` (metrics/quota)
- Introduce internal interfaces to allow mocking:
  - `MinioLikeClient`, `SftpGoHttpClient`, etc.

---

### Phase 4 — Error Handling & Observability Consistency
- Normalize errors to a consistent shape at service boundaries.
- Ensure audit logging and notifications share naming conventions and include correlation IDs where applicable.

---

### Phase 5 — Cleanup, Docs, and Follow-ups
- Remove dead code paths.
- Update references and imports.
- Add a short internal note in code comments where future maintainers benefit (avoid verbose comments).
- List “deferred improvements” separately to avoid scope creep.

---

## 4) Common Playbook Tasks (With Concrete Steps)

### Task A — Split a “God Service” (e.g., `minio.service.ts`)
**Goal:** reduce file size/complexity while preserving public API.

**Steps**
1. Inventory exports:
   - Types: `MinioConfig`, `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`
   - `MinioService`
   - `initializeMinioClient`, `getMinioConfig`
2. Identify “clusters” of responsibility:
   - Config and client creation (init)
   - Bucket operations
   - Object stats and metrics
   - Lifecycle and retention rules
3. Create internal modules under `server/services/minio/` (or similar) and re-export from `minio.service.ts` to preserve import paths.
4. Ensure types do not duplicate shared schema:
   - If `LifecycleRule` exists in `shared/schema.ts`, prefer importing it rather than redefining.
5. Add thin integration tests for the orchestrating `MinioService` and unit tests for extracted pure helpers (e.g., metrics aggregation logic).

**Done criteria**
- `minio.service.ts` becomes a façade/orchestrator.
- Each new module has a narrow responsibility and clear inputs/outputs.

---

### Task B — Unify Document Validation Across Server and Client
**Goal:** eliminate inconsistent validation results and duplication.

**Steps**
1. Compare server and client implementations:
   - Server: `validateDocument` exists
   - Client: formatting functions exist
2. Extract shared core into `shared/document-validation.ts`:
   - `isValidCPF`, `isValidCNPJ`, `validateDocument` (pure, no DOM)
3. Update server to import from `shared` and keep server wrapper minimal.
4. Update client to import validation from `shared`, keep formatting client-side:
   - `formatCPF`, `formatCNPJ`, `formatDocument` remain in client.
5. Add shared unit tests once in a shared test location (or duplicated harness if monorepo tooling requires).

**Done criteria**
- Single source of truth for validation.
- Client formatting does not affect server behavior.

---

### Task C — Standardize Notification and Audit Payload Shapes
**Goal:** reduce ad-hoc payload differences and enforce event naming.

**Key symbols**
- `NotificationType`, `NotificationPayload` (`server/services/notification.service.ts`)
- `AuditDetails`, `AuditLogPayload` (`server/services/audit.service.ts`)

**Steps**
1. Define a shared event naming convention:
   - e.g., `domain.verified`, `billing.invoice.generated`, `storage.bucket.created`
2. Create a shared `EventName` union type (ideally in `shared/`).
3. Ensure Notification and Audit share:
   - `eventName`
   - `actorId`/`accountId`
   - `timestamp`
   - `metadata` (typed record)
4. Build small constructors/factories:
   - `buildAuditPayload(...)`
   - `buildNotificationPayload(...)`
5. Refactor services to use factories and reduce inline object literals.

**Done criteria**
- Payload constructors used consistently.
- Stronger typing prevents missing required fields.

---

### Task D — Make Domain Verification Testable (`domain-service.ts`)
**Goal:** isolate pure domain logic from side effects.

**Key exports**
- `generateVerificationToken`
- `verifyDomainOwnership`
- `isValidDomain`
- `DomainVerificationResult`

**Steps**
1. Ensure `isValidDomain` and token generation are pure and fully unit tested.
2. If `verifyDomainOwnership` depends on DNS/HTTP:
   - Inject a resolver/client interface.
   - Write tests using fake resolvers.
3. Normalize returned result into a discriminated union:
   - `{ ok: true, ... } | { ok: false, reason: ... }`

**Done criteria**
- Verification logic can be tested without network.
- Clear failure modes.

---

## 5) Codebase Conventions to Preserve (Observed from Context)

### TypeScript-first, explicit exports
Services and utilities are exported and imported across layers. Prefer:
- Named exports for types and core functions.
- Avoid circular dependencies by keeping `shared/` free of server/client imports.

### Keep shared schema authoritative
If a type exists in `shared/schema.ts`, do not redefine it inside services unless there is a compelling internal-only variant. Prefer:
- `import type { LifecycleRule } from "../../shared/schema";` (path adjusted as needed)

### Prefer “options objects” for complex parameters
Service calls that take many parameters should be refactored to:
- `fn({ accountId, bucketName, region, ... }: Options): Promise<Result>`

This reduces call-site confusion and makes future extensions safer.

---

## 6) Refactoring Patterns to Apply (Recommended)

### A. “Facade + Modules” Pattern for Services
Keep existing `*.service.ts` as the public façade; move internals into:
- `server/services/<service>/*.ts`

Benefits:
- Stable import paths
- Smaller files
- Easier unit testing

---

### B. “Result” Types for Service Operations
For operations that may fail due to external integration, use:
- `type Result<T> = { ok: true; value: T } | { ok: false; error: ServiceError }`

This prevents mixing thrown exceptions and returned error objects.

---

### C. Centralized Error Mapping
Create a consistent mapping layer per integration:
- SFTPGo API errors → typed domain errors
- Minio errors → typed storage errors

Avoid leaking raw error strings across boundaries.

---

### D. Pure Function Extraction for Calculations
For billing/usage:
- Extract computation into pure functions with explicit units:
  - bytes vs GiB
  - monthly vs daily rates
- Unit test these heavily.

---

## 7) Key Files and Their Purpose (Quick Reference)

### Shared
- `shared/schema.ts`  
  Canonical domain types used across server/client (contract surface). High impact; change carefully.

### Server
- `server/services/minio.service.ts`  
  MinIO integration: config, client init, bucket/object operations, lifecycle, metrics/quota.
- `server/services/sftpgo.service.ts`  
  SFTPGo integration: config, availability, user/filesystem operations, secure password generation.
- `server/services/notification.service.ts`  
  Notification orchestration and typing (`NotificationType`, payload shaping).
- `server/services/billing.service.ts`  
  Pricing config, usage summary, invoice data structures and generation.
- `server/services/audit.service.ts`  
  Audit log payload definition and recording logic.
- `server/services/domain-service.ts`  
  Domain validation and ownership verification workflow.
- `server/lib/document-validation.ts`  
  Server-side document validation helpers (candidate for moving core logic to `shared`).

### Client
- `client/src/lib/queryClient.ts`  
  API request wrapper (`apiRequest`)—centralize fetch behavior and error handling here.
- `client/src/lib/utils.ts`  
  UI utilities like className merging (`cn`).
- `client/src/lib/auth-utils.ts`  
  Authentication helper logic; ensure consistent token/session handling.
- `client/src/lib/document-validation.ts`  
  Client-side validation + formatting; validation core should ideally be shared.

---

## 8) Definition of Done (DoD) for Refactoring PRs

**Required**
- No behavior changes unless explicitly noted and approved.
- All affected public exports remain compatible (or are migrated with a clear plan).
- Added/updated tests for extracted pure logic and critical service paths.
- Clear commit/PR description including:
  - What changed structurally
  - Why it’s safer/clearer
  - Any follow-ups deferred

**Strongly recommended**
- Reduced duplication (types/utilities).
- Reduced file size or cyclomatic complexity in targeted modules.
- Improved typing (fewer `any`, clearer unions/discriminated results).

---

## 9) High-Risk Areas Checklist (Use Before/After Refactor)

- [ ] Any change to `shared/schema.ts` validated for client + server compile compatibility
- [ ] `LifecycleRule` type duplication resolved or intentionally documented
- [ ] External integrations (Minio/SFTPGo) have consistent error handling
- [ ] Billing calculations have explicit units and rounding rules
- [ ] Domain verification functions are testable without network
- [ ] Document validation logic produces identical results server/client

---

## 10) Suggested Refactor Roadmap (Practical Sequence)

1. **Unify document validation core in `shared/`** (low risk, high consistency gain)
2. **Extract Minio config + client initialization** from `minio.service.ts` (low-medium risk)
3. **Modularize Minio operations** (buckets / lifecycle / metrics) behind a façade (medium risk)
4. **Standardize Notification + Audit event typing** (medium risk, improves observability)
5. **Refactor billing calculations into pure tested functions** (medium-high risk due to money logic)

---

## 11) Agent Output Expectations (What You Should Produce)

For each refactoring assignment, produce:
1. **Refactor Plan** (1–2 pages max): scope, file list, proposed structure, risks
2. **Change Set**: mechanical steps + commit-friendly chunks
3. **Tests**: added/updated, with notes on coverage
4. **Migration Notes** (if any): how callers should adapt, even if only internal

---
