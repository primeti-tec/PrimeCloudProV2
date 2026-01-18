---
name: Test Writer
description: Write tests for the PrimeCloudProV2 platform
status: filled
generated: 2026-01-18
---

# Test Writer Agent Playbook

## Mission
Write comprehensive unit and integration tests for the PrimeCloudProV2 platform. Focus on testing validation logic, API endpoints, React hooks, and Brazilian document handling.

## Responsibilities
- Write unit tests for utility functions and validation
- Create integration tests for API endpoints
- Test React hooks and components
- Ensure edge cases are covered (especially CPF/CNPJ)
- Maintain test fixtures and utilities

## Best Practices
- Use Vitest for native Vite integration
- Test both happy paths and error cases
- Mock external dependencies appropriately
- Write descriptive test names

## Repository Starting Points
- `client/src/lib/` — Utility functions to test (validation, auth)
- `server/lib/` — Server-side utilities (document validation)
- `server/routes.ts` — API endpoints to integration test
- `client/src/hooks/` — React hooks to test
- `shared/schema.ts` — Zod schemas to validate

## Priority Test Targets

### 1. Document Validation (Critical)
```typescript
// client/src/lib/document-validation.test.ts
import { isValidCPF, isValidCNPJ, formatCPF, formatCNPJ } from './document-validation';

describe('CPF Validation', () => {
  test('validates correct CPF', () => {
    expect(isValidCPF('123.456.789-09')).toBe(true);
    expect(isValidCPF('12345678909')).toBe(true);
  });

  test('rejects invalid CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('invalid')).toBe(false);
  });

  test('formats CPF correctly', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });
});

describe('CNPJ Validation', () => {
  test('validates correct CNPJ', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });

  test('rejects invalid CNPJ', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
  });
});
```

### 2. URL Building
```typescript
// shared/routes.test.ts
import { buildUrl } from './routes';

describe('buildUrl', () => {
  test('builds URL with parameters', () => {
    const url = buildUrl('/api/accounts/:id', { id: '123' });
    expect(url).toBe('/api/accounts/123');
  });
});
```

### 3. React Hooks
```typescript
// client/src/hooks/use-accounts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAccounts } from './use-accounts';

describe('useAccounts', () => {
  test('fetches accounts on mount', async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: QueryClientProvider,
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

### 4. API Endpoints
```typescript
// server/routes.test.ts
describe('Account API', () => {
  test('POST /api/accounts validates CNPJ', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send({ name: 'Test', cnpj: 'invalid' });
    expect(response.status).toBe(400);
  });

  test('POST /api/accounts creates with valid data', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send({ name: 'Test Corp', cnpj: '11.222.333/0001-81' });
    expect(response.status).toBe(201);
  });
});
```

## Test Configuration

### Vitest Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```

## Documentation Touchpoints
- [Testing Strategy](../docs/testing-strategy.md)
- [Development Workflow](../docs/development-workflow.md)

## Hand-off Notes

After writing tests:
- Verify all tests pass
- Check coverage for critical paths
- Document any mocking requirements
- Note flaky tests if any
