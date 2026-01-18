---
status: filled
generated: 2026-01-18
---

# Security & Compliance Notes

Capture the policies and guardrails that keep this project secure and compliant.

## Authentication & Authorization

### Authentication Methods
- **Local Authentication**: Passport.js with local strategy (username/password)
- **OpenID Connect**: OAuth 2.0 / OIDC support via `openid-client`
- **Session Management**: Express sessions with PostgreSQL store (`connect-pg-simple`)

### Authorization Model
- **Role-based Access Control (RBAC)**: Members have roles within accounts
- **Account-level Permissions**: Actions scoped to specific accounts
- **Admin Privileges**: Special admin routes for account approval, quota management

### Session Security
- Sessions stored in PostgreSQL for persistence and scalability
- Memory store available as fallback (`memorystore`)
- Session cookies with appropriate security flags

## Access Control

### Account Membership
- Users can belong to multiple accounts
- Each membership has an associated role
- Account owners can invite/remove members
- Role updates tracked via audit logs

### API Access Keys
- Programmatic access via access keys
- Key rotation support (`useRotateAccessKey`)
- Toggle active/inactive state
- Revocation capability

## Secrets & Sensitive Data

### Storage Locations
- Database connection strings in environment variables
- Session secrets in environment configuration
- Email service credentials in environment

### Data Classifications
| Data Type | Classification | Storage |
|-----------|---------------|---------|
| User credentials | Sensitive | Database (hashed) |
| Session tokens | Sensitive | PostgreSQL store |
| Access keys | Sensitive | Database |
| Brazilian documents (CPF/CNPJ) | PII | Database |

### Document Validation
Brazilian document validation implemented in both client and server:
- CPF validation: `isValidCPF()`
- CNPJ validation: `isValidCNPJ()`
- Format helpers: `formatCPF()`, `formatCNPJ()`

## Compliance & Policies

### Brazilian Data Protection (LGPD)
- CPF/CNPJ are considered personal data
- Proper validation before storage
- Audit logging for data access

### Audit Trail
- All significant actions logged via `AuditLog`
- Tracks: action type, user, timestamp, affected resources
- Queryable via `useAuditLogs` hook

## Security Best Practices

### Input Validation
- Zod schemas for all API inputs
- Type-safe request/response handling
- Client-side and server-side validation

### API Security
- Express.js middleware for authentication
- Route-level authorization checks
- Error handling without information leakage

### Frontend Security
- React escapes output by default (XSS protection)
- Type-safe routing with `buildUrl()`
- Secure API request helpers

## Incident Response

### Logging
- Server logging via custom `log()` function
- Structured log output for monitoring

### Response Steps
1. Identify affected accounts/users
2. Check audit logs for suspicious activity
3. Revoke compromised access keys
4. Suspend affected accounts if necessary
5. Notify affected users

## Security Checklist

- [ ] Environment variables configured securely
- [ ] Database connection uses SSL in production
- [ ] Session cookies have secure flags
- [ ] Access keys rotated regularly
- [ ] Audit logs monitored
- [ ] Brazilian document data encrypted at rest
