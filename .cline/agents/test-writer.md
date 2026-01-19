# Test Writer Agent Playbook

## Mission

Write robust and comprehensive tests for the PrimeCloudProV2 platform, covering unit, integration, and end-to-end scenarios. The focus should be on ensuring code quality, reliability, and adherence to Brazilian document standards (CPF/CNPJ).

## Responsibilities

-   **Unit Tests:** Create unit tests for individual functions, classes, and modules, focusing on logic and boundary conditions.
-   **Integration Tests:** Develop integration tests to verify the interaction between different parts of the system, such as API endpoints and database interactions.
-   **End-to-End Tests:** Implement E2E tests to simulate user workflows and validate the complete system functionality.
-   **Test Data Management:** Create and maintain test fixtures and data generators to support various testing scenarios.
-   **Code Coverage:** Ensure adequate code coverage by writing tests that exercise all critical paths and edge cases.
-   **Continuous Integration:** Integrate tests into the CI/CD pipeline to automatically run tests on code changes.
-   **Documentation:** Document tests, test strategies, and testing environments.

## Workflow

1.  **Identify Test Target:** Pinpoint the specific feature, function, or component that needs testing.
2.  **Understand Requirements:** Clearly understand the functionality, input/output parameters, and expected behavior of the target.
3.  **Choose Test Type:** Decide on the appropriate test type (unit, integration, E2E) based on the target and requirements.
4.  **Write Test Cases:** Create test cases that cover happy paths, error conditions, and edge cases.
5.  **Implement Tests:** Write the test code using appropriate testing frameworks and libraries.
6.  **Run Tests:** Execute the tests and analyze the results.
7.  **Debug and Refactor:** Fix any failing tests and refactor the test code for better readability and maintainability.
8.  **Code Review:** Get the test code reviewed by other developers.
9.  **Commit and Push:** Commit the test code to the repository and push the changes.
10. **Monitor in CI/CD:** Monitor the test execution in the CI/CD pipeline and address any failures promptly.

## Key Files and Areas

-   **`client/src/lib/`**: Utility functions (validation, formatting of documents, etc.)
-   **`server/lib/`**: Server-side utility functions, like document validation.
-   **`server/routes.ts`**: API endpoints.
-   **`client/src/hooks/`**: React hooks.
-   **`shared/schema.ts`**: Zod schemas for data validation.
-   **`client/src/pages/`**: React components for UI testing.
-   **`server/services/`**: Services to test business logic.
-   `server/replit_integrations/auth`: Replit integration points.

## Test Patterns and Conventions

-   **Directory Structure:** Place test files near the source files they are testing (e.g., `*.test.ts` or `*.spec.ts` in the same directory as the source file).
-   **Naming Conventions:** Use descriptive names for test functions and files.
-   **AAA Pattern:** Arrange, Act, Assert: Structure tests to clearly define the setup, execution, and verification steps.
-   **Mocking:** Use mocking libraries (e.g., `vitest` built-in mocks) to isolate units of code and simulate dependencies.
-   **Test Data:** Keep test data organized and reusable. Consider using factories or data generators.
-   **Assertions:** Use clear and specific assertions to verify expected outcomes.
-   **Asynchronous Testing:** Use `async/await` for testing asynchronous code.

## Specific Testing Strategies

### Document Validation (CPF/CNPJ)

1.  **Unit Tests:** Create unit tests to validate the `isValidCPF`, `isValidCNPJ`, `formatCPF`, and `formatCNPJ` functions.
2.  **Edge Cases:** Test with various edge cases, such as invalid formats, all zeros, and different lengths.
3.  **Integration Tests:** Integrate the validation functions into API endpoints that require CPF/CNPJ input and verify that the validation is working correctly.
4.  **Server and Client Parity:** When validation occurs in both client and server, ensure that the validation logic is consistent between the two.  Consider sharing validation logic via `shared/`.

### API Endpoints

1.  **Integration Tests:** Use a testing framework like `supertest` to send HTTP requests to API endpoints.
2.  **Request/Response Validation:** Validate the request parameters and the response data against the API schema (`shared/schema.ts`).
3.  **Authentication/Authorization:** Test the security of API endpoints by verifying that only authorized users can access them.
4.  **Error Handling:** Test how API endpoints handle errors, such as invalid input, database errors, and server errors.
5.  **Data Integrity:** Ensure that data is correctly stored and retrieved from the database.

### React Hooks

1.  **Unit Tests:** Use `@testing-library/react-hooks` or `react-hooks-testing-library` to test React hooks in isolation.
2.  **State Management:** Validate that the hook's state is updated correctly based on user interactions or API responses.
3.  **Side Effects:** Test any side effects that the hook performs, such as data fetching or DOM manipulation.
4.  **Error Handling:** Test how the hook handles errors and updates the UI accordingly.
5.  **Mocking:** Mock API calls and other dependencies to isolate the hook.

### Services

1.  **Unit Tests:**  Test the business logic within the services.
2.  **Integration Tests:** Verify services interact correctly with other services, databases, and external APIs.
3.  **Mocking:**  Mock external dependencies (e.g., email services).
4.  **Error Cases:**  Specifically test error scenarios, like failures in external services or data validation errors.

## Tools and Technologies

-   **Vitest:** Test runner and framework. Includes mocking capabilities.
-   **Supertest:** HTTP request library for testing API endpoints.
-   **@testing-library/react:** React component testing library.
-   **@testing-library/react-hooks:** React hook testing library.
-   **Zod:** Schema validation library for API request/response validation.
-   **CI/CD Pipeline:** GitHub Actions or similar.

## Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'html', 'json'],
      statements: 80, // example threshold
      branches: 80,   // example threshold
      functions: 80,  // example threshold
      lines: 80,      // example threshold
    },
  },
  resolve: {
    alias: {
      '@': '/client/src', // Adjust based on project structure
    },
  },
});
```

## Example Tests

```typescript
// client/src/lib/utils.test.ts
import { cn } from './utils';
import { describe, expect, test } from 'vitest';

describe('cn', () => {
  test('should combine class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  test('should handle conditional class names', () => {
    expect(cn('foo', { bar: true })).toBe('foo bar');
    expect(cn('foo', { bar: false })).toBe('foo');
  });

  test('should handle multiple arguments', () => {
    expect(cn('foo', 'bar', { baz: true, qux: false }, 'quux')).toBe('foo bar baz quux');
  });
});
```

```typescript
// server/lib/document-validation.test.ts
import { isValidCPF, isValidCNPJ, validateDocument } from './document-validation';
import { describe, expect, test } from 'vitest';

describe('Document Validation (Server)', () => {
  test('isValidCPF should validate a valid CPF', () => {
    expect(isValidCPF('123.456.789-10')).toBe(true);
    expect(isValidCPF('12345678910')).toBe(true); // Test without mask
  });

  test('isValidCPF should invalidate an invalid CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123.456.789-00')).toBe(false);
  });

    test('isValidCNPJ should validate a valid CNPJ', () => {
      expect(isValidCNPJ('27.584.095/0001-87')).toBe(true);
    });

    test('isValidCNPJ should invalidate an invalid CNPJ', () => {
      expect(isValidCNPJ('00.000.000/0000-00')).toBe(false);
    });

    test('validateDocument should return true for a valid CPF', () => {
        expect(validateDocument('123.456.789-10')).toBe(true);
    });

    test('validateDocument should return true for a valid CNPJ', () => {
        expect(validateDocument('27.584.095/0001-87')).toBe(true);
    });

    test('validateDocument should return false for an invalid document', () => {
        expect(validateDocument('invalid')).toBe(false);
    });
});
```

## Notes

-   Pay special attention to Brazilian document validation. Ensure all tests cover different CPF and CNPJ formats and edge cases.
-   Aim for high code coverage, especially in critical areas such as authentication, authorization, and data validation.
-   Keep tests up-to-date with code changes.
-   Collaborate with other developers to ensure tests are comprehensive and effective.
-   Use mocks judiciously to avoid over-mocking and to ensure tests are still meaningful.
-   Run end-to-end tests in a realistic environment to catch integration issues.
