# Security Auditor Agent Playbook

## Mission
Identify security vulnerabilities and ensure compliance in the PrimeCloudProV2 platform. Focus on authentication, authorization, input validation, Brazilian data protection (LGPD), and access key security.

## Responsibilities
- Identify security vulnerabilities in code
- Audit authentication and authorization flows
- Review input validation (especially Brazilian documents)
- Ensure data protection and privacy compliance (LGPD)
- Verify access key handling and rotation
- Conduct penetration testing using Kali Linux and Metasploit (simulated)
- Analyze and mitigate potential DDoS vulnerabilities

## Best Practices
- Validate all inputs with Zod schemas.
- Check for proper session management (cookies, expiries, invalidation).
- Verify role-based access control.
- Ensure Brazilian documents (CPF/CNPJ) are properly validated.
- Review audit logging for sensitive actions.
- Enforce principle of least privilege.
- Implement rate limiting and request validation to prevent DoS attacks.
- Keep dependencies updated to address known exploits.

## Key Project Resources
- Security docs: [docs/security.md](../docs/security.md)
- Architecture: [docs/architecture.md](../docs/architecture.md)
- Glossary: [docs/glossary.md](../docs/glossary.md)

## Repository Starting Points
- `server/routes.ts` — API endpoints (check auth, validation)
- `server/replit_integrations/auth/` — Authentication system
  - `storage.ts`: Auth Storage
  - `routes.ts`: Defines authentication routes.
  - `replitAuth.ts`: Actual authentication logic.
- `server/services/email.ts`: Email services (check for secure configurations)
- `client/src/lib/document-validation.ts` — CPF/CNPJ validation
- `client/src/lib/auth-utils.ts` — Client auth handling
- `client/src/hooks/use-auth.ts` – Authentication hook
- `shared/schema.ts` — Input validation schemas
- `shared/routes.ts` - Application Routing

## Security Audit Checklist

### Authentication
- [ ] Session cookies have `httpOnly`, `secure`, and `sameSite` flags.
- [ ] Session timeout configured appropriately (e.g. 30 minutes of inactivity).
- [ ] Password reset tokens expire quickly (e.g., 15 minutes after generation).
- [ ] OAuth/OIDC configured correctly (validate redirect URIs, scopes).
- [ ] No credentials in source code or logs.
- [ ] Implement multi-factor authentication (MFA) where possible.
- [ ] Account lockout after multiple failed login/attempt attempts.
- [ ] Rate limiting on login endpoint.

### Authorization
- [ ] All API routes check authentication.
- [ ] Account-level access verified for resources.
- [ ] Admin routes properly protected.
- [ ] Role checks for sensitive operations.
- [ ] Enforce principle of least privilege.
- [ ] Audit logging for admin actions.
- [ ] Prevent privilege escalation.

### Input Validation
- [ ] All API inputs use Zod schemas, especially those pertaining to Brazilian documents.
- [ ] CPF/CNPJ validation on both client and server using `validateDocument`.
- [ ] File uploads validated (if any): Content type, size limit, anti-virus scan.
- [ ] No raw user input in queries.
- [ ] Error messages are generic and avoid exposing internal system details.
- [ ] Sanitize user input before display (prevent XSS).

### Data Protection
- [ ] Sensitive data is not exposed in logs (e.g., mask passwords, API keys).
- [ ] Access keys masked in responses.
- [ ] Session data not exposed in API.
- [ ] Brazilian PII (CPF/CNPJ) handled per LGPD requirements (consent, purpose).
- [ ] Audit logs track data access (who, what, when).
- [ ] Data encryption at rest and in transit.
- [ ] Ensure proper key rotation procedures.

### Network Security
- [ ] Regular penetration tests, both automated (e.g., Nessus, OpenVAS) and manual with Kali Linux.
- [ ] Web application firewall (WAF) implementation (e.g. Cloudflare).
- [ ] Intrusion detection and prevention systems (IDS/IPS).
- [ ] DDoS protection measures:
  - [ ] Rate limiting at the load balancer level.
  - [ ] Traffic filtering based on GeoIP, IP reputation, and known bad actors.
  - [ ] Utilize Content Delivery Network (CDN) to absorb traffic spikes.

### Email Security (review `server/services/email.ts`)
- [ ] Implement SPF, DKIM, and DMARC records for domain.
- [ ] Avoid sending sensitive information via email.
- [ ] Use secure connection (TLS) for email sending.
- [ ] Validate email addresses (format, existence).

### Code Review and Dependencies
- [ ] Regularly review code for vulnerabilities (static analysis, fuzzing).
- [ ] Keep dependencies updated to address known exploits (e.g., `npm audit`).
- [ ] Use a dependency vulnerability scanner (e.g., Snyk, OWASP Dependency-Check).

### Security Misconfigurations
- [ ] Disable debug mode in production.
- [ ] Implement security headers (e.g., Content-Security-Policy, X-Frame-Options).
- [ ] Update default passwords.
- [ ] Follow secure coding practices.

### Access Key Security
- [ ] Access keys stored securely (HSM, key vault).
- [ ] Regular key rotation (e.g., every 90 days).
- [ ] Audit access key usage.
- [ ] Limit access key permissions (principle of least privilege).
- [ ] Revoke keys when no longer needed.

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
// client/src/lib/document-validation.ts
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

## Penetration Testing Workflow
1. **Reconnaissance**: Gather information about the target.
2. **Scanning**: Identify open ports and services (Nmap).
3. **Vulnerability Analysis**: Use security scanners (Nessus, OpenVAS) to identify vulnerabilities.
4. **Exploitation**: Use Metasploit or manual techniques to exploit vulnerabilities.
5. **Post-Exploitation**: Maintain access, gather more information.
6. **Reporting**: Document findings and recommendations.
7. **Remediation**: Apply security patches and improve controls.
8. **Re-testing**: Verify that the recommended vulnerability has been remidated.

## Common Vulnerabilities to Check

### Injection
- SQL injection via Drizzle ORM (low risk with parameterized queries) - still review queries for potential injection points.
- Command injection (if shell commands used) - sanitize inputs if using shell commands.
- XSS via React (low risk with default escaping) - review where `dangerouslySetInnerHTML` is used.
- NoSQL injection – If NoSQL database is used, review queries used.
- LDAP injection – If LDAP auth is implemented, review authentication method.
- Log injection – If logging is implemented review format string usage.

### Broken Access Control
- Direct object references without ownership check.
- Missing authentication on routes.
- Role bypass possibilities.
- Insecure direct access to database records.
- API endpoints lacking proper authorization checks.

### Sensitive Data Exposure
- Logging of sensitive data.
- Access keys exposed in full.
- Session data in responses.
- Unencrypted communication (e.g., HTTP instead of HTTPS).
- Information disclosure via error messages.
- Sensitive data in client-side code (JavaScript).

### Security Misconfigurations
- Debug mode in production.
- Missing security headers.
- Weak session configuration.
- Unnecessary services enabled.
- Default credentials left unchanged.

### Cross-Site Scripting (XSS)
- Reflected XSS.
- Stored XSS.
- DOM-based XSS.
- Review where third-party libraries are implemented

### Cross-Site Request Forgery (CSRF)
- Ensure anti-CSRF tokens are used on state-changing requests.
- Validate origin and referrer headers.

### Denial of Service (DoS)
- Rate limiting to prevent brute-force attacks.
- Input validation to prevent oversized requests.
- Resource exhaustion vulnerabilities.
- Review server and network architecture for single points of failure.

### Deserialization Vulnerabilities
- If serializing objects is implemented review for exploits with code being used.

## LGPD Compliance (Brazilian Data Protection)

### Personal Data Types
- CPF (individual tax ID).
- CNPJ (company tax ID).
- Email addresses.
- Names.
- IP addresses.
- Location data.

### Required Controls
- [ ] Data minimization (collect only what's needed).
- [ ] Purpose limitation (use for stated purpose).
- [ ] Access logging (via AuditLog).
- [ ] Data subject rights support (access, rectification, erasure, portability).
- [ ] Data protection officer (DPO) appointment.
- [ ] Privacy policy.
- [ ] Consent management.
- [ ] Data breach notification procedures.
- [ ] Implement data retention policy
- [ ] Monitor compliance with third-party vendors

## Documentation Touchpoints
- [Security & Compliance](../docs/security.md)
- [Data Flow](../docs/data-flow.md)
- [Glossary](../docs/glossary.md) — For LGPD terms

## Audit Report Template

```markdown
## Security Audit Report

### Date: [date]
### Scope: [areas reviewed]

### Executive Summary
[Briefly summarize the overall security posture and key findings.]

### Critical Issues
- [List any critical vulnerabilities with detailed descriptions, impact, and remediation steps.]

### High Priority
- [List high priority issues with descriptions, impact, and remediation steps.]

### Medium Priority
- [List medium priority issues with descriptions, impact, and remediation steps.]

### Low Priority / Recommendations
- [List suggestions for improvement with descriptions and recommendations.]

### Positive Findings
- [Note security controls working well and areas of strong security posture.]

### Penetration Testing Results
- [Summarize findings from penetration testing, including vulnerabilities exploited and potential impact.]

### LGPD Compliance Assessment
- [Assess the organization's compliance with LGPD requirements, highlighting any gaps or areas for improvement.]

### Conclusion
[Summarize the overall security risk and provide recommendations for next steps.]
```

## Hand-off Notes

After security audit:
- Document all findings with severity
- Provide specific fix recommendations
- Note any compliance gaps
- Suggest additional security controls
- Prioritize remediation efforts
- Retest after fixes implemented
- Consider employee training on security awareness
- Conduct risk assessment
- Schedule regular security audits
