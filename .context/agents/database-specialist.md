# Database Specialist Agent Playbook (PrimeCloudProV2)

## Mission (What “done” looks like)
Deliver safe, measurable improvements to the data model and database-related behaviors by:
- Keeping the canonical domain schema consistent and versionable.
- Preserving data integrity (constraints, validation, normalization where appropriate).
- Improving query performance (indexes, access patterns, payload shape).
- Ensuring security and compliance for sensitive data at rest and in transit.
- Coordinating schema changes with service logic and tests.

---

## Where to Work (Files/Areas of Focus)

### 1) Canonical schema & domain types (primary)
**`shared/schema.ts`**
- Central source of truth for domain entities and typed composites.
- Known exported models:
  - `LifecycleRule`, `Product`, `Order`, `VpsConfig`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`
- Known composite/DTO types:
  - `OrderWithDetails`
  - `AccountWithDetails`
- **Agent focus**: any change to persistence shape should start here (fields, relationships, constraints, naming, types).

**What to look for inside `shared/schema.ts`:**
- Entity definitions (field types, optionality, defaults)
- Relationship modeling (FK-like fields, join shapes implied by `*WithDetails`)
- Enumerations / discriminators and how they impact storage
- Serialization and “wire contract” implications (shared between client/server)

### 2) Service layer with persistence implications (secondary)
**`server/services/**`**
- While these are “services”, they define **data access patterns** and impact schema needs:
  - `server/services/minio.service.ts` (storage objects, metrics, lifecycle)
  - `server/services/notification.service.ts` (notification types and delivery)
  - `server/services/sftpgo.service.ts` (SFTP-related identity/configuration)
- **Agent focus**:
  - Identify hot paths (frequent queries, list screens, dashboards, metrics)
  - Ensure schema supports required filtering/sorting efficiently
  - Ensure sensitive fields aren’t logged or exposed

### 3) UI usage shaping query needs (tertiary)
**`client/src/pages/**`**
- Drives read patterns: list views, detail views, filters, pagination.
- **Agent focus**: confirm what the UI needs so indexes/denormalizations are justified and “WithDetails” shapes are stable.

### 4) Security & regression checks (supporting)
**`testsprite_tests/**`**
- Includes security validation such as:
  - `TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py`
- **Agent focus**:
  - Ensure schema changes don’t regress security expectations
  - Add/adjust tests when adding new sensitive fields or storage flows

---

## Core Data Model (What’s in scope)
The app’s persistent domain is implied by the exported types in `shared/schema.ts`:

- **Identity / tenancy**: `Account`, `AccountMember`
- **Commerce**: `Product`, `Order`, `Subscription`
- **Storage**: `Bucket`, `AccessKey`, `LifecycleRule` (+ MinIO/S3 lifecycle semantics)
- **Ops / messaging**: `Notification` and `NotificationType`
- **Compute config**: `VpsConfig`

**Composite types** (e.g., `OrderWithDetails`, `AccountWithDetails`) imply relational joins or document embedding. Treat them as:
- A contract for read models
- A hint for indexes and relationship cardinality
- A stability surface (API consumers depend on the shape)

---

## Standard Workflows

### Workflow A — Add a new field to an existing model (safe evolution)
1. **Update canonical model**
   - Modify the relevant exported type in `shared/schema.ts`.
   - Decide optional vs required:
     - If required, plan backfill/default strategy.
2. **Define validation + constraints (conceptually)**
   - Determine: uniqueness, range/length, enum values, nullability.
   - Decide where enforcement lives (DB constraint vs app validation vs both).
3. **Assess impact on composites**
   - If field belongs in `*WithDetails`, update those types too.
4. **Propagate through services**
   - Update `server/services/**` code paths that read/write the model.
   - Confirm any downstream integrations (MinIO/SFTPGo/notifications).
5. **Update UI usage (if relevant)**
   - Adjust `client/src/pages/**` to display/edit the field.
6. **Security review**
   - If sensitive (secrets, keys, tokens, PII), verify:
     - Not logged
     - Not returned to the client unless needed
     - Encrypted/hashed as appropriate
7. **Test updates**
   - Add/adjust regression tests (including `testsprite_tests` if they cover the area).
   - Ensure older records without the new field are handled.

**Checklist**
- [ ] Backward compatible reading (undefined/null-safe)
- [ ] Backfill plan if required
- [ ] No sensitive data leakage in logs/DTOs
- [ ] Types updated: base model + relevant `*WithDetails`

---

### Workflow B — Introduce a new entity + relationships
1. **Model definition**
   - Add new exported type in `shared/schema.ts`.
   - Define identity strategy (id type, creation timestamps if pattern exists).
2. **Relationship mapping**
   - Decide cardinality:
     - 1:N (parentId on child)
     - N:M (join table/entity)
   - Update related models/types accordingly.
3. **Read models**
   - If the UI/API needs joined views, add a `*WithDetails` type or extend existing ones.
4. **Service orchestration**
   - Add or update service methods in `server/services/**`.
   - Ensure operations are atomic when needed (transaction boundaries in your DB layer).
5. **Performance plan**
   - Define likely filters/sorts and design indexes around them.
6. **Security & lifecycle**
   - Determine retention requirements (soft delete vs hard delete, lifecycle rules).
7. **Testing**
   - Add tests for CRUD + relationship integrity + access control.

**Checklist**
- [ ] Relationship fields named consistently (e.g., `accountId`, `orderId`)
- [ ] Join/expanded types defined intentionally (not ad-hoc)
- [ ] Indexes planned for list endpoints and dashboards
- [ ] Delete behavior defined (cascade, restrict, orphan handling)

---

### Workflow C — Optimize performance for a slow read/list endpoint
1. **Identify the access pattern**
   - From `client/src/pages/**` and `server/services/**`:
     - Typical filters (by account, status, date ranges)
     - Sort order (createdAt desc, name asc, etc.)
     - Pagination method (offset vs cursor)
2. **Shape the payload**
   - Prefer returning only needed fields; avoid “N+1” join patterns implied by `*WithDetails`.
3. **Index design**
   - Add/adjust indexes based on:
     - `(tenant/account scope) + (filter) + (sort)`
     - High-cardinality fields used in where clauses
4. **Denormalize only with justification**
   - If denormalizing for dashboards/metrics, define:
     - Source of truth
     - Update mechanism (write-time update vs async job)
     - Consistency requirements
5. **Validate improvements**
   - Capture before/after query plans and response times (or at minimum, measure service timings).
6. **Regression safety**
   - Ensure indexes don’t cause write amplification beyond acceptable limits.

**Checklist**
- [ ] Indexes match actual filters/sorts
- [ ] Query avoids fetching large blobs/secrets
- [ ] Pagination is stable under concurrent inserts (cursor preferred when necessary)

---

### Workflow D — Handle sensitive data (keys, secrets, tokens)
The domain includes `AccessKey` and likely other secrets (S3 keys, credentials, tokens).

1. **Classify the field**
   - Secret (must never be returned)
   - Token (short-lived, may be returned once)
   - PII (restricted exposure)
2. **Storage strategy**
   - Prefer **hashing** for verification-only secrets.
   - Prefer **encryption at rest** for recoverable secrets (KMS/managed encryption if available).
3. **Redaction**
   - Ensure DTOs and `*WithDetails` never include raw secrets.
   - Store only last-4 / fingerprint if UI needs identification.
4. **Logging hygiene**
   - In `server/services/**`, scrub secrets from logs and error payloads.
5. **Tests**
   - Update/extend `testsprite_tests/TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py` expectations if new sensitive fields are introduced.

**Checklist**
- [ ] Secrets not present in shared types used by the client unless explicitly redacted
- [ ] “Return once” semantics implemented if applicable
- [ ] Automated security test coverage updated

---

## Conventions & Best Practices (Derived from This Codebase)

### Shared schema as the contract
- Treat `shared/schema.ts` as the canonical contract between server and client.
- Prefer adding derived/composite types like `OrderWithDetails` / `AccountWithDetails` rather than ad-hoc expanded objects in services.

### Account/tenant scoping
- Entities like `Order`, `Subscription`, `Bucket`, `Notification` are typically **account-scoped**.
- Ensure all queries and indexes support `accountId` (or equivalent) scoping to prevent cross-tenant access and to speed up queries.

### Lifecycle-aware storage
- Presence of `LifecycleRule` and MinIO lifecycle support implies retention/expiration behaviors matter.
- Schema changes touching `Bucket`, `LifecycleRule`, object metrics should be validated against MinIO service expectations in `server/services/minio.service.ts`.

### Notification as an auditable domain
- `Notification` and `NotificationType` suggest an event/log-style table:
  - Favor append-only or immutable records when possible.
  - Index by `(accountId, createdAt)` and `(accountId, readAt/isRead)` patterns (conceptually) to support inbox UIs.

### Composite types imply join performance requirements
- `OrderWithDetails` / `AccountWithDetails` indicate the application expects enriched read models.
- Ensure the underlying storage supports efficient fetching of these composites (either via joins + indexes or via precomputed read models).

---

## Key Files and Their Purposes (Quick Reference)

- **`shared/schema.ts`**  
  Canonical domain model definitions and shared types. Start here for any schema change.

- **`server/services/minio.service.ts`**  
  Storage lifecycle/metrics/quotas behaviors. Schema changes to buckets, lifecycle rules, and usage tracking must align here.

- **`server/services/notification.service.ts`**  
  Notification orchestration and typing. Changes to `Notification` fields and delivery semantics must align here.

- **`server/services/sftpgo.service.ts`**  
  SFTP integration behavior; schema changes involving credentials/configs/identity may be impacted.

- **`client/src/pages/**`**  
  UI-driven read patterns and payload needs. Use it to justify indexes and composite types.

- **`testsprite_tests/TC017_Security_of_Sensitive_Data_Storage_and_Transmission.py`**  
  Security regression guardrails around sensitive data storage/transmission.

---

## Review Gates (What to verify before merging)
- **Contract correctness**: `shared/schema.ts` types compile and are coherent (base + `*WithDetails`).
- **Backward compatibility**: existing records won’t break new readers; defaults/backfills planned.
- **Integrity**: relationships are enforceable (at least at application level; DB constraints if used).
- **Performance**: new access patterns have an indexing/pagination plan.
- **Security**: sensitive fields are redacted/encrypted/hashed; tests updated.
- **Service alignment**: MinIO/SFTPGo/Notification services still behave correctly with new fields.

---

## Common Pitfalls (Avoid)
- Adding secrets to shared model types that are consumed by the client without a redaction strategy.
- Expanding `*WithDetails` endlessly without considering query cost and index support.
- Adding required fields without a migration/backfill story.
- Missing tenant scoping in list queries (both security and performance issue).
- Storing lifecycle/usage metrics without defining retention and aggregation strategy.

---

## “First 30 minutes” Triage Guide (When assigned a DB task)
1. Locate relevant model(s) in **`shared/schema.ts`** (and related `*WithDetails` types).
2. Search in **`server/services/**`** for reads/writes of those fields.
3. Check **`client/src/pages/**`** for list/detail pages using the data.
4. Identify sensitive-data concerns and confirm alignment with **TC017** security test.
5. Propose: schema change + read model impact + index/perf plan + test plan.
