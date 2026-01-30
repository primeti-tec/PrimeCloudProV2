# Security

This document describes the security architecture and operational security practices in **PrimeCloudProV2**, focusing on how authentication/authorization, tenant isolation, secrets handling, audit logging, and compliance-related controls are implemented across the codebase.

For a broader system overview, see: [Architecture Documentation](architecture.md).

---

## Security Goals

PrimeCloudProV2 is designed around a layered security model with these primary goals:

- **Confidentiality**: protect tenant data from unauthorized access.
- **Integrity**: ensure sensitive actions are traceable and resistant to tampering.
- **Availability**: maintain resilient access to storage and billing workflows.
- **Least Privilege (PoLP)**: minimize permissions across users, services, and programmatic credentials.
- **Tenant Isolation**: enforce account-scoped access and prevent cross-tenant leakage.

---

## Authentication

PrimeCloudProV2 uses a hybrid authentication approach depending on environment and integration needs.

### Client-side authentication (Clerk)

The frontend obtains authentication tokens via Clerk and attaches them to API requests.

- Token retrieval: `client/src/lib/queryClient.ts` (`getClerkToken()`)
- Authenticated requests helper: `client/src/lib/queryClient.ts` (`apiRequest()`)

**Developer notes**
- All API routes handling sensitive operations should expect an authenticated request and derive the acting identity from the verified token/session (not from client-provided user identifiers).
- Prefer server-side authorization checks even if the UI hides controls.

### Environment-specific authentication (Replit integration)

The repository includes an auth integration for Replit environments:

- Session + user upsert logic: `server/replit_integrations/auth/replitAuth.ts`
  - `getSession()`
  - `setupAuth()`
  - `upsertUser()`
  - `updateUserSession()`
- Routes registration: `server/replit_integrations/auth/routes.ts` (`registerAuthRoutes`)
- Session persistence abstraction: `server/replit_integrations/auth/storage.ts` (`AuthStorage`, `IAuthStorage`)

**Developer notes**
- Treat Replit auth as an environment adapter; do not assume it exists in all deployments.
- Avoid duplicating auth logic in individual routes—use centralized middleware/guards where available.

### Stateless API sessions (JWT)

API authentication is designed to be **stateless** (JWT-based), supporting horizontal scaling.

**Operational guidance**
- Always terminate TLS at the edge.
- Rotate signing secrets regularly (and invalidate sessions when needed).

---

## Authorization

Authorization is implemented using **role-based access control (RBAC)** plus resource-level permissions.

### Account-level RBAC (team & administration)

Roles are defined in the schema:

- Role model: `shared/schema.ts` (`AccountRole`)
- Membership model: `shared/schema.ts` (`AccountMember`, `AccountWithRole`, `AccountWithDetails`)

Typical role expectations:
- **Owner/Admin**: manage team, billing, account-wide settings.
- **Member**: limited to scoped resources and permitted actions.

**Developer notes**
- Always enforce role checks server-side for:
  - billing configuration changes
  - team membership/invitation actions
  - account-wide settings changes
  - access key management

### Resource-level permissions (object storage)

Object storage access is scoped with per-bucket permissions:

- Permission model: `shared/schema.ts` (`BucketPermission`)

This allows fine-grained control such as Read/Write/Delete per bucket (exact permission flags depend on schema and implementation).

**Developer notes**
- Resource authorization must combine:
  1. the acting member’s role, and
  2. explicit resource permissions (when applicable).
- Avoid using bucket names alone as authorization boundaries—always include the tenant/account context.

---

## Programmatic Access (Access Keys)

For non-interactive integrations and automation, PrimeCloudProV2 uses access keys:

- Key model: `shared/schema.ts` (`AccessKey`)
- Creation payload type: `shared/schema.ts` (`CreateAccessKeyRequest`)

**Security properties**
- Access keys enable programmatic access without exposing user credentials.
- Keys should be revocable immediately as part of incident response.

**Operational guidance**
- Enforce:
  - minimum required scopes/permissions
  - rotation policies
  - usage monitoring (via audit logs)

---

## Tenant Isolation

Tenant isolation is a core requirement across:

- **Storage** (MinIO buckets, object operations)
- **SFTP access** (SFTPGo users and virtual folders)
- **Billing and invoices**
- **Audit data visibility**

Isolation should be enforced at:
- the **database query layer** (account scoping in all queries),
- the **service layer** (MinIO/SFTPGo operations require account context),
- and the **API boundary** (authorization middleware/guards).

Related services:
- Object storage service: `server/services/minio.service.ts` (`MinioService`)
- SFTP provisioning service: `server/services/sftpgo.service.ts` (`SftpGoService`)

---

## Secrets & Sensitive Data

### Secrets management

Secrets are expected to be stored in environment variables or secure runtime configuration:

- Database connection strings
- MinIO credentials
- SFTPGo admin credentials
- Auth secrets (JWT signing / provider secrets)
- SMTP credentials (if configured)

Related SMTP route handlers:
- `server/routes/smtp.ts` (`handleConfigureSMTP`, `handleTestSMTP`)

**Developer notes**
- Never commit secrets to the repository.
- Avoid logging secrets or raw tokens; sanitize logs where possible.
- Ensure production uses least-privileged service accounts for MinIO/SFTPGo.

### Secure credential generation (SFTPGo)

SFTP user provisioning uses secure password generation:

- Password generator: `server/services/sftpgo.service.ts` (`generateSecurePassword`)
- Service: `server/services/sftpgo.service.ts` (`SftpGoService`)

**Developer notes**
- Prefer generated high-entropy secrets over user-chosen passwords for service accounts.
- Treat generated credentials as secrets: do not log; display only once if necessary.

### PII validation (CPF/CNPJ)

Brazilian tax IDs are validated before processing:

- Server validation: `server/lib/document-validation.ts`
  - `isValidCPF()`
  - `isValidCNPJ()`
  - `validateDocument()`
- Client helpers/formatters: `client/src/lib/document-validation.ts`

**Security purpose**
- Prevents malformed/invalid identifiers from entering billing and compliance workflows.
- Reduces risk of injection-like edge cases through strict normalization/validation.

**Developer notes**
- Validation is not encryption; protect PII at rest and in logs.
- Avoid returning full PII values in responses unless required.

---

## Encryption

### Data in transit

All traffic between:
- client ↔ API,
- API ↔ MinIO,
- API ↔ SFTPGo,
should use **TLS 1.2+**.

**Operational guidance**
- Enforce HTTPS-only cookies where applicable.
- Prefer HSTS at the edge.

### Data at rest

- **Object storage**: `MinioService` supports server-side encryption (SSE) when configured.
- **Database**: sensitive billing records and customer/invoice data rely on database access controls; consider encryption-at-rest at the infrastructure layer.

**Developer notes**
- Encryption features depend on deployment configuration; document your environment’s SSE/KMS settings.

---

## Audit Logging & Monitoring

PrimeCloudProV2 uses an audit trail as the backbone of security monitoring and compliance.

### Audit service

- Service: `server/services/audit.service.ts`
  - `AuditService`
  - `AuditSeverity`
  - `AuditContext`
  - `AuditDetails`

- Storage model: `shared/schema.ts` (`AuditLog`)
- Client-side querying: `client/src/hooks/use-audit-logs.ts`
  - `AuditLog`
  - `AuditLogFilters`

**What should be audited**
Ensure sensitive operations emit audit events, including (at minimum):
- authentication/session events (where applicable)
- account/team changes (members, invitations, role changes)
- access key creation/revocation
- bucket creation/deletion and permission changes
- object sharing / tag changes if they affect access
- billing config changes, invoice generation, and payment-related actions
- SMTP configuration changes

**Developer notes**
- Include enough context for incident response:
  - who performed the action
  - which account/tenant it affected
  - what changed (before/after where safe)
  - source IP / user agent if available
  - timestamp and severity
- Avoid storing secrets or full tokens in audit details.

---

## Compliance & Data Governance

PrimeCloudProV2 includes controls that support compliance programs (LGPD/GDPR readiness):

- **Auditability**: complete traceability via `AuditService` and persisted `AuditLog`.
- **Retention management**: lifecycle rules can support retention policies:
  - `shared/schema.ts` (`LifecycleRule`)
- **Non-repudiation for billing artifacts**: invoices and usage records are designed to be persisted in a stable manner once generated (implementation details depend on billing workflows).

Related billing components:
- `server/services/billing.service.ts` (`BillingService`)
- Usage collection and monthly billing jobs: `server/cron/usage-collector.ts`
  - `collectUsageMetrics()`
  - `runMonthlyBilling()`
  - `checkOverdueInvoices()`
  - `startCronJobs()`, `stopCronJobs()`

**Developer notes**
- “Read-only after generation” should be enforced by:
  - immutable database patterns where feasible
  - strict role authorization
  - audit logging for any administrative overrides

---

## Incident Response Playbook (Practical)

When responding to suspicious activity:

1. **Detect**
   - Query audit logs for anomalies using `AuditLogFilters`.
   - Look for repeated failures, unusual IPs, high-risk admin actions, or spikes in access key usage.

2. **Triage**
   - Identify affected account(s), member(s), and resources (buckets, access keys).
   - Correlate by time window and severity.

3. **Contain**
   - Revoke impacted access keys (via AccessKey management endpoints).
   - Suspend/disable suspicious memberships (`AccountMember` status/role changes).
   - Rotate secrets if a service credential may be compromised (MinIO/SFTPGo/SMTP/JWT secrets).

4. **Eradicate & Recover**
   - Patch the underlying issue (auth bypass, mis-scoped queries, missing RBAC check).
   - Restore correct permissions and validate tenant boundaries.

5. **Post-incident**
   - Export relevant `AuditLog` records for forensics.
   - Document timeline, impact, and remediation.
   - Add regression tests and new audit events if gaps were found.

---

## Developer Checklist (Security)

Use this as a quick review guide when adding features:

- [ ] All endpoints enforce authentication and derive identity server-side.
- [ ] All queries are scoped by account/tenant.
- [ ] RBAC checks exist for account-wide operations.
- [ ] Resource-level permissions are enforced for storage actions.
- [ ] Sensitive actions emit audit logs with appropriate severity.
- [ ] No secrets/PII are logged or returned unnecessarily.
- [ ] Inputs are validated (especially billing/PII).
- [ ] TLS is required for any external service integration.

---

## Related Files & Entry Points

- **Audit logging**: `server/services/audit.service.ts`, `shared/schema.ts` (`AuditLog`), `client/src/hooks/use-audit-logs.ts`
- **Auth (Clerk client)**: `client/src/lib/queryClient.ts`
- **Auth (Replit integration)**: `server/replit_integrations/auth/*`
- **Object storage**: `server/services/minio.service.ts`, `shared/schema.ts` (`Bucket`, `BucketPermission`)
- **SFTP provisioning**: `server/services/sftpgo.service.ts`
- **Billing & usage jobs**: `server/services/billing.service.ts`, `server/cron/usage-collector.ts`
- **Document validation (CPF/CNPJ)**: `server/lib/document-validation.ts`, `client/src/lib/document-validation.ts`
