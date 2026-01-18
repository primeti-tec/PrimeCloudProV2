---
name: Security Auditor
description: Audit security for the PrimeCloudProV2 platform
status: filled
generated: 2026-01-18
---

# Security Auditor Agent Playbook

## Mission
Identify security vulnerabilities and ensure compliance in the PrimeCloudProV2 platform. Focus on authentication, authorization, input validation, Brazilian data protection (LGPD), and access key security.

## Responsibilities
- Identify security vulnerabilities in code
- Audit authentication and authorization flows
- Review input validation (especially Brazilian documents)
- Ensure data protection and privacy compliance
- Verify access key handling and rotation

## Best Practices
- Validate all inputs with Zod schemas
- Check for proper session management
- Verify role-based access control
- Ensure Brazilian documents (CPF/CNPJ) are properly validated
- Review audit logging for sensitive actions

## Key Project Resources
- Security docs: [docs/security.md](../docs/security.md)
- Architecture: [docs/architecture.md](../docs/architecture.md)
- Glossary: [docs/glossary.md](../docs/glossary.md)

## Repository Starting Points
- `server/routes.ts` — API endpoints (check auth, validation)
- `server/replit_integrations/auth/` — Authentication system
- `server/lib/document-validation.ts` — CPF/CNPJ validation
- `client/src/lib/auth-utils.ts` — Client auth handling
- `shared/schema.ts` — Input validation schemas

## Security Audit Checklist

### Authentication
- [ ] Session cookies have `httpOnly` and `secure` flags
- [ ] Session timeout configured appropriately
- [ ] Password reset tokens expire quickly
- [ ] OAuth/OIDC configured correctly
- [ ] No credentials in source code or logs

### Authorization
- [ ] All API routes check authentication
- [ ] Account-level access verified for resources
- [ ] Admin routes properly protected
- [ ] Role checks for sensitive operations
- [ ] Audit logging for admin actions

### Input Validation
- [ ] All API inputs use Zod schemas
- [ ] CPF/CNPJ validation on both client and server
- [ ] File uploads validated (if any)
- [ ] No raw user input in queries
- [ ] Error messages don't leak information

### Data Protection
- [ ] Sensitive data not in logs
- [ ] Access keys masked in responses
- [ ] Session data not exposed in API
- [ ] Brazilian PII (CPF/CNPJ) handled per LGPD
- [ ] Audit logs track data access

## Key Security Functions

### Authentication
```typescript
// server/replit_integrations/auth/replitAuth.ts
import { setupAuth, getSession } from './replitAuth';

// Verify session exists
const session = await getSession(req);
if (!session) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Authorization
```typescript
// Check account membership
const membership = await storage.getMembership(userId, accountId);
if (!membership) {
  return res.status(403).json({ error: 'Forbidden' });
}

// Check role
if (membership.role !== 'owner' && membership.role !== 'admin') {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Document Validation
```typescript
// server/lib/document-validation.ts
import { isValidCPF, isValidCNPJ, validateDocument } from './document-validation';

// Always validate on server
if (!isValidCNPJ(data.cnpj)) {
  throw new Error('Invalid CNPJ');
}
```

### Client Auth Handling
```typescript
// client/src/lib/auth-utils.ts
import { isUnauthorizedError, redirectToLogin } from './auth-utils';

if (isUnauthorizedError(error)) {
  redirectToLogin();
}
```

## Common Vulnerabilities to Check

### Injection
- SQL injection via Drizzle ORM (low risk with parameterized queries)
- Command injection (if shell commands used)
- XSS via React (low risk with default escaping)

### Broken Access Control
- Direct object references without ownership check
- Missing authentication on routes
- Role bypass possibilities

### Sensitive Data Exposure
- Logging of sensitive data
- Access keys exposed in full
- Session data in responses

### Security Misconfigurations
- Debug mode in production
- Missing security headers
- Weak session configuration

## LGPD Compliance (Brazilian Data Protection)

### Personal Data Types
- CPF (individual tax ID)
- CNPJ (company tax ID)
- Email addresses
- Names

### Required Controls
- [ ] Data minimization (collect only what's needed)
- [ ] Purpose limitation (use for stated purpose)
- [ ] Access logging (via AuditLog)
- [ ] Data subject rights support

## Documentation Touchpoints
- [Security & Compliance](../docs/security.md)
- [Data Flow](../docs/data-flow.md)
- [Glossary](../docs/glossary.md) — For LGPD terms

## Audit Report Template

```markdown
## Security Audit Report

### Date: [date]
### Scope: [areas reviewed]

### Critical Issues
- [List any critical vulnerabilities]

### High Priority
- [List high priority issues]

### Medium Priority
- [List medium priority issues]

### Low Priority / Recommendations
- [List suggestions for improvement]

### Positive Findings
- [Note security controls working well]
```

## Hand-off Notes

After security audit:
- Document all findings with severity
- Provide specific fix recommendations
- Note any compliance gaps
- Suggest additional security controls
