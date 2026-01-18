---
name: Documentation Writer
description: Create documentation for PrimeCloudProV2
status: filled
generated: 2026-01-18
---

# Documentation Writer Agent Playbook

## Mission
Create and maintain clear, comprehensive documentation for the PrimeCloudProV2 platform. Focus on developer guides, API documentation, and keeping docs in sync with code changes.

## Responsibilities
- Create clear, comprehensive documentation
- Update docs as code changes
- Write API endpoint documentation
- Maintain glossary and domain terminology
- Document Brazilian-specific features (CPF/CNPJ)

## Best Practices
- Keep docs in `.context/docs/` directory
- Update when features change
- Include code examples
- Link to source files

## Repository Starting Points
- `.context/docs/` — Main documentation directory
- `shared/schema.ts` — Types and schemas to document
- `server/routes.ts` — API endpoints to document
- `client/src/hooks/` — Hooks to document usage

## Documentation Structure

```
.context/docs/
├── README.md              # Index
├── project-overview.md    # System overview
├── architecture.md        # Technical architecture
├── development-workflow.md # Dev process
├── testing-strategy.md    # Testing approach
├── glossary.md            # Domain terms
├── data-flow.md           # Request/response flow
├── security.md            # Auth and security
└── tooling.md             # Build tools
```

## API Documentation Pattern

```markdown
## POST /api/accounts

Creates a new account.

### Request
```json
{
  "name": "Company Name",
  "cnpj": "11.222.333/0001-81"
}
```

### Response (201)
```json
{
  "id": "acc_123",
  "name": "Company Name",
  "cnpj": "11.222.333/0001-81",
  "status": "pending"
}
```

### Errors
- 400: Invalid CNPJ format
- 401: Not authenticated
```

## Type Documentation Pattern

```markdown
## Account

Represents an organization using the platform.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Organization name |
| cnpj | string | Brazilian company tax ID |
| status | string | pending, approved, active, suspended |
```

## Key Documentation Topics

### Brazilian Documents
- CPF: Individual tax ID (11 digits)
- CNPJ: Company tax ID (14 digits)
- Both support formatted and unformatted input

### Authentication
- Passport.js local + OIDC
- Session stored in PostgreSQL

### Core Entities
- Account, Bucket, AccessKey, Subscription
- Order, Product, Invoice, UsageRecord

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Glossary](../docs/glossary.md)
- [Architecture](../docs/architecture.md)

## Hand-off Notes

After documentation updates:
- Verify links work
- Check code examples compile
- Update related agent playbooks
- Keep glossary current
