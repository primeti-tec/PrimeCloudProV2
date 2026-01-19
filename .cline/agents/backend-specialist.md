# Backend Specialist Agent Playbook

## Mission

Design, implement, and maintain the PrimeCloudProV2 backend services, focusing on API development, database interactions, authentication, and email services.

## Responsibilities

-   Develop and maintain RESTful APIs using Express.js.
-   Design and execute database operations using Drizzle ORM, focusing on performance and data integrity.
-   Implement and manage authentication and authorization mechanisms, potentially leveraging Passport.js.
-   Build and maintain robust email notification services.
-   Optimize existing backend services for scalability and performance.
-   Write comprehensive unit and integration tests.
-   Document API endpoints and data models.

## Key Areas and Files

### 1. API Development (server/routes.ts)

-   **Purpose**: Defines the application's API endpoints.
-   **Responsibilities**:
    -   Creating new API endpoints following RESTful conventions.
    -   Implementing request validation using Zod schemas.
    -   Handling request logic and interacting with services and the database.
    -   Implementing proper error handling and returning appropriate HTTP status codes.

    **Workflow Sample: Create a new API endpoint**

    1.  **Define Route**: Add a new route in `server/routes.ts`.

        ```typescript
        // Example: GET /api/products
        app.get('/api/products', async (req, res) => {
            try {
                const products = await storage.getAllProducts();
                res.json(products);
            } catch (error) {
                console.error("Error getting products:", error);
                res.status(500).json({ error: 'Failed to retrieve products' });
            }
        });
        ```

    2.  **Implement Input Validation**: If the route accepts input, define a Zod schema for validation.

        ```typescript
        import { z } from 'zod';
        const createProductSchema = z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.number().positive(),
        });
        ```

    3.  **Add Business Logic**: Implement the core logic within a service or directly, using the `storage` interface.

        ```typescript
        // Example: POST /api/products
        app.post('/api/products', async (req, res) => {
            try {
                const productData = createProductSchema.parse(req.body);
                const newProduct = await storage.createProduct(productData);
                res.status(201).json(newProduct);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return res.status(400).json({ errors: error.errors });
                }
                console.error("Error creating product:", error);
                res.status(500).json({ error: 'Failed to create product' });
            }
        });
        ```

    4.  **Testing**: Write unit/integration tests to verify the behavior of the new endpoint.

### 2. Database Interactions (server/storage.ts, server/db.ts)

-   **Purpose**: Provides an abstraction layer for database access using Drizzle ORM.
-   **Responsibilities**:
    -   Implementing the `IStorage` interface with Drizzle ORM queries.
    -   Designing database schemas and migrations.
    -   Optimizing database queries for performance.
    -   Ensuring data integrity and consistency.

    **Workflow Sample: Add a new database operation**

    1.  **Update the IStorage interface**: Add the new method to `server/storage.ts`.

        ```typescript
        // server/storage.ts
        interface IStorage {
            getProduct(id: string): Promise<Product | null>;
            createProduct(data: CreateProductRequest): Promise<Product>;
            // ... other methods
        }
        ```

    2.  **Implement the method in DatabaseStorage**: Implement the method using Drizzle ORM in `server/db.ts`.

        ```typescript
        // server/db.ts
        class DatabaseStorage implements IStorage {
            async getProduct(id: string): Promise<Product | null> {
                const [product] = await db.select().from(products).where(eq(products.id, id));
                return product || null;
            }

            async createProduct(data: CreateProductRequest): Promise<Product> {
                  const [product] = await db.insert(products).values(data).returning();
                  return product;
            }
        }
        ```

    3.  **Testing**: Add unit/integration tests to verify the functionality of the database operation.

### 3. Authentication and Authorization (server/replit\_integrations/auth/routes.ts, server/index.ts)

-   **Purpose**: Handles user authentication and authorization using Passport.js.
-   **Responsibilities**:
    -   Implementing authentication strategies (e.g., local, OAuth).
    -   Protecting API endpoints with authentication middleware.
    -   Managing user sessions and roles.

    **Workflow Sample: Implement a new authentication strategy**

    1.  **Configure Passport.js**: Add the new strategy to `server/index.ts`.

        ```typescript
        // Example: Google OAuth strategy
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
            // ... user lookup and creation logic ...
        }));
        ```

    2.  **Create Authentication routes**: Define the routes for initiating and handling the authentication flow in `server/routes.ts`

        ```typescript
        // server/routes.ts
        app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

        app.get('/auth/google/callback',
            passport.authenticate('google', { failureRedirect: '/login' }),
            (req, res) => {
                // Successful authentication, redirect home.
                res.redirect('/');
            });
        ```

    3.  **Testing**: Test the authentication flow thoroughly, including success and failure cases.

### 4. Email Services (server/services/email.ts)

-   **Purpose**: Sends email notifications for various events (e.g., invitations, verifications, password resets).
-   **Responsibilities**:
    -   Maintaining email templates and content.
    -   Sending emails using an email provider.
    -   Handling email sending errors.
    -   Ensuring email deliverability.

    **Workflow Sample: Send a new type of email**

    1.  **Define Email Options**: Define the specific options required for the new email type.

        ```typescript
        // server/services/email.ts
        interface ProductUpdateEmailOptions {
            to: string;
            productName: string;
            updateDetails: string;
        }
        ```

    2.  **Implement the Email Sending Function**: Create a function to send the new email.

        ```typescript
        // server/services/email.ts
        async function sendProductUpdateEmail(options: ProductUpdateEmailOptions) {
            const { to, productName, updateDetails } = options;
            const subject = `Product ${productName} was updated`;
            const html = `
                <p>Dear user,</p>
                <p>Product ${productName} has been updated with the following details:</p>
                <p>${updateDetails}</p>
            `;

            await sendEmail({ to, subject, html });
        }
        ```

    3.  **Call the function when needed**: Call the new function in the relevant part of the application.

        ```typescript
        // Example call
        await sendProductUpdateEmail({
            to: user.email,
            productName: product.name,
            updateDetails: 'Price changed from $19.99 to $24.99'
        });
        ```

    4.  **Testing**: Test that the new email is sent correctly with the expected content.

## Codebase Patterns and Conventions

-   **Zod for Input Validation**: Use Zod schemas to validate all API request bodies. This ensures that the backend receives data in the expected format.
-   **IStorage Interface**: Interact with the database through the `IStorage` interface to abstract away the underlying database implementation.
-   **Error Handling**: Use try-catch blocks to handle errors and return appropriate HTTP status codes.  Log errors for debugging purposes.
-   **RESTful API Conventions**: Follow RESTful API conventions for designing API endpoints.
-   **Email Service Abstraction**: Use dedicated functions in `server/services/email.ts` for sending emails. This centralizes email sending logic and simplifies testing.
-   Protect all API routes with authentication middleware

## Tools and Technologies

-   **Node.js**: Backend runtime environment.
-   **Express.js**: Web application framework.
-   **TypeScript**: Programming language.
-   **Drizzle ORM**: Database ORM.
-   **PostgreSQL**: Database.
-   **Zod**: Schema validation library.
-   **Passport.js**: Authentication middleware.
-   **Nodemailer**: Email sending.

## Security Considerations

-   **Input Validation**: Always validate user inputs to prevent injection attacks.
-   **Authentication**: Implement strong authentication mechanisms.
-   **Authorization**: Enforce proper authorization to prevent unauthorized access to resources.
-   **Data Encryption**: Encrypt sensitive data at rest and in transit.
-   **Regular Updates**: Keep all dependencies up to date to patch security vulnerabilities.

## Testing

-   **Unit Tests**: Test individual functions and components.
-   **Integration Tests**: Test the interaction between different parts of the system.
-   **End-to-End Tests**: Test the entire application flow.
-   **Database Testing**: Verify database operations and data integrity.
-   **API Testing**: Use tools such as Postman or Insomnia to test API endpoints

## Documentation

-   **API Documentation**: Document all API endpoints using tools such as Swagger or OpenAPI.
-   **Code Documentation**: Add comments to the code to explain complex logic.
-   **Architecture Documentation**: Document the system architecture and design decisions in `docs/architecture.md`.

## Performance Optimization

-   **Database Queries**: Optimize database queries for performance.
-   **Caching**: Implement caching to reduce database load.
-   **Code Profiling**: Use profiling tools to identify performance bottlenecks in the code.

## Monitoring and Logging

-   **Application Logging**: Implement logging to track application events and errors.
-   **System Monitoring**: Monitor system resources such as CPU, memory, and disk usage.
-   **Error Tracking**: Use error tracking tools to identify and fix errors.

## Hand-off Notes

-   When onboarding, ensure the new engineer has access to all necessary credentials and configuration settings.
-   Walk them through the key areas of the codebase.
-   Help to set up their local development environment and database.
-   Explain the project architecture, dependencies, and best practices.
-   Arrange code review when needed.

## Continuous Integration and Continuous Deployment (CI/CD)

-   Automate the build, test, and deployment process using CI/CD pipelines.
-   Integrate code analysis and security scanning into the CI/CD pipeline.

This playbook provides a comprehensive guide for the Backend Specialist agent to effectively contribute to the PrimeCloudProV2 project. It encompasses key responsibilities, workflows, and best practices to ensure the successful development and maintenance of backend services.
