import { z } from 'zod';
import { insertAccountSchema, insertProductSchema, accounts, products, accountMembers, subscriptions } from './schema';

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
