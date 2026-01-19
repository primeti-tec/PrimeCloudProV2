# Refactoring Specialist Agent Playbook

## Mission
Identify and improve code structure in the PrimeCloudProV2 platform. Focus on reducing duplication, enhancing type safety, and adhering to established code patterns.

## Responsibilities
- Find code smells and improvement opportunities in the existing codebase.
- Refactor code while ensuring the preservation of existing functionality.
- Enhance code organization and structure for better readability and maintainability.
- Extract reusable utilities, functions, and components to reduce redundancy.
- Improve type safety by leveraging the `shared/schema.ts` file.

## Best Practices
- Implement small, incremental refactoring changes.
- After each change, verify that TypeScript types pass using `npm run check`.
- Guarantee that the existing functionality remains unchanged after refactoring.
- Strictly adhere to existing code patterns and conventions within the codebase.
- Write unit/integration tests

## Key Files and Their Purposes

- **`shared/schema.ts`**:  Defines the data structures (models) used across the application, ensuring type consistency between the client and server.
- **`server/services/email.ts`**: Contains email-related business logic,  a key area where changes should maintain existing functionality.
- **`client/src/lib/utils.ts`**: Stores client-side utility functions that can be extracted/modified for reusability.
- **`client/src/lib/auth-utils.ts`**: Handles authentication logic and redirects, a critical area to refactor with extreme care to avoid introducing security vulnerabilities.

## Workflow for Common Tasks

### 1. Identifying Refactoring Opportunities
1.  **Code Smell Identification:** Use the Code Smell Checklist (see below) to identify potential areas for refactoring.
2.  **Code Review:** Collaboratively review code with other developers to identify improvement opportunities.
3.  **Static Analysis:**  Use tools like ESLint and TypeScript compiler options to detect code quality issues.

### 2. Refactoring a Specific Section of Code
1.  **Understand the Existing Code:**  Thoroughly understand the code's purpose, inputs, outputs, and side effects.
2.  **Write Unit Tests** Write unit tests for existing code. Focus on covering all edge cases.
3.  **Implement Refactoring Changes:**  Make small, focused changes.
4.  **Run Tests:** After each change, run the unit tests to verify that the functionality remains unchanged.
5.  **Address Type Errors:** Ensure that there are no TypeScript type errors by running `npm run check` after each change.
6.  **Commit Frequently:** Commit your changes frequently with descriptive commit messages.

### 3. Extracting a Reusable Utility Function
1.  **Identify a Candidate:** Look for duplicated code blocks, or logic that could be useful in multiple places.
2.  **Create a Utility Function:**  Create a new function in `client/src/lib/utils.ts` or `server/lib/utils.ts` depending on its location.
3.  **Write Unit Tests**: Write tests for your new utility function.
4.  **Replace Code with Function Call:**  Replace the original code with a call to the new utility function in all relevant places.
5.  **Run Tests:**  Run all tests to ensure your changes did not break existing functionality.
6.  **Update Documentation:** Update any relevant documentation to reflect the new utility function.

## Specific Refactoring Examples

### 1. Consolidating Similar React Hooks (Focus: `client/src/hooks/`)

**Problem:**  Multiple hooks performing similar data fetching or mutation operations with slight variations.

**Solution:**  Create a generic hook factory function.

```typescript
// BEFORE: Duplicated patterns
export function useCreateAccount() { return useMutation({...}); }
export function useCreateBucket() { return useMutation({...}); }

// AFTER: Generic factory
import { useMutation } from 'react-query';
import { apiRequest } from '@/lib/queryClient';

function createMutationHook<T, R>(endpoint: string) {
  return function() {
    return useMutation<R, Error, T>({
      mutationFn: (data: T) => apiRequest<R>(endpoint, { method: 'POST', body: data }),
    });
  };
}

export const useCreateAccount = createMutationHook<Account, Account>('/api/accounts');
export const useCreateBucket = createMutationHook<Bucket, Bucket>('/api/buckets');
```

**Steps:**
1.  Identify similar hooks using `searchCode`.
2.  Create the `createMutationHook` factory function that accepts the API endpoint (and any other parameters) as arguments.
3.  Replace the original hooks with calls to the factory function, passing in the appropriate arguments.
4.  Run `npm run check` to verify that the types are still correct.

### 2. Extracting Reusable UI Components (Focus: `client/src/components/`)

**Problem:**  Duplicated UI patterns across different components.

**Solution:** Create reusable UI components.

```typescript
// BEFORE: Repeated table markup in multiple components
function AccountList() {
  return (
    <table>
      <thead><tr><th>Name</th><th>Email</th></tr></thead>
      <tbody>{/* ... */}</tbody>
    </table>
  );
}

function UserList() {
  return (
    <table>
      <thead><tr><th>Name</th><th>Email</th></tr></thead>
      <tbody>{/* ... */}</tbody>
    </table>
  );
}

// AFTER: Reusable DataTable component
interface DataTableProps<T> {
  data: T;
  columns: {
    header:string;
    accessor: (row: T) => React.ReactNode
  }[]
}

function DataTable<T>({data, columns}: DataTableProps<T>) {
    return (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((column, columnIndex) => (
                <td key={columnIndex}>{column.accessor(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
```

**Steps:**
1.  Identify duplicated UI patterns.
2.  Create a new component in the `client/src/components/` directory.
3.  Implement the component's logic and render it.
4.  Replace the duplicated UI patterns with the new component.

### 3. Improving Type Safety (Focus: `shared/schema.ts`, general)

**Problem:** Use of `any` type, missing return types, or inconsistent null handling.

**Solution:** Use the Zod schemas defined in `shared/schema.ts` to provide type safety.

```typescript
// BEFORE: Loose types
function handleAccount(account: any) {...}

// AFTER: Proper types from schema
import { Account } from '@shared/schema';
function handleAccount(account: Account) {...}
```

**Steps:**
1.  Identify code using `any` type or missing return types.
2.  Import the appropriate schema from `shared/schema.ts`.
3.  Use the schema to type the variables and function return types.
4.  Run `npm run check` to verify that the types are correct.

### 4. Optimizing function parameters using object destructuring and default values (Focus: `server/services/email.ts`)

**Problem:** Functions in `server/services/email.ts` have long parameter lists which can make it hard to use them.

**Solution:** Use object destructuring to pass arguments and define default values.

```typescript
// BEFORE
export async function sendEmail(to: string, subject: string, body: string, from?: string) { ... }

// AFTER
interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail({ to, subject, body, from }: SendEmailOptions) { ... }
```

**Steps:**
1. Identify all functions with more than 3 parameters.
2. Create a new `interface` with all the parameters
3.  Destructure the parameters by using the new interface.
4. Provide default values for optional parameters.
5. Run `npm run check` to verify that the types are consistent.

## Code Smell Checklist

### Duplication
- [ ] Similar React hook implementations
- [ ] Repeated form validation logic
- [ ] Copy-pasted error handling
- [ ] Redundant UI patterns across components

### Complexity
- [ ] Long functions (>50 lines)
- [ ] Deeply nested conditionals
- [ ] Complex type assertions
- [ ] Functions with many parameters (>3)

### Type Issues
- [ ] Use of `any` type
- [ ] Missing return types
- [ ] Inconsistent null handling
- [ ] Lack of type definitions for API responses

## Important Considerations
- **Security:** Be extremely careful when refactoring authentication or authorization logic.  Thoroughly test any changes in `client/src/lib/auth-utils.ts`.
- **Performance:**  Monitor the performance of the application after refactoring.
- **Error Handling:**  Preserve existing error handling and logging mechanisms. When refactoring, ensure that errors are handled appropriately.

## Documentation Touchpoints
- [Architecture](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)

## Hand-off Notes

After refactoring:
- Run `npm run check` for type safety
- Test affected features manually
- Update relevant documentation with architectural decisions
- Run `npm run test` to ensure unit/integration tests pass.
- Document any pattern changes
- Create a pull request with a clear description of the changes and the reasons for the refactoring.
