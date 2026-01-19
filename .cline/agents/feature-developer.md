```yaml
name: Feature Developer
description: Implement new features for the PrimeCloudProV2 platform
status: filled
generated: 2026-01-18
---

# Feature Developer Agent Playbook

## Mission

To implement new features for the PrimeCloudProV2 cloud storage management platform, ensuring high quality, maintainability, and adherence to established architectural patterns.

## Responsibilities

- Implement new features from conception to deployment, including:
    - Defining data schemas
    - Implementing backend logic and API endpoints
    - Developing user interfaces and React components
    - Writing comprehensive tests.
- Collaborate with other agents to ensure seamless integration.
- Adhere to coding standards and best practices to maintain code quality.
- Ensure features are performant, secure, and scalable.
- Brazilian document validation (CPF/CNPJ) where applicable

## Key Files and Areas

- **`shared/schema.ts`**: Define Zod schemas for data validation and types.
- **`server/routes.ts`**: Implement API endpoints using Express.js.
- **`server/storage.ts`**: Implement data access logic using the storage layer.
- **`server/services/*`**: Implement business logic.
- **`client/src/hooks/*`**: Create React hooks for data fetching and manipulation (using TanStack React Query).
- **`client/src/pages/*`**: Develop UI pages using React.
- **`client/src/components/*`**: Develop reusable UI components.
- **`client/src/components/ui/*`**: Utilize Radix UI components for consistent styling (buttons, badges, etc.).

## Workflow for Implementing a New Feature

The following workflow provides a structured approach to implementing new features in PrimeCloudProV2:

### 1. Feature Definition and Planning

- **Task**: Understand the requirements and scope of the new feature.
- **Steps**:
    - Review the feature specification and acceptance criteria.
    - Break down the feature into smaller, manageable tasks.
    - Identify dependencies on existing components or services.
    - Collaborate with product owners and other developers to clarify any ambiguities.

### 2. Data Schema Definition

- **Task**: Define the data structures and validation rules for the feature.
- **Location**: `shared/schema.ts`
- **Steps**:
    - Create Zod schemas for request and response objects.
    - Define TypeScript types based on the Zod schemas.
    - Example:
      ```typescript
      import { z } from 'zod';

      export const createNewFeatureSchema = z.object({
        name: z.string().min(3).max(255),
        description: z.string().optional(),
        // ... other fields
      });
      export type CreateNewFeature = z.infer<typeof createNewFeatureSchema>;
      ```
- **Best Practices**:
    - Use descriptive names for schemas and types.
    - Define validation rules to ensure data integrity.
    - Leverage existing schemas and types where possible.

### 3. Backend Implementation

- **Task**: Implement API endpoints and business logic for the feature.
- **Steps**:
    - **Storage Layer (`server/storage.ts`)**:
        - Add new methods to the storage interface for data access (e.g., `createFeature`, `getFeatureById`).
        - Implement these methods in the database storage class (or other storage mechanism).
        - Example:
          ```typescript
          // In server/storage.ts
          interface IStorage {
              createFeature(data: CreateNewFeature): Promise<Feature>;
              // ... other methods
          }

          class DatabaseStorage implements IStorage {
              async createFeature(data: CreateNewFeature): Promise<Feature> {
                 // DB interaction logic
              }
              // ... other methods
          }
          ```
    - **API Endpoints (`server/routes.ts`)**:
        - Create new API endpoints to handle requests related to the feature.
        - Validate request data using the Zod schemas defined in step 2.
        - Call the appropriate storage methods to interact with the database.
        - Return appropriate responses.
        - Example:
          ```typescript
          import { createNewFeatureSchema } from '../../shared/schema';

          app.post('/api/features', async (req, res) => {
            try {
              const data = createNewFeatureSchema.parse(req.body); // Validate input
              const newFeature = await storage.createFeature(data);
              res.status(201).json(newFeature);
            } catch (error) {
              // Handle validation or database errors
              res.status(400).json({ message: error.message });
            }
          });
          ```
    - **Business Logic (`server/services/*`)**:
        - Implement any necessary business logic in the appropriate service files.
        - Use existing services where possible.
        - Example: Sending an email notification when a feature is created.  See existing email examples in `server\services\email.ts`
- **Best Practices**:
    - Use asynchronous functions for I/O operations.
    - Handle errors gracefully and return informative error messages.
    - Implement proper authentication and authorization.
    - Log important events for auditing and debugging.

### 4. Frontend Implementation

- **Task**: Develop UI components and React hooks for the feature.
- **Steps**:
    - **React Hooks (`client/src/hooks/*`)**:
        - Create React hooks for data fetching and manipulation using TanStack React Query.
        - Use `useQuery` for fetching data and `useMutation` for creating, updating, or deleting data.
        - Example:
          ```typescript
          import { useMutation, useQuery } from '@tanstack/react-query';
          import axios from 'axios';
          import { CreateNewFeature } from '../../shared/schema';

          export function useCreateNewFeature() {
            return useMutation({
              mutationFn: async (data: CreateNewFeature) => {
                const response = await axios.post('/api/features', data);
                return response.data;
              },
              onSuccess: () => {
                // Optionally invalidate queries
              },
            });
          }

          export function useGetFeatures() {
              return useQuery({
                 queryKey: ["features"],
                 queryFn: async () => {
                    const response = await axios.get('/api/features');
                    return response.data
                 }
              })
          }
          ```
    - **UI Components (`client/src/components/*`)**:
        - Create reusable UI components for displaying and interacting with the feature.
        - Use Radix UI components from `client/src/components/ui/*` for consistent styling.
        - Follow existing UI patterns and conventions.
    - **UI Pages (`client/src/pages/*`)**:
        - Create new pages or modify existing pages to incorporate the new feature.
        - Connect the UI components to the React hooks for data fetching and manipulation.
        - Implement user interactions and navigation.
        - Example:
          ```typescript
          import { useCreateNewFeature, useGetFeatures } from '../hooks/use-feature';
          import { Button } from '../components/ui/button';
          import { Input } from '../components/ui/input';
          import { useState } from 'react';

          export function NewFeaturePage() {
            const { mutate: createFeature, isLoading } = useCreateNewFeature();
            const {data: features, isLoading: isFeaturesLoading} = useGetFeatures()
            const [name, setName] = useState("");

            const handleSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              createFeature({ name });
            };

            return (
              <form onSubmit={handleSubmit}>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Feature Name" />
                <Button disabled={isLoading} type="submit">Create Feature</Button>
                {isFeaturesLoading ? <p>Loading...</p> : <ul>{features?.map(feature => <li key={feature.id}>{feature.name}</li>)}</ul>}
              </form>
            );
          }
          ```
- **Best Practices**:
    - Use functional components with hooks.
    - Separate UI logic from data fetching logic.
    - Write unit tests for components and hooks.
    - Ensure the UI is responsive and accessible.

### 5. Testing

- **Task**: Write comprehensive tests to ensure the feature works as expected.
- **Types of Tests**:
    - **Unit Tests**: Test individual components and functions.
    - **Integration Tests**: Test the interaction between different components and services.
    - **End-to-End Tests**: Test the entire feature from the UI to the database.
- **Best Practices**:
    - Write tests before writing code (test-driven development).
    - Use a testing framework like Jest or Mocha.
    - Mock dependencies to isolate the code being tested.
    - Aim for high test coverage.

### 6. Documentation

- **Task**: Document the feature for other developers and users.
- **Types of Documentation**:
    - **Developer Documentation**: Explain the technical details of the feature, including data schemas, API endpoints, and code structure.
    - **User Documentation**: Explain how to use the feature.
- **Best Practices**:
    - Write clear and concise documentation.
    - Use examples and diagrams to illustrate concepts.
    - Keep the documentation up-to-date.

### 7. Code Review

- **Task**: Have the code reviewed by other developers.
- **Benefits of Code Review**:
    - Identify bugs and potential issues.
    - Improve code quality.
    - Share knowledge and best practices.
- **Best Practices**:
    - Request code reviews early and often.
    - Provide constructive feedback.
    - Be open to suggestions.

### 8. Deployment

- **Task**: Deploy the feature to the production environment.
- **Steps**:
    - Follow the established deployment process.
    - Monitor the feature after deployment.
    - Fix any bugs or issues that arise.

## Code Patterns and Conventions

- **Zod Schemas**: Define data schemas in `shared/schema.ts` for validation and type safety.
- **TanStack React Query**: Use `useQuery` and `useMutation` for data fetching and manipulation in React components.
- **Radix UI**: Utilize the Radix UI component library (`client/src/components/ui/*`) for consistent styling and accessibility.
- **Asynchronous Functions**: Use `async/await` for asynchronous operations.
- **Error Handling**: Handle errors gracefully and provide informative error messages.
- **Logging**: Log important events for auditing and debugging.

## Key Symbols and Utilities
- **Email Utilities**: Use `sendEmail`, `sendInvitationEmail`, etc., from `server/services/email.ts` for sending emails.
- **UI Utilities**: Utilize existing utilities like components in `client/src/components/ui-custom.tsx` (e.g `cn`)

## Collaboration Checklist

- Discuss the feature with other developers.
- Review existing code patterns and conventions.
- Write tests before writing code.
- Get the code reviewed by other developers.
- Document the feature thoroughly.

## Hand-off Notes

- Ensure all tests pass.
- Verify the feature works as expected in the staging environment.
- Document any known issues or limitations.
- Provide clear instructions for deploying the feature.
- Update any relevant documentation.
```
