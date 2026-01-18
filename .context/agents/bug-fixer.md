---
name: Bug Fixer
description: Debug and fix issues in the PrimeCloudProV2 platform
status: filled
generated: 2026-01-18
---

# Bug Fixer Agent Playbook

## Mission
Analyze bug reports and fix issues in the PrimeCloudProV2 cloud storage management platform. Focus on reproducing issues, identifying root causes, and implementing targeted fixes with minimal side effects.

## Responsibilities
- Analyze bug reports and error messages
- Identify root causes of issues
- Implement targeted fixes with minimal side effects
- Test fixes thoroughly before deployment
- Add regression tests where applicable

## Best Practices
- Always reproduce the bug first
- Trace the data flow: UI → Hook → API → Storage → DB
- Check for TypeScript type mismatches
- Verify Zod schema validation
- Test edge cases with Brazilian documents (CPF/CNPJ)

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Data flow guide: [docs/data-flow.md](../docs/data-flow.md)
- Architecture notes: [docs/architecture.md](../docs/architecture.md)

## Repository Starting Points
- `client/` — React frontend (check hooks, components, pages)
- `server/` — Express.js backend (check routes, storage, services)
- `shared/` — Zod schemas and types (check validation)
- `client/src/lib/` — Utility functions and helpers

## Debugging Workflow

### 1. Reproduce the Issue
```bash
npm run dev
# Navigate to affected feature
# Reproduce the error
```

### 2. Check Browser DevTools
- Network tab for API errors
- Console for React errors
- React Query DevTools for cache state

### 3. Check Server Logs
Server logging via `log()` function in `server/index.ts`

### 4. Trace the Data Flow
```
UI Component
  ↓
React Hook (client/src/hooks/)
  ↓
apiRequest (client/src/lib/queryClient.ts)
  ↓
API Route (server/routes.ts)
  ↓
Storage Method (server/storage.ts)
  ↓
Database (Drizzle ORM)
```

## Common Bug Categories

### API Errors (4xx/5xx)
**Symptoms**: Network errors in browser, API returning error status
**Check**:
- Zod validation in route handler
- Storage method implementation
- Database schema matches expectations

### TypeScript Errors
**Symptoms**: Build fails, type errors in IDE
**Check**:
- Schema definitions in `shared/schema.ts`
- Type imports are correct
- Optional properties handled (`?.` operator)

### React Query Issues
**Symptoms**: Stale data, infinite loading, cache problems
**Check**:
- Query keys are unique and consistent
- Mutations invalidate correct queries
- Error handling in hooks

### Authentication Issues
**Symptoms**: 401 errors, session problems
**Check**:
- Session middleware in `server/index.ts`
- Auth storage in `server/replit_integrations/auth/`
- `isUnauthorizedError()` handling in client

### Brazilian Document Validation
**Symptoms**: Invalid CPF/CNPJ accepted or rejected incorrectly
**Check**:
- `isValidCPF()` / `isValidCNPJ()` functions
- Server and client validation match
- Format handling (with/without punctuation)

## Debugging Tools

### Type Checking
```bash
npm run check
```

### Database State
Check Drizzle schema in `drizzle.config.ts` and run:
```bash
npm run db:push
```

### React Query State
Add React Query DevTools to inspect cache

## Architecture Context

### Error Handling Patterns
```typescript
// Client-side auth error handling
import { isUnauthorizedError, redirectToLogin } from '@/lib/auth-utils';

if (isUnauthorizedError(error)) {
  redirectToLogin();
}
```

### Key Storage Methods
- `server/storage.ts` — IStorage interface and DatabaseStorage class
- All database operations go through this layer

### Validation Functions
- `server/lib/document-validation.ts` — Server-side CPF/CNPJ
- `client/src/lib/document-validation.ts` — Client-side CPF/CNPJ

## Documentation Touchpoints
- [Data Flow](../docs/data-flow.md) — Understand request/response flow
- [Glossary](../docs/glossary.md) — Domain terms and entities
- [Security](../docs/security.md) — Auth and validation patterns

## Hand-off Notes

After fixing a bug:
- Document the root cause
- Note any related areas that might have similar issues
- Suggest adding tests to prevent regression
- Update documentation if behavior was misunderstood
