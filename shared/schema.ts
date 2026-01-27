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
  pricePerStorageGB: integer("price_per_storage_gb").default(15), // in cents per GB
  pricePerTransferGB: integer("price_per_transfer_gb").default(40), // in cents per GB
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
  status: text("status").default("active"), // active, suspended, pending, rejected
  // Business Information
  document: text("document"), // CPF or CNPJ
  documentType: text("document_type"), // cpf or cnpj
  phone: text("phone"),
  // Usage Quotas (in bytes for precision)
  storageUsed: bigint("storage_used", { mode: "number" }).default(0),
  bandwidthUsed: bigint("bandwidth_used", { mode: "number" }).default(0),
  storageQuotaGB: integer("storage_quota_gb").default(100), // Manual quota override
  // White Label Branding
  brandingName: text("branding_name"), // Custom application name
  brandingLogo: text("branding_logo"), // URL to custom logo
  brandingFavicon: text("branding_favicon"), // URL to custom favicon
  brandingPrimaryColor: text("branding_primary_color"), // Hex/HSL color for primary actions
  brandingSidebarColor: text("branding_sidebar_color"), // Color for sidebar background
  // Custom Domain
  customDomain: text("custom_domain"), // Custom domain/subdomain (e.g., backup.empresa.com)
  domainStatus: text("domain_status").default("pending"), // pending, active, failed
  dnsVerificationToken: text("dns_verification_token"), // Token for DNS validation
  // SMTP Email Configuration
  smtpEnabled: boolean("smtp_enabled").default(false), // Enable/disable custom SMTP
  smtpHost: text("smtp_host"), // SMTP server hostname
  smtpPort: integer("smtp_port"), // SMTP port (587, 465, etc)
  smtpUser: text("smtp_user"), // SMTP username/email
  smtpPass: text("smtp_pass"), // SMTP password (should be encrypted)
  smtpFromEmail: text("smtp_from_email"), // From email address
  smtpFromName: text("smtp_from_name"), // From display name
  smtpEncryption: text("smtp_encryption"), // none, ssl, tls
  // Billing Information
  billingEmail: text("billing_email"), // Email for invoices (fallback to owner)
  financialContact: text("financial_contact"), // Name of financial responsible
  billingDay: integer("billing_day").default(10), // Day of month for invoice due date (1-28)
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
  storageLimitGB: integer("storage_limit_gb").default(50), // Individual bucket limit
  versioningEnabled: boolean("versioning_enabled").default(false),
  lifecycleRules: jsonb("lifecycle_rules").default([]),
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
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === NOTIFICATIONS ===
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  type: text("type").notNull(), // quota_warning, quota_critical, invoice_generated, payment_overdue, welcome, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === AUDIT LOGS ===
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // BUCKET_CREATED, KEY_REVOKED, MEMBER_ADDED, etc.
  resource: text("resource"),
  details: jsonb("details"), // { previous_state, current_state, context, resourceName, resourceId }
  severity: text("severity").default("info"), // info, warning, error, critical
  context: text("context"), // api, panel, system, cron
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === USER INVITATIONS ===
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  email: text("email").notNull(),
  role: text("role").notNull().default("developer"),
  token: text("token").notNull().unique(),
  invitedBy: varchar("invited_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  metadata: jsonb("metadata").default({}), // For storing bucket permissions for external_client
  createdAt: timestamp("created_at").defaultNow(),
});

// === INVOICES ===
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  storageGB: integer("storage_gb").default(0),
  storageCost: integer("storage_cost").default(0), // cents
  bandwidthGB: integer("bandwidth_gb").default(0),
  bandwidthCost: integer("bandwidth_cost").default(0), // cents
  subtotal: integer("subtotal").default(0), // cents
  taxAmount: integer("tax_amount").default(0), // cents
  totalAmount: integer("total_amount").default(0), // cents
  status: text("status").default("pending"), // pending, paid, overdue, canceled
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === USAGE RECORDS ===
export const usageRecords = pgTable("usage_records", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  storageBytes: bigint("storage_bytes", { mode: "number" }).default(0),
  bandwidthIngress: bigint("bandwidth_ingress", { mode: "number" }).default(0),
  bandwidthEgress: bigint("bandwidth_egress", { mode: "number" }).default(0),
  requestsCount: integer("requests_count").default(0),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// === QUOTA CHANGE REQUESTS ===
export const quotaRequests = pgTable("quota_requests", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  currentQuotaGB: integer("current_quota_gb").notNull(),
  requestedQuotaGB: integer("requested_quota_gb").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SFTP CREDENTIALS ===
export const sftpCredentials = pgTable("sftp_credentials", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id).unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").default("active"), // active, revoked
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  loginCount: integer("login_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ACCOUNT MEMBERS ===
export const accountMembers = pgTable("account_members", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  userId: varchar("user_id").references(() => users.id),
  role: text("role").notNull().default("developer"), // owner, admin, developer, external_client
  joinedAt: timestamp("joined_at").defaultNow(),
});

// === BUCKET PERMISSIONS (For External Clients) ===
export const bucketPermissions = pgTable("bucket_permissions", {
  id: serial("id").primaryKey(),
  accountMemberId: integer("account_member_id").references(() => accountMembers.id).notNull(),
  bucketId: integer("bucket_id").references(() => buckets.id).notNull(),
  permission: text("permission").notNull().default("read"), // read, write, read-write
  createdAt: timestamp("created_at").defaultNow(),
});

// === OBJECT FAVORITES ===
export const objectFavorites = pgTable("object_favorites", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  bucketId: integer("bucket_id").references(() => buckets.id),
  userId: varchar("user_id").references(() => users.id),
  objectKey: text("object_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === OBJECT TAGS ===
export const objectTags = pgTable("object_tags", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  bucketId: integer("bucket_id").references(() => buckets.id),
  userId: varchar("user_id").references(() => users.id),
  objectKey: text("object_key").notNull(),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === OBJECT SHARES ===
export const objectShares = pgTable("object_shares", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  bucketId: integer("bucket_id").references(() => buckets.id),
  objectKey: text("object_key").notNull(),
  sharedByUserId: varchar("shared_by_user_id").references(() => users.id),
  sharedWithEmail: text("shared_with_email"),
  access: text("access").default("read"), // read, download
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

// === ORDERS (SALES) ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  productId: integer("product_id").references(() => products.id),
  orderNumber: text("order_number").notNull().unique(),
  orderType: text("order_type").default("product"), // product, vps, dedicated, storage
  status: text("status").default("pending"), // pending, quoting, approved, provisioning, completed, canceled, refunded
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(), // cents
  totalAmount: integer("total_amount").notNull(), // cents
  discount: integer("discount").default(0), // cents
  notes: text("notes"),
  paymentMethod: text("payment_method"), // credit_card, pix, boleto, bank_transfer
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  paidAt: timestamp("paid_at"),
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
  adminNotes: text("admin_notes"), // Notas internas do admin
  estimatedDelivery: timestamp("estimated_delivery"), // Data estimada de entrega
  deliveredAt: timestamp("delivered_at"), // Data de entrega efetiva
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === VPS CONFIGURATIONS (Linked to Orders) ===
export const vpsConfigs = pgTable("vps_configs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).unique(),
  // Sistema Operacional
  os: text("os").notNull(), // Ubuntu 22.04, CentOS 8, Windows Server 2022
  osVersion: text("os_version"), // Versão específica
  // Localização
  location: text("location").notNull(), // São Paulo, New York, Frankfurt
  locationCode: text("location_code"), // sp, ny, fra
  // Recursos de Hardware
  cpuCores: integer("cpu_cores").notNull().default(1),
  ramGB: integer("ram_gb").notNull().default(1),
  storageGB: integer("storage_gb").notNull().default(25),
  storageType: text("storage_type").default("ssd"), // ssd, nvme, hdd
  bandwidth: text("bandwidth").default("50"), // Mbps
  bandwidthUnlimited: boolean("bandwidth_unlimited").default(false),
  // Recursos Adicionais
  hasPublicIP: boolean("has_public_ip").default(false),
  publicIPCount: integer("public_ip_count").default(0),
  hasBackup: boolean("has_backup").default(false),
  backupFrequency: text("backup_frequency"), // daily, weekly, monthly
  backupRetention: integer("backup_retention"), // dias
  internalNetworks: integer("internal_networks").default(0),
  // Preços calculados (em centavos)
  basePriceCents: integer("base_price_cents").default(0),
  ipPriceCents: integer("ip_price_cents").default(0),
  backupPriceCents: integer("backup_price_cents").default(0),
  networkPriceCents: integer("network_price_cents").default(0),
  // Dados de provisionamento
  serverIP: text("server_ip"), // IP atribuído após provisionamento
  serverHostname: text("server_hostname"),
  accessCredentials: jsonb("access_credentials"), // { user, password } criptografado
  provisionedAt: timestamp("provisioned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PRICING CONFIGURATIONS ===
export const pricingConfigs = pgTable("pricing_configs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'vps', 'backup_cloud', 'backup_vps', 'storage'
  resourceKey: text("resource_key").notNull(), // 'cpu_per_core', 'ram_per_gb', etc.
  resourceLabel: text("resource_label").notNull(), // 'CPU por Core', 'RAM por GB'
  priceCents: integer("price_cents").notNull(), // Preço em centavos
  unit: text("unit").notNull(), // 'core', 'gb', 'mbps', 'day', 'unit', 'percent'
  description: text("description"),
  isActive: boolean("is_active").default(true),
  minValue: integer("min_value").default(1),
  maxValue: integer("max_value"), // null = ilimitado
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === PRICING HISTORY (Audit Trail) ===
export const pricingHistory = pgTable("pricing_history", {
  id: serial("id").primaryKey(),
  pricingConfigId: integer("pricing_config_id").references(() => pricingConfigs.id),
  oldPriceCents: integer("old_price_cents"),
  newPriceCents: integer("new_price_cents"),
  changedBy: text("changed_by"), // User ID do admin
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  subscriptions: many(subscriptions),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  account: one(accounts, {
    fields: [orders.accountId],
    references: [accounts.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  vpsConfig: one(vpsConfigs, {
    fields: [orders.id],
    references: [vpsConfigs.orderId],
  }),
}));

export const vpsConfigsRelations = relations(vpsConfigs, ({ one }) => ({
  order: one(orders, {
    fields: [vpsConfigs.orderId],
    references: [orders.id],
  }),
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
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  invitations: many(invitations),
  invoices: many(invoices),
  usageRecords: many(usageRecords),
  quotaRequests: many(quotaRequests),
  sftpCredential: one(sftpCredentials, {
    fields: [accounts.id],
    references: [sftpCredentials.accountId],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  account: one(accounts, {
    fields: [notifications.accountId],
    references: [accounts.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  account: one(accounts, {
    fields: [auditLogs.accountId],
    references: [accounts.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  account: one(accounts, {
    fields: [invitations.accountId],
    references: [accounts.id],
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  account: one(accounts, {
    fields: [invoices.accountId],
    references: [accounts.id],
  }),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  account: one(accounts, {
    fields: [usageRecords.accountId],
    references: [accounts.id],
  }),
}));

export const quotaRequestsRelations = relations(quotaRequests, ({ one }) => ({
  account: one(accounts, {
    fields: [quotaRequests.accountId],
    references: [accounts.id],
  }),
  reviewer: one(users, {
    fields: [quotaRequests.reviewedById],
    references: [users.id],
  }),
}));

export const sftpCredentialsRelations = relations(sftpCredentials, ({ one }) => ({
  account: one(accounts, {
    fields: [sftpCredentials.accountId],
    references: [accounts.id],
  }),
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

export const bucketPermissionsRelations = relations(bucketPermissions, ({ one }) => ({
  member: one(accountMembers, {
    fields: [bucketPermissions.accountMemberId],
    references: [accountMembers.id],
  }),
  bucket: one(buckets, {
    fields: [bucketPermissions.bucketId],
    references: [buckets.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertProductSchema = createInsertSchema(products);
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, status: true, storageUsed: true, bandwidthUsed: true });
export const insertMemberSchema = createInsertSchema(accountMembers).omit({ id: true, joinedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true });
export const insertBucketSchema = createInsertSchema(buckets).omit({ id: true, createdAt: true, objectCount: true, sizeBytes: true, versioningEnabled: true, lifecycleRules: true });
export const insertBucketPermissionSchema = createInsertSchema(bucketPermissions).omit({ id: true, createdAt: true });
export const insertObjectFavoriteSchema = createInsertSchema(objectFavorites).omit({ id: true, createdAt: true });
export const insertObjectTagSchema = createInsertSchema(objectTags).omit({ id: true, createdAt: true });
export const insertObjectShareSchema = createInsertSchema(objectShares).omit({ id: true, createdAt: true, token: true, sharedByUserId: true });

export const lifecycleRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["expiration", "transition"]),
  days: z.number().min(1),
  storageClass: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type LifecycleRule = z.infer<typeof lifecycleRuleSchema>;
export const insertAccessKeySchema = createInsertSchema(accessKeys).omit({ id: true, createdAt: true, lastUsedAt: true, accessKeyId: true, secretAccessKey: true, expiresAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true, readAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true, createdAt: true, acceptedAt: true, token: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, paidAt: true });
export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({ id: true, recordedAt: true });
export const insertQuotaRequestSchema = createInsertSchema(quotaRequests).omit({ id: true, createdAt: true, status: true, reviewedById: true, reviewNote: true, reviewedAt: true });
export const insertSftpCredentialSchema = createInsertSchema(sftpCredentials).omit({ id: true, createdAt: true, lastLoginAt: true, lastLoginIp: true, loginCount: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, orderNumber: true, paidAt: true, canceledAt: true, deliveredAt: true });
export const insertVpsConfigSchema = createInsertSchema(vpsConfigs).omit({ id: true, createdAt: true, provisionedAt: true, serverIP: true, serverHostname: true, accessCredentials: true });
export const insertPricingConfigSchema = createInsertSchema(pricingConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPricingHistorySchema = createInsertSchema(pricingHistory).omit({ id: true, createdAt: true });

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type VpsConfig = typeof vpsConfigs.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type AccountMember = typeof accountMembers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Bucket = typeof buckets.$inferSelect;
export type AccessKey = typeof accessKeys.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type QuotaRequest = typeof quotaRequests.$inferSelect;
export type SftpCredential = typeof sftpCredentials.$inferSelect;
export type BucketPermission = typeof bucketPermissions.$inferSelect;
export type ObjectFavorite = typeof objectFavorites.$inferSelect;
export type ObjectTag = typeof objectTags.$inferSelect;
export type ObjectShare = typeof objectShares.$inferSelect;
export type PricingConfig = typeof pricingConfigs.$inferSelect;
export type PricingHistory = typeof pricingHistory.$inferSelect;

export type CreateAccountRequest = z.infer<typeof insertAccountSchema>;
export type UpdateAccountRequest = Partial<CreateAccountRequest>;
export type CreateMemberRequest = z.infer<typeof insertMemberSchema>;
export type CreateBucketRequest = z.infer<typeof insertBucketSchema>;
export type CreateObjectFavoriteRequest = z.infer<typeof insertObjectFavoriteSchema>;
export type CreateObjectTagRequest = z.infer<typeof insertObjectTagSchema>;
export type CreateObjectShareRequest = z.infer<typeof insertObjectShareSchema>;
export type CreateAccessKeyRequest = z.infer<typeof insertAccessKeySchema>;
export type CreateNotificationRequest = z.infer<typeof insertNotificationSchema>;
export type CreateAuditLogRequest = z.infer<typeof insertAuditLogSchema>;
export type CreateInvitationRequest = z.infer<typeof insertInvitationSchema>;
export type CreateInvoiceRequest = z.infer<typeof insertInvoiceSchema>;
export type CreateUsageRecordRequest = z.infer<typeof insertUsageRecordSchema>;
export type CreateQuotaRequestRequest = z.infer<typeof insertQuotaRequestSchema>;
export type CreateOrderRequest = z.infer<typeof insertOrderSchema>;
export type UpdateOrderRequest = Partial<Omit<CreateOrderRequest, 'accountId' | 'productId'>>;

// Order with related data
export interface OrderWithDetails extends Order {
  account?: Account;
  product?: Product;
  vpsConfig?: VpsConfig;
}

// VPS Order creation request (includes VPS config)
export type CreateVpsOrderRequest = {
  vpsConfig: z.infer<typeof insertVpsConfigSchema>;
  notes?: string;
  paymentMethod?: string;
};

export type CreateVpsConfigRequest = z.infer<typeof insertVpsConfigSchema>;
export type CreatePricingConfigRequest = z.infer<typeof insertPricingConfigSchema>;
export type UpdatePricingConfigRequest = Partial<Omit<CreatePricingConfigRequest, 'category' | 'resourceKey'>>;

// Detailed types for frontend
export interface AccountWithDetails extends Account {
  subscription?: Subscription & { product: Product };
  role?: string; // Role of the current user in this account
}
