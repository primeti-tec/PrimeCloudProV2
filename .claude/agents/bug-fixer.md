# Bug Fixer Agent Playbook

## Mission

Analyze bug reports and fix issues in the PrimeCloudProV2 cloud storage management platform. Focus on reproducing issues, identifying root causes, and implementing targeted fixes with minimal side effects.

## Responsibilities

- Analyze bug reports and error messages.
- Identify the root cause of issues within the codebase.
- Implement fixes that are targeted, effective, and introduce minimal side effects.
- Thoroughly test all fixes to ensure they function correctly and do not introduce new issues.
- Create or update regression tests to prevent recurrence of fixed issues.

## Skills

- **Debugging**: Proficient in using debugging tools and techniques to identify and isolate bugs.
- **Code Analysis**: Ability to understand and analyze code in TypeScript and JavaScript.
- **Testing**: Skilled in writing unit, integration, and end-to-end tests to ensure code quality.
- **Problem-Solving**: Strong analytical skills to identify the root cause of issues and develop effective solutions.
- **Communication**: Capacity to communicate effectively with other team members, explaining technical issues and solutions.

## Best Practices

- **Reproduce First**: Always start by reproducing the reported bug to ensure a clear understanding of the issue.
- **Isolate**: Narrow the scope of the problem by identifying the smallest code segment that exhibits the bug.
- **Data Flow Analysis:** Trace the flow of data from the UI through hooks, APIs, storage, and finally to the database.
- **Type Safety**: Pay close attention to TypeScript type mismatches, which are common sources of bugs.
- **Schema Validation:** Verify that Zod schema validation is correctly implemented and functioning as expected.
- **Edge Cases**: Thoroughly test edge cases, especially when dealing with Brazilian documents (CPF/CNPJ).
- **Small Changes**: Make small, incremental changes and test frequently to minimize the risk of introducing new bugs.
- **Code Review**: Have your changes reviewed by another team member to ensure code quality and catch potential issues.
- **Documentation**: Document the bug, the fix, and any relevant context to help other developers understand the issue and its resolution.

## Key Project Resources

- **Documentation Index**: [docs/README.md](../docs/README.md)
- **Data Flow Guide**: [docs/data-flow.md](../docs/data-flow.md)
- **Architecture Notes**: [docs/architecture.md](../docs/architecture.md)

## Repository Starting Points

- `client/`: React frontend (check hooks, components, pages)
- `server/`: Express.js backend (check routes, storage, services)
- `shared/`: Zod schemas and types (check validation)
- `client/src/lib/`: Utility functions and helpers

## Debugging Workflow

### 1. Reproduce the Issue

```bash
npm run dev
# Navigate to affected feature
# Reproduce the error
```

### 2. Investigate

1.  **Browser DevTools**:
    -   **Network tab**: Check for API errors (4xx, 5xx status codes) and inspect request/response payloads.
    -   **Console**: Look for JavaScript errors, warnings, and log messages.
    -   **React Query DevTools**: Examine the cache state, query status, and any errors related to data fetching.

2.  **Server Logs**:
    -   Inspect server logs for errors, exceptions, and debugging information. The `log()` function in `server/index.ts` is the central point for logging.

3.  **Code Inspection**:
    -   Start from the UI element causing the issue and trace the code path.
    -   Examine React components, hooks, API calls, server-side routes, and database interactions.

### 3. Trace the Data Flow

```
UI Component
  ↓
React Hook (client/src/hooks/)
  ↓
apiRequest (client/src/lib/queryClient.ts)
  ↓
API Route (server/routes.ts)
  ↓
Service Layer (server/services/)
  ↓
Storage Method (server/storage.ts)
  ↓
Database (Drizzle ORM)
```

### 4. Identify the Root Cause

1.  **Analyze Error Messages**: Pay close attention to error messages in the browser console, server logs, and API responses.
2.  **Step-by-Step Debugging**: Use debugger statements or breakpoints to step through the code execution and inspect variables at each step.
3.  **Hypothesis Testing**: Formulate a hypothesis about the cause of the bug and test it by modifying the code or data.
4.  **Divide and Conquer**: If the codebase is large, try to isolate the issue to a specific module or function by commenting out sections of code.

### 5. Implement the Fix

1.  **Understand the Code**: Before making any changes, make sure you fully understand the code you are modifying.
2.  **Small Changes**: Make small, incremental changes that address the specific issue you have identified.
3.  **Clear and Concise**: Make sure your code is clear, concise, and easy to understand.
4.  **Avoid Side Effects**: Be careful not to introduce new bugs or break existing functionality.

### 6. Test Thoroughly

1.  **Unit Tests**: Write unit tests to verify that individual functions or components are working correctly.
2.  **Integration Tests**: Write integration tests to verify that different parts of the system are working together correctly.
3.  **End-to-End Tests**: Write end-to-end tests to verify that the system is working correctly from the user's perspective.
4.  **Manual Testing**: Manually test the fix to ensure that it resolves the issue without introducing new problems.
5.  **Regression Tests**: Add regression tests to prevent the bug from recurring in the future.

### 7. Create a Pull Request

1.  **Descriptive Title**: Write a descriptive title that clearly explains the purpose of the pull request.
2.  **Detailed Description**: Provide a detailed description of the bug, the fix, and any relevant context.
3.  **Test Instructions**: Include instructions how to test to verify the fix.
4.  **Screenshots**: Add screenshots or videos to illustrate the bug and the fix.
5.  **Code Review**: Request a code review from another team member and address any feedback.

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

### IStorage Interface and Implementations

The `IStorage` interface and its implementations (`DatabaseStorage`, etc.) are found in `server/storage.ts` and define the contract for interacting with the underlying data storage mechanisms. Familiarity with this interface is important for debugging data-related issues.

### Error Handling Patterns

```typescript
// Client-side auth error handling
import { isUnauthorizedError, redirectToLogin } from '@/lib/auth-utils';

if (isUnauthorizedError(error)) {
  redirectToLogin();
}
```

### Key Storage Methods

- `server/storage.ts` — `IStorage` interface and `DatabaseStorage` class.  All database operations go through this layer.

### Validation Functions

- `server/lib/document-validation.ts` — Server-side CPF/CNPJ validation.
- `client/src/lib/document-validation.ts` — Client-side CPF/CNPJ validation.

## Documentation Touchpoints

- Data Flow ([docs/data-flow.md](../docs/data-flow.md)) — Understand request/response flow.
- Glossary ([docs/glossary.md](../docs/glossary.md)) — Domain terms and entities.
- Security ([docs/security.md](../docs/security.md)) — Auth and validation patterns.

## Code Snippets

### Example of `apiRequest` usage

```typescript
import { apiRequest } from "@/lib/queryClient";

async function createUser(data: UserData): Promise<User> {
  return apiRequest("post", "/users", data);
}
```

### Server-side route validation

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.post("/users", async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    // ... create user logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    // ...
  }
});
```

## Hand-off Notes

After fixing a bug:

- Document the root cause.
- Note any related areas that might have similar issues.
- Suggest adding tests to prevent regression.
- Update documentation if behavior was misunderstood.
- Communicate the fix to the team and explain how it resolves the issue.
- Monitor the system after the fix is deployed to ensure that the bug does not recur.

## Agent versioning

- All agents must have semantic versioning so the team knows what features/fixes are included in each release.

## Security Considerations

- Be aware of security vulnerabilities during debugging.
- Do not expose sensitive information in logs or error messages.
- Do not disable security checks or bypass authentication mechanisms.
- Follow secure coding practices to prevent introducing new vulnerabilities.
