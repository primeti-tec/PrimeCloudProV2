# Manual Billing System & Invoicing Plan

## Context
The user wants a mechanism to bill clients monthly for platform usage and storage space without a direct payment gateway integration for now. The system should generate billing amounts based on usage, create invoices, send them to clients (via email), and allow manual settlement (marking as paid).

## Goals
1.  **Automated Calculation**: Calculate monthly costs based on storage and bandwidth usage.
2.  **Invoice Generation**: Create invoice records in the database.
3.  **Delivery**: Send invoice notifications to clients via email.
4.  **Client Visibility**: Allow clients to view invoices and payment instructions (PIX/Transfer).
5.  **Admin Management**: Allow admins to trigger billing cycles and manually mark invoices as paid.

## Architecture

### 1. Backend (`server/`)
*   **API Routes**:
    *   `POST /api/admin/invoices/generate-monthly`: Triggers the billing cycle for all active accounts.
    *   `GET /api/admin/invoices`: Lists all invoices for admin review.
    *   `PATCH /api/admin/invoices/:id/status`: To mark an invoice as 'paid'.
    *   `GET /api/invoices`: For clients to view their own invoices.
*   **Storage Logic (`server/storage.ts`)**:
    *   `generateMonthlyInvoices()`: Iterates accounts, calculates `getUsageSummary`, and inserts `invoices`.
    *   `markInvoicePaid(id)`: Updates status.
*   **Email Service**:
    *   Reuse `sendInvoiceEmail` to notify users.

### 2. Frontend (`client/`)
*   **Admin Dashboard**:
    *   New "Faturamento" (Billing) Tab.
    *   "Gerar Faturas do Mês" Button.
    *   Table of Invoices (Account, Amount, Status, Actions: Mark Paid).
*   **Client Billing Page (`Billing.tsx`)**:
    *   List User Invoices.
    *   "Pagar" button (opens Modal with PIX Key/Bank Info).
    *   Status indicator (Pending, Paid).

## Schema Changes
*   **Update `accounts` table**:
    *   `billingEmail`: Email specific for invoices (optional, fallback to owner email).
    *   `financialContact`: Name of the financial responsible person.
    *   `billingDay`: Preferred day of month for invoice generation/due date (e.g., 5, 10, 15).

## Implementation Steps

### Step 0: Database Migration
*   Update `shared/schema.ts` to include new billing fields in `accounts`.
*   Run migration (push to DB).

### Step 1: Backend - Invoice Generation Logic
*   Implement `generateMonthlyInvoices` in `DatabaseStorage`.
    *   Fetch all active accounts.
    *   For each:
        *   Get usage via `getUsageSummary`.
        *   Calculate total based on Plan + Excess Usage.
        *   Insert into `invoices` table.
        *   (Turbo) Send email immediately.

### Step 2: Backend - API Endpoints
*   Create routes in `server/routes.ts`.

### Step 3: Frontend - Admin Billing Manager
*   Create `components/admin/InvoicesManager.tsx`.
*   Connect to `useAdminInvoices` hook (needs creation).
*   Add action to "Mark as Paid".

### Step 4: Frontend - Client Billing View
*   Update `pages/Billing.tsx` to fetch and display real invoices from `/api/invoices`.
*   Add a "Payment Instructions" modal displaying the PIX Key (Hardcoded/Configurable).

## Schema Check
*   `invoices` table already exists in `shared/schema.ts`.
    *   Fields: `accountId`, `invoiceNumber`, `totalAmount`, `status`, `pdfUrl`, etc.
*   No schema changes required.

## User Actions Required
*   Admin clicks "Gerar Faturas" at the end of the month.
*   System creates invoices and emails clients.
*   Client pays via PIX.
*   Admin checks bank account and clicks "Confirmar Pagamento" in the Dashboard.

## Verification
*   [x] Admin can generate invoices.
*   [x] Invoice amount matches usage calculation.
*   [x] Client receives email.
*   [x] Client sees invoice in dashboard.
*   [x] Admin can mark invoice as paid.
*   [x] Schema updated with Billing Contact fields.
*   [x] Client settings updated to manage Billing Contact.

## Status: COMPLETED ✅
System is ready for manual billing cycles. Admin initiates via Dashboard, Users view/pay via PIX instructions, Admin confirms payment manually.
