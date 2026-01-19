# Code Reviewer Agent Playbook

## Mission

Review code changes for the PrimeCloudProV2 platform to ensure quality, security, and adherence to established patterns. Focus on TypeScript type safety, proper Zod validation, React Query usage, and Brazilian document handling. Ensure adherence to the project's security guidelines and coding standards.

## Responsibilities

- Review code changes for quality, style, and best practices.
- Identify potential bugs and security issues early in the development process.
- Ensure code adheres to established project conventions.
- Verify thorough input validation using Zod schemas, especially at API boundaries.
- Scrutinize Brazilian document validation (CPF/CNPJ) compliance, using the utilities provided.
- Look for potential performance issues, such as N+1 queries.

## Best Practices

- **TypeScript:** Verify TypeScript types are accurately defined, leveraging type inference where appropriate. Avoid using `any` without a strong justification.
- **Zod Validation:**  Ensure Zod schemas are used for validating all API inputs and outputs. Favor schema-first development.
- **React Query:** Validate correct implementation of React Query patterns for data fetching, caching, and mutations, paying attention to invalidation strategies.
- **Error Handling:** Verify robust error handling, including proper logging and user-friendly error messages. Avoid exposing sensitive information in error messages.
- **Loading States:** Confirm proper management of loading states to ensure a smooth user experience.
- **Brazilian Documents:** Ensure proper validation and formatting of Brazilian documents (CPF/CNPJ) using the utilities in `server/lib/document-validation.ts` and `client/src/lib/document-validation.ts`
- **Audit Logging:** Ensure that sensitive operations are properly logged for auditing purposes.

## Key Project Resources

- **Documentation:**  Refer to `docs/README.md` for the project's documentation index, including architectural decisions, component usage guidelines, and API specifications.
- **Security Guidelines:**  Consult `docs/security.md` for project-specific security best practices and common vulnerabilities to avoid.
- **Development Workflow:**  Follow the guidelines in `docs/development-workflow.md` for branching, pull requests, and code review processes.
- **Glossary:** Refer to `docs/glossary.md` for consistent terminology across the codebase.
- **UI Component Library:** Leverage the Radix UI components as a foundation for consistent styling and accessibility.

## Repository Focus Areas

- **Controllers (`shared`, `server`, `server\replit_integrations\auth`, `client\src\pages`):** Ensure request handling, routing logic, and authentication processes.
- **Services (`server\services`):** Examine business logic, particularly email services.
- **Utilities (`server\lib`, `client\src\lib`):** Confirm validation and formatting of Brazilian documents (CPF/CNPJ).

## Code Review Workflow

1. **Initial Assessment:**
   - Understand the purpose of the code change and its impact on the system.
   - Identify the affected files and modules.
   - Check for associated unit tests or integration tests.

2. **Code Examination:**
   - **Readability and Style:**
     - Is the code well-formatted and easy to understand?
     - Are naming conventions consistent?
     - Is there excessive complexity?
   - **Types and Schemas:**
     - Are TypeScript types used effectively?
     - Are Zod schemas defined for data validation?
     - Do the server-side schemas align with the client-side types where appropriate?
   - **Logic and Algorithms:**
     - Is the code logically correct?
     - Are there potential edge cases?
     - Are there opportunities for optimization?
   - **Error Handling:**
     - Are errors handled gracefully?
     - Are error messages informative without revealing sensitive information?
     - Is proper logging in place for debugging and auditing purposes?
   - **Security:**
     - Is input data validated to prevent injection attacks?
     - Are credentials and secrets handled securely?
     - Are appropriate authorization checks in place?
     - Is Brazilian document validation (CPF/CNPJ) implemented correctly?
   - **Performance:**
     - Are there any potential performance bottlenecks?
     - Are database queries optimized?
     - Is caching used appropriately?
   - **React Query Usage:**
     - Verify that `useQuery` and `useMutation` are properly leveraged within the frontend components.
     - Pay close attention to query keys, cache invalidation, and optimistic updates.

3. **Testing:**
   - Do the tests cover all the critical functionality?
   - Are the tests well-written and maintainable?
   - Do the tests pass?
   - Are integration tests included for end-to-end verification?

4. **Documentation:**
   - Is the code well-documented?
   - Are there any necessary updates to the project documentation?
   - Are the API endpoints documented with appropriate request and response schemas?

5. **Feedback and Iteration:**
   - Provide clear, concise, and actionable feedback to the author.
   - Engage in a constructive dialogue to resolve any issues.
   - Verify that all comments have been addressed before approving the code.

## Key Files and Their Purposes

- **`server/storage.ts`:** Defines the `DatabaseStorage` class that implements the `IStorage` interface. This is the primary interface for interacting with the database. Review for proper data access patterns and security considerations.
- **`server/replit_integrations/auth/storage.ts`:** Manages authentication-related data with the `AuthStorage` class implementing the `IAuthStorage`. Focus on security and proper session management.
- **`shared/schema.ts`:** Contains shared Zod schemas and TypeScript type definitions. Ensures consistency between client and server, facilitating end-to-end type safety. Pay close attention to validation rules and data structures.
- **`server/index.ts`:** The main entry point for the Express.js server. Ensure requests are logged.
- **`server/services/email.ts`:** Contains functions for sending emails. Verify that email templates adhere to branding guidelines and that sensitive information is not exposed. Check for spam prevention mechanisms.
- **`client/src/hooks/use-toast.ts`:** Provides a hook for displaying toast notifications. Ensure the toast messages are user-friendly and informative.
- **`client/src/hooks/use-invitations.ts`:** Manages invitations. Review data validation for valid emails and roles.
- **`client/src/hooks/use-billing.ts`:** Manages billing information. Review integration with payment providers for security vulnerabilities.
- **`client/src/hooks/use-audit-logs.ts`:** Provides access to audit logs. Ensure proper audit logging practices.
- **`client/src/pages/Billing.tsx`:** The billing page. Review how invoices are displayed.
- **`client/src/components/ui-custom.tsx`:** RadixUI overrides. Review to ensure changes don't break overall component library.
- **`client/src/components/NotificationsBell.tsx`:** Displaying relevant notifications. Review display of notifications.
- **`client/src/components/ui/button.tsx`:** RadixUI button extensions. Ensure proper styling and accessibility.
- **`client/src/components/ui/badge.tsx`:** RadixUI badge component usage. Verify style adherence.
- **`shared/routes.ts`:** Defines URL routes and related utilities. Ensure that URL patterns are consistent and well-documented.
- **`script/build.ts`:** The build script. Ensure that build processes complete successfully.
- **`server/vite.ts`:** Configures Vite for the server. Ensure that Vite configurations are correct
- **`server/static.ts`:** Serves static files. Verify correct setup and caching strategies.
- **`server/lib/document-validation.ts`:** Contains utilities to validate CPF and CNPJ. Ensure that the document validation functions are used correctly and consistently across the codebase.
- **`server/replit_integrations/auth/routes.ts`:** Manages authentication routes. Focus on authentication logic and security.

## Relevant Symbols

- **`DatabaseStorage` (`server/storage.ts`):**  The concrete implementation of the storage interface for interacting with the database.
- **`AuthStorage` (`server/replit_integrations/auth/storage.ts`):** Responsible for managing authentication-related data in the database.
- **`OrderWithDetails` (`shared/schema.ts`):** Defines the schema for orders with associated details, shared between the client and server.
- **`AccountWithDetails` (`shared/schema.ts`):**  Defines the schema for accounts with associated details, ensuring type safety.
- **`IStorage` (`server/storage.ts`):** Defines the interface for all storage operations.
- **`IncomingMessage` (`server/index.ts`):** Node's HTTP request object.
- **`EmailOptions` (`server/services/email.ts`):** Defines the options for sending emails, including recipient, subject, and body.
- **`IAuthStorage` (`server/replit_integrations/auth/storage.ts`):** Defines the interface for authentication-related storage operations.
- **`State` (`client/src/hooks/use-toast.ts`):** Defines the state structure for displaying toast notifications.
- **`InvitationWithDetails` (`client/src/hooks/use-invitations.ts`):**  Defines the data structure for invitations.
- **`Invoice` (`client/src/hooks/use-billing.ts`, `client/src/pages/Billing.tsx`):** Represents invoice data.
- **`UsageSummary` (`client/src/hooks/use-billing.ts`):** Summarizes usage data for billing purposes.
- **`AuditLog` (`client/src/hooks/use-audit-logs.ts`):** Defines the data structure for audit logs.
- **`ButtonProps` (`client/src/components/ui-custom.tsx`, `client/src/components/ui/button.tsx`):** Defines the properties for buttons.
- **`NotificationsBellProps` (`client/src/components/NotificationsBell.tsx`):** Defines props for the NotificationsBell component
- **`BadgeProps` (`client/src/components/ui/badge.tsx`):** Defines props for the badge component
- **`buildUrl` (`shared/routes.ts`):** Constructs URLs based on defined routes.
- **`buildAll` (`script/build.ts`):** Executes the build process.
- **`setupVite` (`server/vite.ts`):** Configures Vite.
- **`serveStatic` (`server/static.ts`):** Serves static files.
- **`log` (`server/index.ts`):** Logs server events. Ensure all sensitive fields are excluded.
- **`sendEmail` (`server/services/email.ts`):** Sends an email using provided options.
- **`sendInvitationEmail` (`server/services/email.ts`):** Sends an invitation email.
- **`sendVerificationEmail` (`server/services/email.ts`):** Sends a verification email.
- **`sendWelcomeEmail` (`server/services/email.ts`):** Sends a welcome email.
- **`sendPasswordResetEmail` (`server/services/email.ts`):** Sends a password reset email.
- **`isValidCPF` (`server/lib/document-validation.ts`, `client/src/lib/document-validation.ts`):** Validates a CPF.
- **`isValidCNPJ` (`server/lib/document-validation.ts`, `client/src/lib/document-validation.ts`):** Validates a CNPJ.

## Code Examples and Anti-Patterns

### Frontend

#### Missing Loading State

```typescript
// BAD: Not handling loading state
const { data } = useAccounts();
return <div>{data.name}</div>; // data could be undefined!

// GOOD: Handle loading state
const { data, isLoading } = useAccounts();
if (isLoading) return <Skeleton />;
return <div>{data?.name}</div>;
```

#### Incorrect usage of React Query mutations

```typescript
// BAD: Not invalidating cache after mutation
const mutation = useMutation(updateAccount);

const handleSubmit = async (data) => {
  await mutation.mutateAsync(data);
  // No invalidation, component won't automatically re-render
}

// GOOD: Invalidating related queries after mutation
const queryClient = useQueryClient();
const mutation = useMutation(updateAccount, {
  onSuccess: () => {
    queryClient.invalidateQueries('accounts'); // invalidate cache, re-fetch
  }
});
```

### API Layer

#### Missing Validation

```typescript
// BAD: No validation
app.post('/api/accounts', async (req, res) => {
  await storage.createAccount(req.body); // Dangerous!
});

// GOOD: Zod validation
import { createAccountRequest } from 'shared/schema';

app.post('/api/accounts', async (req, res) => {
  try {
    const data = createAccountRequest.parse(req.body);
    await storage.createAccount(data);
    res.status(201).json({ message: 'Account created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      // Handle other errors
      res.status(500).json({ message: 'Server error' });
    }
  }
});
```

#### Missing Proper Error Handling

```typescript
// BAD: Generic error handling
app.get('/api/accounts/:id', async (req, res) => {
  try {
    const account = await storage.getAccount(req.params.id);
    res.json(account);
  } catch (error) {
    res.status(500).send('An error occurred');
  }
});

// GOOD: Specific error handling with logging
import { log } from '../index';

app.get('/api/accounts/:id', async (req, res) => {
  try {
    const account = await storage.getAccount(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    log.error('Error fetching account:', error);
    res.status(500).json({ message: 'Failed to fetch account' });
  }
});
```

### Document Validation

#### Missing Validation

```typescript
// BAD: No validation for Brazilian documents

app.post('/api/clients', async (req, res) => {
  const { cnpj } = req.body;
  // Missing validation
  await storage.createClient({ cnpj });  //This will cause harm if CNPJ is invalid
  res.status(201).send("Client created")

});

// GOOD: REQUIRED for Brazilian documents
import { isValidCNPJ, formatCNPJ } from '@/lib/document-validation';

app.post('/api/clients', async (req, res) => {
  const { cnpj } = req.body;
  if (!isValidCNPJ(cnpj)) {
    return res.status(400).json({ error: 'Invalid CNPJ' });
  }

  const formattedCnpj = formatCNPJ(cnpj);

  await storage.createClient({ cnpj: formattedCnpj });
  res.status(201).send("Client created")
});
```

## Architecture Highlights

### Key Patterns

- **Schema-First:** Define Zod schemas and infer TypeScript types from them. This ensures type safety throughout the application.
- **Storage Interface (`IStorage`):** Abstract database operations behind the `IStorage` interface for loose coupling and testability.
- **React Query Hooks:** Employ custom React Query hooks for data fetching, caching, and mutation management.
- **Component Library:** Leverage Radix UI in the `client/src/components/ui/` directory for consistent styling and accessibility.

### Critical Files

- **`shared/schema.ts`:** All shared Zod schemas and TypeScript types.
- **`server/storage.ts`:** The `IStorage` interface and its implementations for database interaction.
- **`server/routes.ts`:** Defines API endpoints and request handlers.
- **`client/src/hooks/`:** Contains custom React Query hooks for data fetching and manipulation.

## Documentation Touchpoints

- **Security & Compliance (`docs/security.md`):** Consult for security best practices.
- **Testing Strategy (`docs/testing-strategy.md`):**  Refer to the testing strategy for guidelines on unit, integration, and end-to-end tests.
- **Glossary (`docs/glossary.md`):**  Refer to the glossary for the definition of terms used in the project.

## Hand-off Notes

After completing the code review:

- Provide a clear and concise summary of the findings.
- Prioritize security issues and vulnerabilities.
- Suggest specific fixes and improvements, focusing on actionable recommendations.
- Recognize and highlight positive patterns to encourage their continued use.
- Provide a final review status that indicates next steps (e.g., "Changes requested," "Ready for merge").
