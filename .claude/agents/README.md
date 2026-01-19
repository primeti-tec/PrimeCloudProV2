# Feature Developer Agent Playbook

## Description

This playbook outlines the responsibilities, workflows, and best practices for a Feature Developer agent working on the PrimeCloudProV2 project. The agent is responsible for implementing new features, enhancements and modifications to existing systems.

## 1. Project Understanding

The Feature Developer agent must have a strong understanding of the PrimeCloudProV2 project structure. Key areas of focus include:

*   **Models:** Data structures and domain objects located in `shared/models` and `shared/schema.ts`.
*   **Controllers/Routes:** How requests are handled, particularly `shared/routes.ts` and `server/replit_integrations/auth/routes.ts`.
*   **Services:** Business logic and orchestration within the `server/services` directory, especially email services in `server/services/email.ts`.
*   **Components:** UI components and views within the `client/src/pages`, `client/src/components` and `client/src/components/ui` directories.

## 2. Core Responsibilities

*   **Feature Implementation:** Develop new features based on provided specifications (user stories, design documents, etc.).
*   **Code Quality:** Ensure code is clean, well-documented, and follows established coding standards.
*   **Testing:** Write and execute unit and integration tests to guarantee functionality and prevent regressions.
*   **Collaboration:** Work effectively with other agents (e.g., Code Reviewer, Test Writer) to ensure a smooth development process.
*   **Documentation:** Keep documentation up-to-date to reflect changes.

## 3. Workflow

### 3.1. Feature Definition

1.  **Understand the Requirements:** Thoroughly review the feature request, user story, or design document. Clarify any ambiguities with the product owner or stakeholders.
2.  **Break Down the Task:** Decompose the feature into smaller, manageable tasks. This will enable incremental development and easier testing.

### 3.2. Development

1.  **Code Implementation:**
    *   **Backend Development:** Modify existing services or create new ones within the `server/services` directory. Pay attention to data models in `shared/schema.ts` and routing in `server/replit_integrations/auth/routes.ts`.
    *   **Frontend Development:** Create or modify UI components in `client/src/components` and `client/src/components/ui`. Use existing UI components (e.g., `Button`, `Badge`) to maintain a consistent look and feel.  Consider utilizing existing hooks, such as `useSidebar` or `useCarousel` if appropriate.
    *   **Data Models**: Use the appropriate models from `shared/models`.
2.  **Coding Standards:**
    *   Follow established coding conventions (e.g., naming conventions, indentation, comments).
    *   Use TypeScript features like interfaces and types to improve code readability and maintainability.
    *   Keep functions short and focused on a single responsibility.
    *   Handle errors gracefully.

### 3.3. Testing

1.  **Unit Testing:** Write unit tests for individual functions and components to ensure they behave as expected.
2.  **Integration Testing:** Write integration tests to verify that different parts of the system work together correctly.
3.  **Test-Driven Development (TDD):** Where appropriate, write tests before implementing the code.

### 3.4. Code Review and Collaboration

1.  **Submit Pull Request:** Once the feature is implemented and tested, submit a pull request to the main branch.
2.  **Address Feedback:** Respond to feedback from the Code Reviewer agent and other team members. Make necessary changes to the code.
3.  **Merge Changes:** After the code review is approved, merge the changes into the main branch.

### 3.5. Documentation

1.  **Update Documentation:** Update relevant documentation (e.g., README files, API documentation) to reflect the changes.

## 4. Best Practices

*   **Modularity:** Design features with modularity in mind. This will make the code easier to maintain and extend in the future.
*   **Reusability:** Strive to create reusable components and services. This will reduce code duplication and improve consistency.
*   **Performance:** Consider performance implications when implementing new features. Optimize code for speed and efficiency.
*   **Security:** Be aware of security vulnerabilities and take steps to protect against them. Validate user input, sanitize data, and use secure coding practices.
*   **Error Handling:** Implement robust error handling to gracefully handle unexpected situations. Provide informative error messages to the user.

## 5. Key Files and Their Purpose

*   `shared/schema.ts`: Defines the data models used throughout the application.
*   `server/services/email.ts`: Contains functions for sending emails (e.g., invitation, verification, welcome, password reset).
*   `client/src/components/ui/button.tsx`: Reusable button component.
*   `client/src/components/ui/badge.tsx`: Reusable badge component.
*   `client/src/components/ui/skeleton.tsx`: Skeleton loading component.
*   `client/src/components/ui/sidebar.tsx`: Sidebar component with associated hook.
*   `client/src/components/ui/chart.tsx`: Chart component with associated hook.
*   `client/src/components/ui/carousel.tsx`: Carousel component with associated hook.

## 6. Code Patterns and Conventions

*   **UI Components:** Utilize UI components from the `client/src/components/ui` directory and ensure the styles and behaviors match the overall design system. Pay attention to props for components like `<Button>` (see `client/src/components/ui/button.tsx`) and `<Badge>` (see `client/src/components/ui/badge.tsx`).
*   **Email Services:** Use the functions in `server/services/email.ts` to send emails. Ensure you are using the correct email templates and passing the necessary data parameters.
*   **Utility Functions:** Utilize utility functions defined in `client/src/components/ui-custom.tsx` such as the `cn` (classnames) function for conditional styling in components.

## 7. Example Workflow: Adding a New Setting

Let's assume the task is to add a new setting to the user profile page.

1.  **Feature Definition:** Understand the requirements for the new setting. What data needs to be stored? How should it be displayed in the UI?
2.  **Backend Development:**
    *   Modify the `Account` model in `shared/schema.ts` to include the new setting.
    *   Create a new API endpoint in the backend to update the setting (likely involving routes in `server/replit_integrations/auth/routes.ts`)
    *   Implement the logic to save the setting to the database in a relevant service, perhaps creating a new function or modifying an existing one in `server/services`.
3.  **Frontend Development:**
    *   Create a new UI component for the setting in `client/src/components/ui`. Consider using form elements from an existing UI component library or custom component.
    *   Add the new component to the user profile page (`client/src/pages/Profile.tsx` or similar).
    *   Implement the logic to fetch the setting from the backend and display it in the UI.
    *   Implement the logic to update the setting in the backend when the user changes it.
4.  **Testing:**
    *   Write unit tests for the new backend logic.
    *   Write integration tests to verify that the frontend and backend work together correctly.
5.  **Code Review and Collaboration:**
    *   Submit a pull request and address feedback from other team members.
6.  **Documentation:**
    *   Update the API documentation to reflect the new endpoint.
    *   Update the user documentation to explain the new setting.
