---
name: Refactoring Specialist
description: Improve PrimeCloudProV2 code structure
status: filled
generated: 2026-01-18
---

# Refactoring Specialist Agent Playbook

## Mission
Identify and improve code structure in the PrimeCloudProV2 platform. Focus on reducing duplication, improving type safety, and maintaining established patterns.

## Responsibilities
- Identify code smells and improvement opportunities
- Refactor while maintaining functionality
- Improve code organization and structure
- Extract reusable utilities and components

## Best Practices
- Make small, incremental changes
- Verify TypeScript types pass after each change (`npm run check`)
- Preserve existing functionality exactly
- Follow established patterns

## Repository Starting Points
- `client/src/hooks/` — React hooks (check for duplication)
- `server/storage.ts` — Database layer (optimize methods)
- `client/src/components/` — UI components (extract shared)
- `shared/schema.ts` — Types (consolidate similar)

## Common Refactoring Opportunities

### 1. Hook Consolidation
```typescript
// BEFORE: Duplicated patterns
export function useCreateAccount() { return useMutation({...}); }
export function useCreateBucket() { return useMutation({...}); }

// AFTER: Generic factory
function createMutationHook<T>(endpoint: string) {
  return function() {
    return useMutation({
      mutationFn: (data: T) => apiRequest(endpoint, { method: 'POST', body: data }),
    });
  };
}
```

### 2. Component Extraction
```typescript
// Extract common patterns into reusable components
// e.g., DataTable, EmptyState, LoadingSpinner
```

### 3. Type Improvements
```typescript
// BEFORE: Loose types
function handleAccount(account: any) {...}

// AFTER: Proper types from schema
import { Account } from '@shared/schema';
function handleAccount(account: Account) {...}
```

### 4. Storage Method Optimization
```typescript
// Look for N+1 query patterns in storage.ts
// Use Drizzle's `with` for eager loading
```

## Code Smell Checklist

### Duplication
- [ ] Similar hook implementations
- [ ] Repeated form validation logic
- [ ] Copy-pasted error handling

### Complexity
- [ ] Long functions (>50 lines)
- [ ] Deeply nested conditionals
- [ ] Complex type assertions

### Type Issues
- [ ] Use of `any` type
- [ ] Missing return types
- [ ] Inconsistent null handling

## Established Patterns to Preserve

1. **Schema-first**: Zod schemas in `shared/schema.ts`
2. **Storage interface**: All DB ops through `IStorage`
3. **React hooks**: Custom hooks for data fetching
4. **Component library**: Radix UI components

## Documentation Touchpoints
- [Architecture](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)

## Hand-off Notes

After refactoring:
- Run `npm run check` for type safety
- Test affected features manually
- Document any pattern changes
- Update relevant documentation
