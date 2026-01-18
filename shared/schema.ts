import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, varchar, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === PRODUCTS (PLANS) ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  storageLimit: integer("storage_limit_gb").notNull(),
  transferLimit: integer("transfer_limit_gb"),
  isPublic: boolean("is_public").default(true),
  features: jsonb("features").default([]),
});

// === ACCOUNTS (TENANTS) ===
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(), // For potentially identifying tenant
  ownerId: varchar("owner_id").references(() => users.id), // Initial owner
  status: text("status").default("active"), // active, suspended, pending
  // Business Information
  document: text("document"), // CPF or CNPJ
  documentType: text("document_type"), // cpf or cnpj
  phone: text("phone"),
  // Usage Quotas (in bytes for precision)
  storageUsed: bigint("storage_used", { mode: "number" }).default(0),
  bandwidthUsed: bigint("bandwidth_used", { mode: "number" }).default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BUCKETS (MOCK S3 STORAGE) ===
export const buckets = pgTable("buckets", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  name: text("name").notNull(),
  region: text("region").default("us-east-1"),
  isPublic: boolean("is_public").default(false),
  objectCount: integer("object_count").default(0),
  sizeBytes: bigint("size_bytes", { mode: "number" }).default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ACCESS KEYS (S3 CREDENTIALS) ===
export const accessKeys = pgTable("access_keys", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  name: text("name").notNull(),
  accessKeyId: text("access_key_id").notNull().unique(),
  secretAccessKey: text("secret_access_key").notNull(), // Hashed in production
  permissions: text("permissions").default("read-write"), // read, write, read-write
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ACCOUNT MEMBERS ===
export const accountMembers = pgTable("account_members", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  userId: varchar("user_id").references(() => users.id),
  role: text("role").notNull().default("developer"), // owner, admin, developer
  joinedAt: timestamp("joined_at").defaultNow(),
});

// === SUBSCRIPTIONS ===
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  productId: integer("product_id").references(() => products.id),
  status: text("status").default("active"), // active, past_due, canceled
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
});

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  owner: one(users, {
    fields: [accounts.ownerId],
    references: [users.id],
  }),
  members: many(accountMembers),
  subscriptions: many(subscriptions),
  buckets: many(buckets),
  accessKeys: many(accessKeys),
}));

export const bucketsRelations = relations(buckets, ({ one }) => ({
  account: one(accounts, {
    fields: [buckets.accountId],
    references: [accounts.id],
  }),
}));

export const accessKeysRelations = relations(accessKeys, ({ one }) => ({
  account: one(accounts, {
    fields: [accessKeys.accountId],
    references: [accounts.id],
  }),
}));

export const accountMembersRelations = relations(accountMembers, ({ one }) => ({
  account: one(accounts, {
    fields: [accountMembers.accountId],
    references: [accounts.id],
  }),
  user: one(users, {
    fields: [accountMembers.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  account: one(accounts, {
    fields: [subscriptions.accountId],
    references: [accounts.id],
  }),
  product: one(products, {
    fields: [subscriptions.productId],
    references: [products.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertProductSchema = createInsertSchema(products);
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, status: true, storageUsed: true, bandwidthUsed: true });
export const insertMemberSchema = createInsertSchema(accountMembers).omit({ id: true, joinedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true });
export const insertBucketSchema = createInsertSchema(buckets).omit({ id: true, createdAt: true, objectCount: true, sizeBytes: true });
export const insertAccessKeySchema = createInsertSchema(accessKeys).omit({ id: true, createdAt: true, lastUsedAt: true, accessKeyId: true, secretAccessKey: true });

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type AccountMember = typeof accountMembers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Bucket = typeof buckets.$inferSelect;
export type AccessKey = typeof accessKeys.$inferSelect;

export type CreateAccountRequest = z.infer<typeof insertAccountSchema>;
export type UpdateAccountRequest = Partial<CreateAccountRequest>;
export type CreateMemberRequest = z.infer<typeof insertMemberSchema>;
export type CreateBucketRequest = z.infer<typeof insertBucketSchema>;
export type CreateAccessKeyRequest = z.infer<typeof insertAccessKeySchema>;

// Detailed types for frontend
export interface AccountWithDetails extends Account {
  subscription?: Subscription & { product: Product };
  role?: string; // Role of the current user in this account
}
