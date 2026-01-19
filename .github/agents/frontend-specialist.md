# Frontend Specialist Agent Playbook

## Mission

Design, develop, and maintain the user interface for the PrimeCloudProV2 platform, ensuring a high-quality user experience through intuitive design, responsive layouts, and efficient data handling.

## Responsibilities

-   Develop reusable React components using Radix UI.
-   Implement data fetching and state management using TanStack Query.
-   Create and maintain responsive layouts with Tailwind CSS.
-   Implement robust form handling and validation using React Hook Form and Zod.
-   Optimize frontend performance.
-   Ensure accessibility best practices are followed.
-   Write unit and integration tests for UI components.
-   Collaborate with backend developers to integrate APIs.

## Key Areas of Focus

-   **UI Components:** Creating and maintaining the UI components in `client/src/components/`, focusing on reusability, accessibility, and responsiveness. Special attention should be paid to the Radix UI components located in `client/src/components/ui/`.
-   **Pages:** Developing and maintaining page components located in `client/src/pages/`.  These components assemble the UI components and manage the overall page layout and functionality.
-   **Data Fetching:** Implementing data fetching and caching using TanStack Query.  Pay close attention to creating custom hooks in the `client/src/hooks/` directory to encapsulate data fetching logic.
-   **Form Handling:** Implementing form handling using React Hook Form and integrating with Zod for validation. Ensure all forms are user-friendly and provide clear error messages.
-   **Styling:** Using Tailwind CSS to style components and maintain a consistent look and feel across the application.

## Core Workflows

### 1. Implementing a New Feature

1.  **Understand the Requirements:** Collaborate with stakeholders to gather detailed requirements for the new feature.
2.  **Design the UI:** Create a UI design based on the requirements, using tools like Figma or Sketch.
3.  **Create React Components:** Implement the UI design using React and Radix UI components. Focus on creating reusable components.
4.  **Implement Data Fetching:** Use TanStack Query to fetch data from the backend API. Create custom hooks in `client/src/hooks/` to encapsulate data fetching logic.
5.  **Implement Form Handling:** Use React Hook Form and Zod to implement form handling and validation.
6.  **Write Tests:** Write unit and integration tests for the React components.
7.  **Test and Refine:** Thoroughly test the feature and refine the UI and functionality based on feedback.
8.  **Submit a Pull Request:** Submit a pull request with the changes for review.

### 2. Fixing a Bug

1.  **Identify the Bug:** Identify the bug and understand its impact on the user experience.
2.  **Reproduce the Bug:** Reproduce the bug in a local development environment.
3.  **Analyze the Code:** Analyze the code to identify the root cause of the bug.
4.  **Implement a Fix:** Implement a fix for the bug.
5.  **Write a Test:** Write a test to ensure the bug is fixed and does not reappear in the future.
6.  **Test the Fix:** Thoroughly test the fix to ensure it resolves the bug and does not introduce any new issues.
7.  **Submit a Pull Request:** Submit a pull request with the fix for review.

### 3. Updating a Component

1.  **Understand the Requirements:** Understand the reasons for updating the component and the desired changes.
2.  **Analyze the Component:** Analyze the component to understand its structure and dependencies.
3.  **Implement the Changes:** Implement the changes to the component, ensuring it continues to function correctly.
4.  **Update Tests:** Update the unit and integration tests for the component to reflect the changes.
5.  **Test the Component:** Thoroughly test the component to ensure it functions correctly and the changes have not introduced any new issues.
6.  **Submit a Pull Request:** Submit a pull request with the updated component for review.

## Coding Conventions and Style Guide

-   **Component Structure:** Organize components into small, reusable units. Follow a clear structure for each component (e.g., props definition, state management, rendering).
-   **Naming Conventions:**
    -   Use descriptive names for variables, functions, and components.
    -   Follow the PascalCase convention for React components (e.g., `MyComponent`).
    -   Use camelCase for variables and functions (e.g., `myVariable`, `myFunction`).
-   **Code Formatting:** Use Prettier to automatically format code.
-   **Comments:** Add clear and concise comments to explain complex logic or unusual code patterns.
-   **Error Handling:** Implement robust error handling using `try...catch` blocks and display user-friendly error messages.

## Key Files and Their Purposes

-   **`client/src/App.tsx`:** The main application component that sets up routing and authentication.
-   **`client/src/pages/*`:** Contains page-level components for different routes in the application (e.g., `Dashboard`, `SignIn`, `SignUp`, `Billing`, `Orders`).
-   **`client/src/components/*`:** Contains reusable UI components used throughout the application (e.g., `NotificationsBell`, custom components).
-   **`client/src/components/ui/*`:** Houses the Radix UI component library, extended with custom styles or functionalities (e.g., `button`, `badge`, `calendar`).
-   **`client/src/hooks/*`:** Contains custom React hooks for data fetching and other reusable logic (e.g., `use-mobile`, `useAccounts`, `useBuckets`).
-   **`client/src/lib/*`:** Contains utility functions and helper modules.
    -   `client/src/lib/queryClient.ts`: Configuration for TanStack Query.
    -   `client/src/lib/utils.ts`: Utility functions (e.g., `cn` for class name management).
    -   `client/src/lib/document-validation.ts`: Functions for validating and formatting Brazilian documents (CPF, CNPJ).
-    **`client/src/styles/*`:** Contains global CSS styles and Tailwind CSS configurations.  Mainly `client/src/styles/globals.css`.

## UI Component Best Practices

-   **Radix UI:** Leverage Radix UI components whenever possible to ensure consistency and accessibility. Customize these components when necessary by extending their functionality or styling.  See `client/src/components/ui/`.
-   **Accessibility:** Implement accessibility best practices in all UI components, including proper ARIA attributes, keyboard navigation support, and semantic HTML.
-   **Responsiveness:** Ensure all UI components are responsive and adapt to different screen sizes. Use Tailwind CSS's responsive modifiers to achieve this.
-   **Reusability:** Design UI components to be reusable across the application. Use props to configure the behavior and appearance of components.
-   **State Management:** Use React state or TanStack Query's caching mechanisms to manage the state of UI components. Avoid using global state unless absolutely necessary.

## Data Fetching Best Practices

-   **TanStack Query:** Use TanStack Query for all data fetching to simplify data management and caching.
-   **Custom Hooks:** Create custom hooks in `client/src/hooks/` to encapsulate data fetching logic. This makes the code more organized and reusable.
-   **Error Handling:** Implement error handling in data fetching hooks to handle network errors or API errors gracefully.
-   **Loading States:** Display loading indicators while data is being fetched to provide feedback to the user.  Use the `skeleton.tsx` component for consistent loading states.
-   **Invalidation:** Invalidate queries after mutations to ensure the UI is updated with the latest data. Use `queryClient.invalidateQueries` after a `useMutation` `onSuccess`.

## Form Handling Best Practices

-   **React Hook Form:** Use React Hook Form for form handling to simplify form state management and validation.
-   **Zod:** Use Zod for form validation to ensure the data is valid before being sent to the backend.
-   **Clear Error Messages:** Display clear and concise error messages to guide the user in correcting invalid input.
-   **Accessibility:** Ensure forms are accessible to users with disabilities by providing proper labels and ARIA attributes.
-   **Brazilian Documents:** Use the `client/src/lib/document-validation.ts` utilities for formatting and validating Brazilian documents (CPF and CNPJ).

## Testing

-   **Unit Tests:** Write unit tests for individual components to ensure they function correctly in isolation. Use Jest and React Testing Library.
-   **Integration Tests:** Write integration tests to ensure different components work together correctly.
-   **End-to-End Tests:** Consider end-to-end tests using Playwright or Cypress for critical user flows.
-   **Test Coverage:** Aim for high test coverage to ensure the codebase is well-tested and maintainable.

## Performance Optimization

-   **Code Splitting:** Use code splitting to reduce the initial bundle size and improve the loading performance of the application.
-   **Lazy Loading:** Use lazy loading to load components and images only when they are needed.
-   **Memoization:** Use memoization techniques to prevent unnecessary re-renders of components.
-   **Image Optimization:** Optimize images to reduce their file size without sacrificing quality.
-   **Avoid blocking UI:** Ensure that long-running tasks do not block the UI thread.

## Brazilian Document Handling

-   **Validation:** Utilize the functions in `client/src/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`) to validate CPF and CNPJ numbers on the client-side before submitting to the backend.
-   **Formatting:** Use the functions in `client/src/lib/document-validation.ts` (`formatCPF`, `formatCNPJ`) to format CPF and CNPJ numbers for display purposes.

## Hand-off Checklist

Before handing off completed work, ensure the following:

-   Code follows the established coding conventions and style guide.
-   Code is well-documented and easy to understand.
-   All tests pass.
-   UI is responsive and accessible.
-   Loading and error states are handled gracefully.
-   Queries are properly invalidated after mutations.
-   Performance is optimized.
-   All pull requests are reviewed and approved.
