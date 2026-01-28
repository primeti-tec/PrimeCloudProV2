# Admin Management Enhancements

## Context
The user requires enhanced management capabilities in the Admin Dashboard for Orders, Users, and Invoices. Additionally, the "Confirm Payment" functionality is currently non-functional and needs debugging.

## Goals
1.  **Order Management**: Add options to Deny, Cancel, and Delete orders.
2.  **User Management**: Add functionality to delete Inactive and Suspended accounts.
3.  **Invoice Management**: Add functionality to delete invoices.
4.  **Bug Fix**: Resolve the issue with "Confirm Payment" not working.

## Proposed Changes

### 1. Backend Updates

#### Shared Schema & Routes (`shared/routes.ts`, `shared/schema.ts`)
-   **Orders**:
    -   Update `orders` status enum to include `denied`.
    -   Add `DELETE /api/admin/orders/:id` endpoint definition.
    -   Add `POST /api/admin/orders/:id/deny` endpoint definition (or reuse update).
    -   Add `POST /api/admin/orders/:id/cancel` endpoint definition (or reuse update).
-   **Users/Accounts**:
    -   Add `DELETE /api/admin/accounts/:id` endpoint definition.
    -   (Optional) Add `DELETE /api/admin/accounts/cleanup` for bulk deletion of inactive/suspended users.
-   **Invoices**:
    -   Add `DELETE /api/admin/invoices/:id` endpoint definition.

#### Server Implementation (`server/routes.ts`, `server/storage.ts`)
-   **Orders**:
    -   Implement `deleteOrder(id)` in storage.
    -   Implement route handlers for delete/deny/cancel in `server/routes.ts` (Admin protected).
-   **Users**:
    -   Implement `deleteAccount(id)` in storage. **Critical**: Ensure cascading usage/data is handled (or soft delete).
    -   Implement route handler for deleting accounts.
-   **Invoices**:
    -   Implement `deleteInvoice(id)` in storage.
    -   Implement route handler for deletion.
-   **Payment Confirmation**:
    -   Investigate `PATCH /api/admin/invoices/:id/paid`. Check permissions and logic.

### 2. Frontend Updates

#### Admin Orders Page (`client/src/pages/Orders.tsx` or `AdminDashboard.tsx`)
-   Add "Actions" column to the Orders table.
-   Add buttons/dropdown items:
    -   **Negar (Deny)**: Sets status to `denied`.
    -   **Cancelar (Cancel)**: Sets status to `canceled`.
    -   **Deletar (Delete)**: Removes the order permanently.
-   Connect these actions to the new API endpoints.

#### Admin Users Page (`client/src/pages/AdminDashboard.tsx`?)
-   Review Account List.
-   Add "Delete" action for accounts with status `inactive` or `suspended`.
-   Add confirmation modal (destructive action).

#### Admin Invoices Page (`client/src/pages/Billing.tsx` or `AdminDashboard.tsx`)
-   Add "Delete" action for invoices.
-   **Debug "Confirm Payment"**:
    -   Check the request payload and URL.
    -   Verify error response (401/403/500).
    -   Fix the API call if it's malformed or pointing to the wrong endpoint.

## Plan Steps

1.  **Schema Update**: Modify `shared/schema.ts` to include `denied` order status. Update `shared/routes.ts` with new endpoints.
2.  **Backend Implementation**: Implement storage methods and API routes in `server`.
3.  **Frontend Implementation - Orders**: Update the Orders management UI.
4.  **Frontend Implementation - Users**: Update the User management UI.
5.  **Frontend Implementation - Invoices**: Update the Invoice management UI.
6.  **Debug Payment**: Fix the confirmation bug.
7.  **Verification**: Test all new actions and the fix.

## Verification
-   Create a test order -> Deny it -> Verify status.
-   Create a test order -> Cancel it -> Verify status.
-   Create a test order -> Delete it -> Verify removal.
-   Create a test user -> Suspend -> Delete -> Verify removal.
-   Create a test invoice -> Delete -> Verify removal.
-   Create a test invoice -> Confirm Payment -> Verify status becomes 'paid'.
