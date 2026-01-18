---
status: filled
generated: 2026-01-18
---

# Glossary & Domain Concepts

List project-specific terminology, acronyms, domain entities, and user personas.

## Core Domain Entities

### Account
The primary organizational unit. Represents a company or organization using the cloud storage service.
- **Schema**: `shared/schema.ts:371`
- **Related**: AccountMember, AccountWithDetails
- **States**: pending, approved, suspended, active

### Bucket
Cloud storage container within an account. Supports versioning and lifecycle rules.
- **Schema**: `shared/schema.ts:374`
- **Features**: Versioning, Lifecycle Rules

### Access Key
API credentials for programmatic access to cloud storage.
- **Schema**: `shared/schema.ts:375`
- **States**: active, inactive, revoked
- **Operations**: Create, Rotate, Toggle, Revoke

### Subscription
Links an account to a product/plan with associated quotas and pricing.
- **Schema**: `shared/schema.ts:373`

### Order
Purchase or service request by an account.
- **Schema**: `shared/schema.ts:370`
- **Related**: OrderWithDetails

### Product
Service offering with pricing and features.
- **Schema**: `shared/schema.ts:369`

## User Management

### User
Authenticated individual in the system.
- **Schema**: `shared/models/auth.ts:29`
- **Related**: UpsertUser

### AccountMember
Association between a User and an Account with role assignment.
- **Schema**: `shared/schema.ts:372`
- **Roles**: owner, admin, member

### Invitation
Pending request to join an account.
- **Schema**: `shared/schema.ts:378`
- **States**: pending, accepted, cancelled

## Billing & Usage

### Invoice
Billing document for an account.
- **Schema**: `shared/schema.ts:379`

### UsageRecord
Tracks resource consumption for billing.
- **Schema**: `shared/schema.ts:380`

### QuotaRequest
Request for increased storage/resource limits.
- **Schema**: `shared/schema.ts:381`
- **States**: pending, approved, rejected

## Bucket Features

### LifecycleRule
Automated data management policy for buckets.
- **Schema**: `shared/schema.ts:357`
- **Actions**: Transition, Expiration

### Versioning
Bucket feature that maintains multiple versions of objects.

## System

### AuditLog
Record of significant system actions for compliance and debugging.
- **Schema**: `shared/schema.ts:377`
- **Tracks**: Action, User, Timestamp, Resource

### Notification
In-app message to users.
- **Schema**: `shared/schema.ts:376`
- **States**: unread, read

### SftpCredential
SFTP access credentials for bucket access.
- **Schema**: `shared/schema.ts:382`

## Acronyms & Abbreviations

| Acronym | Expansion | Context |
|---------|-----------|---------|
| CPF | Cadastro de Pessoas Físicas | Brazilian individual tax ID |
| CNPJ | Cadastro Nacional da Pessoa Jurídica | Brazilian company tax ID |
| LGPD | Lei Geral de Proteção de Dados | Brazilian data protection law |
| SFTP | SSH File Transfer Protocol | Secure file transfer |
| OIDC | OpenID Connect | Authentication protocol |
| RBAC | Role-Based Access Control | Authorization model |

## Personas / Actors

### End User
- **Goal**: Manage cloud storage for their organization
- **Workflows**: Create buckets, manage access keys, invite team members
- **Pain Points**: Quota limits, access key management

### Account Administrator
- **Goal**: Manage organization settings and team
- **Workflows**: Invite members, assign roles, manage subscriptions
- **Pain Points**: Member access control, billing management

### Platform Administrator
- **Goal**: Manage the entire platform
- **Workflows**: Approve accounts, adjust quotas, handle support
- **Pain Points**: Scaling, abuse prevention

## Domain Rules & Invariants

### Account Rules
- Account must have at least one owner
- Account status transitions: pending → approved → active/suspended
- CNPJ must be valid Brazilian company number

### Bucket Rules
- Bucket names must be unique within an account
- Lifecycle rules applied in order
- Versioning cannot be disabled once enabled (only suspended)

### Access Key Rules
- Maximum active keys per account (configurable)
- Rotation preserves key ID but regenerates secret
- Revoked keys cannot be reactivated

### Brazilian Document Validation
- CPF: 11 digits with check digits validation
- CNPJ: 14 digits with check digits validation
- Both support formatted and unformatted input
