import { z } from 'zod';
import { insertAccountSchema, insertProductSchema, insertBucketSchema, insertAccessKeySchema, insertOrderSchema, accounts, products, accountMembers, subscriptions, buckets, accessKeys, invoices, usageRecords, orders, type AccountWithRole } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Public Products
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
  },
  // Accounts (Tenants)
  accounts: {
    create: {
      method: 'POST' as const,
      path: '/api/accounts',
      input: insertAccountSchema,
      responses: {
        201: z.custom<typeof accounts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    listMy: {
      method: 'GET' as const,
      path: '/api/my-accounts',
      responses: {
        200: z.array(z.custom<AccountWithRole>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:id',
      responses: {
        200: z.custom<typeof accounts.$inferSelect & { subscription?: typeof subscriptions.$inferSelect & { product: typeof products.$inferSelect } }>(),
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/accounts/:id',
      input: insertAccountSchema.partial(),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Members
  members: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/members',
      responses: {
        200: z.array(z.custom<typeof accountMembers.$inferSelect & { user: { email: string | null, firstName: string | null, lastName: string | null } }>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/members',
      input: z.object({ email: z.string().email(), role: z.enum(['admin', 'developer', 'owner']) }),
      responses: {
        201: z.custom<typeof accountMembers.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/members/:memberId',
      responses: {
        200: z.void(),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Subscriptions (Simple Mock)
  subscriptions: {
    subscribe: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/subscribe',
      input: z.object({ productId: z.number() }),
      responses: {
        201: z.custom<typeof subscriptions.$inferSelect>(),
      },
    },
  },
  // Admin (Provider)
  admin: {
    listAccounts: {
      method: 'GET' as const,
      path: '/api/admin/accounts',
      responses: {
        200: z.array(z.custom<typeof accounts.$inferSelect>()),
      },
    },
    approveAccount: {
      method: 'POST' as const,
      path: '/api/admin/accounts/:id/approve',
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
      },
    },
    rejectAccount: {
      method: 'POST' as const,
      path: '/api/admin/accounts/:id/reject',
      input: z.object({ reason: z.string().optional() }),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
      },
    },
    suspendAccount: {
      method: 'POST' as const,
      path: '/api/admin/accounts/:id/suspend',
      input: z.object({ reason: z.string().optional() }),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
      },
    },
    reactivateAccount: {
      method: 'POST' as const,
      path: '/api/admin/accounts/:id/reactivate',
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
      },
    },
    adjustQuota: {
      method: 'POST' as const,
      path: '/api/admin/accounts/:id/adjust-quota',
      input: z.object({
        quotaGB: z.number().min(1),
        manualBandwidthGB: z.number().optional(),
        reason: z.string().min(1)
      }),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
      },
    },
    listProducts: {
      method: 'GET' as const,
      path: '/api/admin/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    createProduct: {
      method: 'POST' as const,
      path: '/api/admin/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
      },
    },
    updateProduct: {
      method: 'PATCH' as const,
      path: '/api/admin/products/:id',
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
      },
    },
    deleteProduct: {
      method: 'DELETE' as const,
      path: '/api/admin/products/:id',
      responses: {
        200: z.void(),
      },
    },
    getStats: {
      method: 'GET' as const,
      path: '/api/admin/stats',
      responses: {
        200: z.object({
          totalMrr: z.number(),
          projectedRevenue: z.number(),
          activeAccounts: z.number(),
          pendingAccounts: z.number(),
          suspendedAccounts: z.number(),
          totalAccounts: z.number(),
          newSignupsThisMonth: z.number(),
          mrrHistory: z.array(z.object({ name: z.string(), mrr: z.number() })),
          signupsHistory: z.array(z.object({ name: z.string(), signups: z.number() })),
        }),
      },
    },
  },
  // Buckets
  buckets: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets',
      responses: {
        200: z.array(z.custom<typeof buckets.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/buckets',
      input: insertBucketSchema.pick({ name: true, region: true, isPublic: true, storageLimitGB: true }),
      responses: {
        201: z.custom<typeof buckets.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    updateLimit: {
      method: 'PATCH' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/limit',
      input: z.object({ limit: z.number().min(1) }),
      responses: {
        200: z.custom<typeof buckets.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId',
      responses: {
        200: z.void(),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Bucket Objects (File Management)
  objects: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects',
      responses: {
        200: z.object({
          objects: z.array(z.object({
            name: z.string(),
            size: z.number(),
            lastModified: z.string(),
            etag: z.string().optional(),
          })),
          prefixes: z.array(z.string()),
          prefix: z.string().optional(),
        }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    getUploadUrl: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/upload-url',
      input: z.object({
        filename: z.string().min(1),
        contentType: z.string().optional(),
        prefix: z.string().optional(),
      }),
      responses: {
        200: z.object({
          uploadUrl: z.string(),
          objectKey: z.string(),
        }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    getDownloadUrl: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/download-url',
      responses: {
        200: z.object({
          downloadUrl: z.string(),
        }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects',
      input: z.object({
        key: z.string().min(1),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  objectFavorites: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/favorites',
      responses: {
        200: z.object({ keys: z.array(z.string()) }),
        403: errorSchemas.forbidden,
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/favorites',
      input: z.object({ key: z.string().min(1) }),
      responses: {
        201: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/favorites',
      input: z.object({ key: z.string().min(1) }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
  },
  objectTags: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/tags',
      responses: {
        200: z.object({ tags: z.array(z.object({ key: z.string(), tags: z.array(z.string()) })) }),
        403: errorSchemas.forbidden,
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/tags',
      input: z.object({ key: z.string().min(1), tag: z.string().min(1) }),
      responses: {
        201: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/tags',
      input: z.object({ key: z.string().min(1), tag: z.string().min(1) }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
  },
  objectShares: {
    listByMe: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/shares',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          bucketId: z.number(),
          objectKey: z.string(),
          sharedWithEmail: z.string().nullable(),
          access: z.string(),
          token: z.string(),
          expiresAt: z.string().nullable(),
          createdAt: z.string().nullable(),
          shareUrl: z.string(),
        })),
        403: errorSchemas.forbidden,
      },
    },
    listWithMe: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/shares/with-me',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          bucketId: z.number(),
          objectKey: z.string(),
          sharedWithEmail: z.string().nullable(),
          access: z.string(),
          token: z.string(),
          expiresAt: z.string().nullable(),
          createdAt: z.string().nullable(),
          shareUrl: z.string(),
        })),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/shares',
      input: z.object({
        key: z.string().min(1),
        sharedWithEmail: z.string().email().optional(),
        access: z.enum(["read", "download"]).optional(),
        expiresAt: z.string().optional(),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          token: z.string(),
          shareUrl: z.string(),
          access: z.string(),
          expiresAt: z.string().nullable(),
        }),
        403: errorSchemas.forbidden,
      },
    },
    revoke: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/buckets/:bucketId/objects/shares/:shareId',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Access Keys
  accessKeys: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/access-keys',
      responses: {
        200: z.array(z.custom<typeof accessKeys.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/access-keys',
      input: insertAccessKeySchema.pick({ name: true, permissions: true }),
      responses: {
        201: z.custom<typeof accessKeys.$inferSelect & { rawSecret: string }>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    revoke: {
      method: 'DELETE' as const,
      path: '/api/accounts/:accountId/access-keys/:keyId',
      responses: {
        200: z.void(),
        403: errorSchemas.forbidden,
      },
    },
    rotate: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/access-keys/:keyId/rotate',
      responses: {
        200: z.custom<typeof accessKeys.$inferSelect & { rawSecret: string }>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    toggleActive: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/access-keys/:keyId/toggle-active',
      responses: {
        200: z.custom<typeof accessKeys.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  // Invoices
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/invoices',
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Usage
  usage: {
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/usage',
      responses: {
        200: z.object({
          storageUsedGB: z.number(),
          bandwidthUsedGB: z.number(),
          apiRequestsCount: z.number(),
          projectedCost: z.number(),
          pricePerStorageGB: z.number().optional(),
          pricePerTransferGB: z.number().optional(),
          buckets: z.array(z.object({
            name: z.string(),
            sizeBytes: z.number(),
            storageLimitGB: z.number(),
          })),
        }),
        403: errorSchemas.forbidden,
      },
    },
  },
  // Quota Requests
  quotaRequests: {
    create: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/quota-requests',
      input: z.object({
        requestedQuotaGB: z.number().min(1),
        reason: z.string().optional(),
      }),
      responses: {
        201: z.any(),
        403: errorSchemas.forbidden,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/quota-requests',
      responses: {
        200: z.array(z.any()),
        403: errorSchemas.forbidden,
      },
    },
    listPending: {
      method: 'GET' as const,
      path: '/api/admin/quota-requests',
      responses: {
        200: z.array(z.any()),
      },
    },
    approve: {
      method: 'POST' as const,
      path: '/api/admin/quota-requests/:id/approve',
      input: z.object({ note: z.string().optional() }),
      responses: {
        200: z.any(),
      },
    },
    reject: {
      method: 'POST' as const,
      path: '/api/admin/quota-requests/:id/reject',
      input: z.object({ note: z.string().optional() }),
      responses: {
        200: z.any(),
      },
    },
  },
  // Orders
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/orders',
      input: z.object({
        productId: z.number(),
        quantity: z.number().min(1).optional().default(1),
        discount: z.number().min(0).optional().default(0),
        notes: z.string().optional(),
        paymentMethod: z.enum(['credit_card', 'pix', 'boleto', 'bank_transfer']).optional(),
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/orders/:orderId',
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/accounts/:accountId/orders/:orderId',
      input: z.object({
        status: z.enum(['pending', 'processing', 'completed', 'canceled', 'refunded']).optional(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
        notes: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    cancel: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/orders/:orderId/cancel',
      input: z.object({ reason: z.string().optional() }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    createVps: {
      method: 'POST' as const,
      path: '/api/accounts/:accountId/orders/vps',
      input: z.object({
        vpsConfig: z.object({
          os: z.string(),
          osVersion: z.string().optional(),
          location: z.string(),
          locationCode: z.string().optional(),
          cpuCores: z.number().min(1),
          ramGB: z.number().min(1),
          storageGB: z.number().min(25),
          storageType: z.enum(['ssd', 'nvme', 'hdd']).optional().default('ssd'),
          bandwidth: z.string(),
          hasPublicIP: z.boolean().optional().default(false),
          publicIPCount: z.number().optional().default(0),
          hasBackup: z.boolean().optional().default(false),
          backupFrequency: z.string().nullable().optional(),
          internalNetworks: z.number().optional().default(0),
          basePriceCents: z.number().optional(),
        }),
        notes: z.string().optional(),
        paymentMethod: z.enum(['credit_card', 'pix', 'boleto', 'bank_transfer']).optional(),
      }),
      responses: {
        201: z.object({
          success: z.boolean(),
          order: z.custom<typeof orders.$inferSelect>(),
          message: z.string(),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    listAll: {
      method: 'GET' as const,
      path: '/api/admin/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
