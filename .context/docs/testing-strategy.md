---
status: filled
generated: 2026-01-18
---

# Testing Strategy

Document how quality is maintained across the codebase.

## Current State

> **Note**: No test framework is currently configured in the project. This document outlines recommended testing strategies for future implementation.

## Recommended Test Setup

### Unit Testing Framework
- **Recommended**: Vitest (native Vite integration)
- **Alternative**: Jest with TypeScript support

### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
  },
});
```

## Test Types

### Unit Tests
- **Target**: Utility functions, hooks, components
- **Location**: Co-located with source files (`*.test.ts`)
- **Priority files**:
  - `client/src/lib/document-validation.ts` - CPF/CNPJ validation
  - `server/lib/document-validation.ts` - Server-side validation
  - `shared/routes.ts` - URL builder functions

### Integration Tests
- **Target**: API routes with database
- **Setup**: Test database with migrations
- **Focus**:
  - Account CRUD operations
  - Bucket management
  - Access key lifecycle

### Component Tests
- **Target**: React components
- **Tools**: React Testing Library
- **Focus**:
  - Form submissions
  - Error states
  - Loading states

## Key Test Scenarios

### Document Validation
```typescript
describe('CPF Validation', () => {
  test('validates correct CPF', () => {
    expect(isValidCPF('123.456.789-09')).toBe(true);
  });

  test('rejects invalid CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });
});
```

### API Endpoints
```typescript
describe('Account API', () => {
  test('creates account with valid data', async () => {
    const response = await api.post('/api/accounts', validAccountData);
    expect(response.status).toBe(201);
  });

  test('rejects invalid CNPJ', async () => {
    const response = await api.post('/api/accounts', { cnpj: 'invalid' });
    expect(response.status).toBe(400);
  });
});
```

### Custom Hooks
```typescript
describe('useAccounts', () => {
  test('fetches accounts on mount', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

## Quality Gates

### Type Safety
- Run `npm run check` before commits
- TypeScript strict mode enabled
- No `any` types without justification

### Code Review
- All PRs require review
- Focus on:
  - Type correctness
  - Schema validation
  - Error handling

## Running Tests (Future)

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test -- --coverage

# Specific file
npm run test document-validation
```

## Recommended Coverage Targets

| Category | Target |
|----------|--------|
| Utilities | 90% |
| Validation | 100% |
| API Routes | 80% |
| Components | 70% |

## Troubleshooting

### Common Issues
- **Database connection**: Ensure test database is configured
- **Session mocking**: Mock `express-session` for route tests
- **React Query**: Wrap components in `QueryClientProvider`

### Test Database Setup
```bash
# Create test database
createdb primecloudpro_test

# Push schema
DATABASE_URL=postgres://...test npm run db:push
```
