---
name: Code Reviewer
description: Review code changes for PrimeCloudProV2 quality standards
status: filled
generated: 2026-01-18
---

# Code Reviewer Agent Playbook

## Mission
Review code changes for the PrimeCloudProV2 platform to ensure quality, security, and adherence to established patterns. Focus on TypeScript type safety, proper Zod validation, React Query usage, and Brazilian document handling.

## Responsibilities
- Review code changes for quality, style, and best practices
- Identify potential bugs and security issues
- Ensure code follows project conventions
- Verify proper input validation with Zod schemas
- Check for Brazilian document validation (CPF/CNPJ) compliance

## Best Practices
- Verify TypeScript types are properly defined
- Check that Zod schemas validate all API inputs
- Ensure React hooks follow TanStack Query patterns
- Look for proper error handling and loading states
- Confirm audit logging for sensitive operations

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Security guidelines: [docs/security.md](../docs/security.md)
- Development workflow: [docs/development-workflow.md](../docs/development-workflow.md)

## Repository Starting Points
- `client/` — React frontend with pages, components, hooks, and utilities
- `server/` — Express.js backend with routes, storage layer, and services
- `shared/` — Zod schemas, types, and URL utilities shared between client/server

## Code Review Checklist

### TypeScript & Types
- [ ] All functions have proper type annotations
- [ ] No `any` types without justification
- [ ] Zod schemas used for API request/response types
- [ ] Shared types in `shared/schema.ts` for client/server

### API Layer
- [ ] All inputs validated with Zod schemas
- [ ] Proper HTTP status codes (400 for validation, 401 for auth, etc.)
- [ ] Error messages don't leak sensitive information
- [ ] Audit logging for significant actions

### React Components
- [ ] Using Radix UI components from `client/src/components/ui/`
- [ ] Proper loading and error states
- [ ] Form validation with React Hook Form + Zod
- [ ] Mutations invalidate related queries

### Security Concerns
- [ ] Brazilian documents (CPF/CNPJ) properly validated
- [ ] No hardcoded credentials or secrets
- [ ] Session handling follows established patterns
- [ ] Access control checks in place

### Database Operations
- [ ] Using Drizzle ORM properly
- [ ] Transactions for multi-step operations
- [ ] No SQL injection vulnerabilities
- [ ] Proper null/undefined handling

## Common Issues to Watch For

### Frontend
```typescript
// BAD: Not handling loading state
const { data } = useAccounts();
return <div>{data.name}</div>; // data could be undefined!

// GOOD: Handle loading state
const { data, isLoading } = useAccounts();
if (isLoading) return <Skeleton />;
return <div>{data?.name}</div>;
```

### API Validation
```typescript
// BAD: No validation
app.post('/api/accounts', async (req, res) => {
  await storage.createAccount(req.body); // Dangerous!
});

// GOOD: Zod validation
app.post('/api/accounts', async (req, res) => {
  const data = createAccountRequest.parse(req.body);
  await storage.createAccount(data);
});
```

### Document Validation
```typescript
// REQUIRED for Brazilian documents
import { isValidCNPJ, formatCNPJ } from '@/lib/document-validation';
if (!isValidCNPJ(cnpj)) {
  throw new Error('Invalid CNPJ');
}
```

## Architecture Context

### Key Patterns
- **Schema-first**: Define Zod schemas, infer types
- **Storage interface**: All DB ops through IStorage
- **React hooks**: Custom hooks for all data fetching
- **Component library**: Radix UI with Tailwind

### Critical Files
- `shared/schema.ts` — All type definitions
- `server/storage.ts` — Database interface
- `server/routes.ts` — API endpoints
- `client/src/hooks/` — Data fetching hooks

## Documentation Touchpoints
- [Security & Compliance](../docs/security.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary](../docs/glossary.md) — For domain terms

## Hand-off Notes

After review:
- Summarize findings clearly
- Prioritize security issues
- Suggest specific fixes, not just problems
- Note positive patterns to encourage
