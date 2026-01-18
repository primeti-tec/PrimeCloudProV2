import { z } from 'zod';
import { insertAccountSchema, insertProductSchema, insertBucketSchema, insertAccessKeySchema, accounts, products, accountMembers, subscriptions, buckets, accessKeys, invoices, usageRecords } from './schema';

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
        200: z.array(z.custom<typeof accounts.$inferSelect & { role: string }>()),
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
      input: z.object({ quotaGB: z.number().min(1), reason: z.string().min(1) }),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
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
      input: insertBucketSchema.pick({ name: true, region: true, isPublic: true }),
      responses: {
        201: z.custom<typeof buckets.$inferSelect>(),
        400: errorSchemas.validation,
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
