---
status: filled
generated: 2026-01-22
agents:
  - type: "code-reviewer"
    role: "Review code changes for correctness and security"
  - type: "feature-developer"
    role: "Implement bucket-scoped access keys"
  - type: "test-writer"
    role: "Add coverage for new access rules"
  - type: "documentation-writer"
    role: "Document key behavior and setup"
  - type: "security-auditor"
    role: "Validate least-privilege enforcement"
  - type: "backend-specialist"
    role: "Design API and storage flow"
  - type: "frontend-specialist"
    role: "Extend UI for bucket scoping"
  - type: "database-specialist"
    role: "Schema update for bucket scopes"
docs:
  - "project-overview.md"
  - "architecture.md"
  - "development-workflow.md"
  - "testing-strategy.md"
  - "security.md"
phases:
  - id: "phase-1"
    name: "Discovery & Alignment"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation & Iteration"
    prevc: "E"
  - id: "phase-3"
    name: "Validation & Handoff"
    prevc: "V"
---

# Restringir Chaves S3 Por Bucket Plan

Provide bucket-scoped S3 access keys so backup clients (Imperius, etc.) can only access selected buckets, not the whole account.

## Task Snapshot
- **Primary goal:** Add per-bucket scope to access keys and enforce it at the S3 policy level.
- **Success signal:** A key scoped to one bucket cannot list or access any other bucket; UI shows selected buckets.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Codebase Context
- **Relevant modules:**
  - `server/services/minio.service.ts` (credential generation)
  - `server/storage.ts` (access key persistence)
  - `server/routes.ts` (access key endpoints)
  - `shared/schema.ts` (access_keys schema)
  - `shared/routes.ts` (API contracts)
  - `client/src/pages/ApiKeys.tsx` (UI)
  - `client/src/hooks/use-access-keys.ts` (client hooks)

## Design Summary
- **Data model:** Add `bucketScope` to access keys (array of bucket IDs or null for full access). Store in DB and expose in API.
- **MinIO policy:** On key creation or update, apply a policy that restricts the key to allowed buckets and actions (read/write).
- **Backwards compatibility:** Existing keys default to full access (null scope).
- **UI:** Allow selecting buckets and permissions when creating a key; display scope in list.

## Risk Assessment
### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Incorrect policy generation | Medium | High | Add unit tests with expected policy JSON | Backend |
| Legacy keys break | Low | High | Default to full access when scope is null | Backend |
| MinIO admin API required | Medium | High | Implement fallback + document requirements | DevOps |

### Dependencies
- **Internal:** API contract updates, UI update for ApiKeys.
- **External:** MinIO admin API or policy management tool.
- **Technical:** Access to MinIO admin credentials in server env.

### Assumptions
- MinIO supports per-credential policies (service accounts or policy attachments).
- Buckets are tenant-prefixed and already separated by account.

## Resource Estimation
### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | 0.5 person-day | 1 day | 1 |
| Phase 2 - Implementation | 3-5 person-days | 1 week | 1-2 |
| Phase 3 - Validation | 1 person-day | 1-2 days | 1 |
| **Total** | **4.5-6.5 person-days** | **~1-1.5 weeks** | **-** |

### Required Skills
- Backend TypeScript (Express + MinIO SDK)
- DB schema updates (Drizzle)
- React UI updates
- Security review for IAM/policy

### Resource Availability
- **Available:** 1 backend + 1 frontend
- **Blocked:** None assumed
- **Escalation:** Tech lead

## Working Phases
### Phase 1 -- Discovery & Alignment
**Steps**
1. Confirm MinIO admin API approach for service accounts and policy attachment.
2. Decide bucket scope model (array of bucket IDs vs names).
3. Define API shape and UI UX for bucket selection.

**Commit Checkpoint**
- Document decisions in plan; no code changes.

### Phase 2 -- Implementation & Iteration
**Steps**
1. Schema: add `bucketScope` (jsonb array) to `access_keys`.
2. API: extend access key create/update responses with scope.
3. Storage: persist scope; update create/rotate/toggle flows.
4. MinIO: create policy per key from scope and permissions; attach policy on create/rotate.
5. UI: add bucket selector to create dialog; show scope in list.
6. Backfill: existing keys get null scope for full access.

**Commit Checkpoint**
- `feat(access-keys): add bucket scoped credentials`

### Phase 3 -- Validation & Handoff
**Steps**
1. Tests: policy builder unit tests; API contract tests.
2. Manual: create scoped key and verify list buckets result.
3. Docs: update README or security notes to explain scope.

**Commit Checkpoint**
- `test(access-keys): cover bucket scoped policies`

## Rollback Plan
### Rollback Triggers
- Scoped keys fail to access intended buckets.
- Any key gains broader access than intended.

### Rollback Procedures
#### Phase 2 Rollback
- Revert schema migration and code changes; keys revert to full access.
- Data impact: bucketScope column removed (backup required).

#### Phase 3 Rollback
- Disable policy enforcement in MinIO integration while keeping DB changes.

### Post-Rollback Actions
1. Capture failing policy and add regression tests.
2. Re-review MinIO admin configuration.

## Evidence & Follow-up
- Policy JSON samples for read/write scopes.
- Test output from `npm run test`.
- Manual validation log with S3 client list results.
