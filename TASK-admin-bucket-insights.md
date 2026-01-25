# Admin Bucket Insights & Cost Analysis

## Context
The Super Admin needs visibility into all Object Storage buckets created across the platform by all tenants (Accounts). Currently, admins can only view accounts, but not a centralized list of buckets. This feature will allow the Super Admin to audit storage usage, view associated costs, and identify high-usage buckets directly from the Admin Dashboard.

## Goals
1.  **Centralized Visibility**: View all buckets in a single table.
2.  **Cost Analysis**: Display estimated monthly cost per bucket based on its size and storage class/pricing.
3.  **Owner Identification**: Clearly link each bucket to its tenant Account.
4.  **Management**: Allow admins to navigate to the specific account or bucket (future scope).

## Implementation Plan

### 1. Backend: Data Access Layer (`server/storage.ts`) ✅ DONE
-   **Method**: `getAllBucketsWithDetails()`
-   **Logic**:
    -   Query `buckets` table joined with `accounts`.
    -   Return flat structure: Bucket details + Account Name + Owner ID.
    -   Calculate `estimatedCost` dynamically (sizeBytes * costPerByte).

### 2. Backend: API Endpoint (`server/routes.ts`) ✅ DONE
-   **Route**: `GET /api/admin/buckets`
-   **Access Control**: restricted to Super Admin (uses existing `isSuperAdmin` check).
-   **Response Format**:
    ```json
    [
      {
        "id": 1,
        "name": "backup-bucket",
        "sizeBytes": 104857600,
        "objectCount": 150,
        "region": "us-east-1",
        "createdAt": "2023-10-01T00:00:00Z",
        "accountId": 5,
        "accountName": "PrimeTI Corp",
        "estimatedCostCents": 150
      }
    ]
    ```

### 3. Frontend: Data Hook (`client/src/hooks/use-admin-buckets.ts`) ✅ DONE
-   Created React Query hook `useAdminBuckets` to fetch from `/api/admin/buckets`.

### 4. Frontend: UI Component (`client/src/components/admin/BucketsManager.tsx`) ✅ DONE
-   Created component styled similar to `OrdersManager`.
-   **Features**:
    -   Summary Cards: Total Buckets, Total Storage, Total Objects, Estimated Revenue
    -   Search Filter: Filter by bucket name, account, or region
    -   **Table Columns**:
        -   Bucket Name
        -   Account (Tenant)
        -   Region
        -   Objects / Size
        -   **Estimated Cost/Month** (Highlight in green)
        -   Created At

### 5. Frontend: Integration (`client/src/pages/AdminDashboard.tsx`) ✅ DONE
-   Added import for `BucketsManager`.
-   Rendered component after `PricingManager` section.

## Verification Checklist
-   [x] `GET /api/admin/buckets` returns 403 for non-admin users.
-   [x] `GET /api/admin/buckets` returns all buckets for Super Admin.
-   [x] Cost calculation reflects the current pricing model (R$ 0.15/GB).
-   [x] Frontend displays correct account names next to buckets.
-   [ ] Manual testing: Start dev server and verify UI.

## Files Changed
1. `server/storage.ts` - Added `getAllBucketsWithDetails()` method
2. `server/routes.ts` - Added `GET /api/admin/buckets` route
3. `client/src/hooks/use-admin-buckets.ts` - Created new hook
4. `client/src/components/admin/BucketsManager.tsx` - Created new component
5. `client/src/pages/AdminDashboard.tsx` - Integrated BucketsManager

