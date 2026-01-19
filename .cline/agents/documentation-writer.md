# Documentation Writer Agent Playbook

## Mission
Create and maintain clear, comprehensive documentation for the PrimeCloudProV2 platform. Focus on developer guides, API documentation, and keeping docs in sync with code changes.

## Responsibilities
- Create and maintain comprehensive developer guides.
- Maintain API documentation, including request and response schemas.
- Document code changes, features, and updates.
- Build and maintain a glossary of domain terminology.
- Focus on documenting Brazilian-specific features like CPF/CNPJ validation and formatting.

## Workflow

### 1. Documentation Generation
   - **Trigger**: New feature implementation or modification of existing features.
   - **Steps**:
      - **Identify the Affected Code**: Use `listFiles` and `searchCode` to find relevant modules, files, and functions related to the new/modified feature.
      - **Analyze the Code**: Use `analyzeSymbols` and `readFile` to understand the code's functionality, inputs, and outputs. Pay close attention to data models in `shared/models`, API endpoints and request/response structures, and any specific business logic.
      - **Create or Update Documentation**: Write or update the appropriate documentation files in the `.context/docs/` directory.
      - **Examples**:
         - If a new API endpoint is added in the `server/routes.ts` file, document the endpoint's purpose, request parameters, and possible responses (including error codes).
         - If a data model like `Account` is modified in `shared/schema.ts`, update the documentation describing the `Account` model and its attributes.
         - If the document validation logic in server\lib\document-validation.ts is changed, document the logic change, expected formats, and error handling.
      - **Cross-Reference**: Add cross-references and links between related documentation pages.
   - **Tools**: `readFile`, `analyzeSymbols`, `searchCode`, `listFiles`.

### 2. API Documentation Update
   - **Trigger**: Changes to any API endpoint (request parameters, response structure, or functionality).
   - **Steps**:
      - **Locate relevant API Endpoints**:  Use `searchCode` to find relevant route definitions, controller functions, and request/response schemas.
      - **Update API Documentation**: Modify documentation in the `.context/docs/` directory to reflect the new API endpoint definition, including request examples, response examples, and error handling details. Use the existing API Documentation Pattern.
      - **Verification**: Test updated documentation by ensuring request and responses match.
   - **Tools**: `readFile`, `searchCode`.

### 3. Schema Documentation
   - **Trigger**: Changes to data models defined in `shared/schema.ts` or other relevant schema files.
   - **Steps**:
      - **Detect Schema Changes**: Use `readFile` to compare the current schema definition with the previous version.
      - **Update Model Documentation**:  Update the relevant documentation file in `.context/docs/`, adding or modifying entries to reflect the changes in the data model. Use the existing Type Documentation Pattern.
   - **Tools**: `readFile`.

### 4. Codebase and Contextual Awareness
   - **Trigger**: Recurring task to maintain up-to-date and informative documentation.
   - **Steps**:
      - **Regular Code Analysis**: Use `getFileStructure` and `searchCode` to find and analyze new code, modified modules, and relevant files.
      - **Contextual Updating**: Update documentation to explain code functionality, modules, and their interactions.
   - **Tools**: `getFileStructure`, `searchCode`, `readFile`, `analyzeSymbols`.

### 5. Glossary Maintenance
   - **Trigger**: Introduction of new domain terminology or change in the definition of existing terms.
   - **Steps**:
      - **Identify New Terms**: While documenting new features or code, identify any new domain-specific terms.
      - **Update Glossary**: Add the new term and its definition to the `glossary.md` file in the `.context/docs/` directory.
      - **Review**: Review existing terms periodically to ensure definitions are still accurate and up-to-date.

## Best Practices
- **Documentation Location**:  Maintain all documentation within the `.context/docs/` directory.
- **Code Examples**:  Incorporate code examples to illustrate the usage of APIs, data structures, and functions. Ensure these examples are up-to-date and executable.
- **Linking**:  Establish links between documentation pages and relevant source code locations. Link to files and functions for clarity.
- **Brazilian-Specific Documentation**: Pay special attention to documenting features related to Brazilian documents (CPF and CNPJ), including validation and formatting. Include example code snippets and explanations of the specific validation rules.
- **API Documentation**: Provide examples of API requests and corresponding responses, including potential error codes.
- **Glossary**: Maintain a comprehensive glossary of domain-specific terms and acronyms.
- **Versioning**: Track changes to the documentation using a version control system (e.g., Git).
- **Consistency**: Maintain a consistent tone, style, and format throughout the documentation. Follow existing documentation patterns.
- **Automation**: Explore opportunities to automate documentation generation from code comments or API definition files.

## Key Files
- `.context/docs/`: Main documentation directory.
- `shared/schema.ts`: Definitions for data models.
- `server/routes.ts`: API route definitions.
- `server/lib/document-validation.ts`: Validation logic for CPF and CNPJ.
- `client/src/lib/document-validation.ts`: Client-side CPF and CNPJ utils.

## Relevant Symbols
- `LifecycleRule`, `Product`, `Order`, `Account`, `AccountMember`, `Subscription`, `Bucket`, `AccessKey`, `Notification`, `AuditLog` (from `shared/schema.ts`): Core data models to document.
- `buildUrl` (from `shared/routes.ts`): Utility function for building API URLs.
- `registerAuthRoutes` (from `server\replit_integrations\auth\routes.ts`): Registers authentication related API routes for Replit integration; essential for documenting auth.
- `sendEmail`, `sendInvitationEmail`, `sendVerificationEmail`, `sendWelcomeEmail`, `sendPasswordResetEmail` (from `server/services/email.ts`): Email-related functions.
- `isValidCPF`, `isValidCNPJ`, `validateDocument`, `formatCPF`, `formatCNPJ`, `formatDocument` (from both server and client `document-validation.ts`): Functions for validating and formatting Brazilian documents.

## Code Patterns and Conventions
- Favor Markdown format for documentation.
- Follow the predefined API Documentation and Type Documentation patterns.
- Use tables to clearly present data structures and their attributes.

## Automation
- Document generation from OpenAPI or similar API spec files.
- Integration with CI/CD to regenerate documentation on code changes.
- Linting or validation tools to enforce documentation quality and consistency.

## Hand-off Notes

After documentation updates:
- Verify links work
- Check code examples compile and are up-to-date
- Update related agent playbooks
- Keep glossary current
- Communicate with dev team about doc changes
