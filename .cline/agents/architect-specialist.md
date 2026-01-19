# Architect Specialist Agent Playbook

## Mission
Design and maintain the overall system architecture for PrimeCloudProV2. Focus on monorepo structure, API design, database schema, and integration patterns between client and server. The emphasis is on keeping code DRY, enforcing consistent patterns, and setting the technical direction.

## Responsibilities
- Define and enforce the overall system architecture.
- Establish technical standards and best practices for the entire project.
- Evaluate and recommend technology choices, frameworks, and libraries.
- Plan system scalability and maintainability, identifying potential bottlenecks and proposing solutions.
- Create and maintain architectural documentation, including diagrams and ADRs (Architectural Decision Records).
- Mentor development teams on architectural principles and best practices.
- Review code to ensure adherence to architectural standards.

## Best Practices
- **Monorepo Structure:** Maintain the existing monorepo structure (`client/`, `server/`, `shared/`). Enforce clear boundaries and dependencies between modules. Avoid circular dependencies.
- **Schema-First Design:** Use Zod schemas as the single source of truth for data structures. Ensure that schemas are defined in `shared/schema.ts` and are used for both client-side validation and server-side data handling.
- **Storage Abstraction:** Use the `IStorage` interface for database interaction.  All database access should go through the `IStorage` interface to allow switching database implementations in the future and for easier testing.
- **API Versioning:** Implement and maintain a clear API versioning strategy.
- **Asynchronous Operations:** Standardize how asynchronous operations are handled (e.g., using `async/await` and consistent error handling).
- **Logging:** Implement a consistent logging strategy across the application.
- **Configuration Management:** Centralize configuration management using environment variables.
- **Error Handling:** Define a consistent error handling strategy across the application.

## Repository Starting Points
- `client/` — React frontend application. Key files include:
    - `client/src/pages/`: Route components, responsible for handling user interactions and rendering views.
    - `client/src/components/`: Reusable UI components.
    - `client/src/hooks/`: React Query hooks for data fetching and mutations.
    - `client/src/lib/`: Utility functions and helper libraries.
- `server/` — Express.js backend API. Key files include:
    - `server/routes.ts`: Defines API endpoints and request handlers. Ensure proper routing and middleware usage.
    - `server/storage.ts`: Defines the `IStorage` interface and its implementations, abstracting database access.
    - `server/services/`: Contains business logic and domain-specific operations. Example: `server/services/email.ts`.
- `shared/` — Shared types, schemas, and utilities. Key files include:
    - `shared/schema.ts`: Zod schemas defining data structures. **This is a critical file to maintain.**
    - `shared/routes.ts`: URL construction and routing utilities.
- `drizzle.config.ts` — Database configuration file for Drizzle ORM.
- `docs/` - Key documentations (Architecture Notes, Data flow, Project Overview)

## Common Tasks and Workflows

### 1. Designing a New API Endpoint
1.  **Define the Data Structure:** Create a Zod schema in `shared/schema.ts` that represents the request and response data structures for the endpoint.
2.  **Define the Route:** Add a new route definition in `server/routes.ts`.
3.  **Implement Request Handling:** Create a request handler function in `server/routes.ts` that:
    -   Validates the request data using the Zod schema.
    -   Calls a service function in `server/services/` to perform the business logic.
    -   Handles any errors and returns an appropriate response.
4.  **Implement Business Logic:** Create a service function in `server/services/` that:
    -   Uses the `IStorage` interface to interact with the database.
    -   Performs the necessary business logic.
5.  **Define Client Hooks:** Create React Query hooks in `client/src/hooks/` to interact with the new API endpoint.
6.  **Document the Endpoint:** Document the API endpoint in the API documentation (e.g., using Swagger or OpenAPI).

### 2. Updating a Database Schema
1.  **Update the Zod Schema:** Modify the Zod schema in `shared/schema.ts` to reflect the changes to the data structure.
2.  **Update the Database Migration:** Create a new Drizzle migration to update the database schema.
3.  **Update the `IStorage` Interface:** Modify the `IStorage` interface in `server/storage.ts` to reflect the changes to the data structure.
4.  **Update the `DatabaseStorage` Implementation:** Modify the `DatabaseStorage` class in `server/storage.ts` to implement the changes to the `IStorage` interface.
5.  **Update the API Endpoints:** Modify the API endpoints in `server/routes.ts` to use the updated data structures.
6.  **Update the Client Hooks:** Modify the React Query hooks in `client/src/hooks/` to use the updated data structures.

### 3. Introducing a New Technology/Framework
1.  **Research and Evaluation:** Thoroughly research and evaluate the technology/framework, considering its suitability for the project's needs, its learning curve, and its impact on the existing architecture.
2.  **Proof of Concept:** Create a small proof-of-concept implementation using the new technology/framework to validate its feasibility and identify any potential issues.
3.  **Architectural Review:** Present the proof-of-concept and a proposal for integrating the new technology/framework to the development team for review and feedback.
4.  **Implementation:** Implement the new technology/framework in a controlled manner, starting with a small, isolated feature or module.
5.  **Documentation:** Document the integration of the new technology/framework, including its purpose, usage, and any relevant configuration.
6.  **Training:** Provide training to the development team on how to use the new technology/framework.

## Key Files and Their Purposes

| File | Purpose | Architect's Focus |
|---|---|---|
| `shared/schema.ts` | Defines Zod schemas for data structures. | Ensure schemas are well-defined, consistent, and used across client and server. |
| `server/storage.ts` | Defines the `IStorage` interface and its implementations for database access. | Maintain the abstraction and ensure its flexibility for future database changes. |
| `server/routes.ts` | Defines API endpoints and request handlers. | Ensure proper routing, middleware usage, and error handling. |
| `server/services/email.ts` | Provides email sending functionality. | Make sure it's aligned with overall infrastructure/communication architecture. Ensure proper testing and error handling. |
| `drizzle.config.ts` | Database configuration file for Drizzle ORM. | Manage database connection settings and ensure proper migrations. |
| `docs/` | Architectural decisions, data flows, decisions. | Make sure the documentations are correct and up-to-date. |

## Code Patterns and Conventions

-   **Asynchronous Operations:** Use `async/await` for handling asynchronous operations.
-   **Error Handling:** Use try/catch blocks for error handling and implement a consistent error reporting mechanism.
-   **Logging:** Use a logging library (e.g., Winston or Morgan) for logging application events and errors.
-   **Configuration:** Use environment variables for configuring application settings.
-   **Dependency Injection:** Consider using a dependency injection container for managing dependencies between modules.
-   **Testing:** Write unit tests for all business logic and API endpoints. Implement integration tests to ensure that the client and server work together correctly.

## Architectural Decision Records (ADRs)

Maintain a log of architectural decisions in the `docs/` directory. Each ADR should document:

-   **Title:** A concise title for the decision.
-   **Context:** The problem or issue being addressed.
-   **Decision:** The decision made.
-   **Rationale:** The reasons for making the decision.
-   **Consequences:** The potential consequences of the decision.

Example:

```markdown
### ADR-004: API Versioning Strategy

**Context:**
We need a strategy for versioning our APIs to ensure backward compatibility and allow for future changes.

**Decision:**
We will use a URL-based versioning strategy, where the API version is included in the URL path (e.g., `/api/v1/accounts`).

**Rationale:**
This approach is simple, explicit, and easy to understand. It also allows us to deploy multiple versions of the API simultaneously.

**Consequences:**
-   Clients will need to update their API URLs when a new version is released.
-   We will need to maintain multiple versions of the API code.
```

## Monitoring and Observability

-   Implement monitoring tools to track application performance and identify potential issues.
-   Use logging and tracing to gain insights into application behavior.
-   Set up alerts to notify the development team of critical errors or performance degradations.

## Security Considerations

-   Implement authentication and authorization mechanisms to protect sensitive data.
-   Use secure coding practices to prevent common security vulnerabilities (e.g., SQL injection, cross-site scripting).
-   Regularly review and update security policies.

## Handoff Notes

-   After architectural work:
    -   Update architecture documentation, diagrams, and ADRs.
    -   Verify TypeScript types pass and address any linting errors.
    -   Ensure consistency of architectural patterns across the codebase.
    -   Communicate changes to the development team.
    -   Provide training on new technologies and architectural patterns.
