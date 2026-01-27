import { db } from "./db";
import { minioService } from "./services/minio.service";
import {
  users, accounts, products, accountMembers, subscriptions, buckets, accessKeys, notifications, auditLogs, invitations, sftpCredentials, invoices, usageRecords, quotaRequests, orders, bucketPermissions, objectFavorites, objectTags, objectShares, vpsConfigs, pricingConfigs, pricingHistory,
  type Account, type Product, type Subscription, type AccountMember, type Bucket, type AccessKey,
  type Notification, type AuditLog, type Invitation, type SftpCredential, type Invoice, type QuotaRequest, type Order, type OrderWithDetails, type VpsConfig, type PricingConfig, type PricingHistory,
  type CreateAccountRequest, type CreateMemberRequest, type CreateBucketRequest, type CreateAccessKeyRequest,
  type CreateNotificationRequest, type CreateAuditLogRequest, type CreateQuotaRequestRequest, type CreateOrderRequest, type UpdateOrderRequest, type CreateVpsConfigRequest, type CreatePricingConfigRequest, type UpdatePricingConfigRequest,
  type ObjectShare
} from "@shared/schema";
import { eq, and, desc, count, isNull, gt, gte, lte, ilike, or } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Accounts
  createAccount(data: CreateAccountRequest, ownerId: string | null): Promise<Account>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountsByOwner(userId: string | null): Promise<Account[]>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account>;
  getAllAccounts(): Promise<Account[]>; // Admin

  // Members
  addMember(accountId: number, userId: string, role: string): Promise<AccountMember>;
  getMembers(accountId: number): Promise<(AccountMember & { user: any })[]>;
  getMembership(userId: string | null, accountId: number): Promise<AccountMember | undefined>;
  getUserAccounts(userId: string | null): Promise<{ account: Account, role: string }[]>;
  removeMember(accountId: number, memberId: number): Promise<void>;
  updateMemberRole(memberId: number, role: string): Promise<AccountMember>;

  // Subscriptions
  createSubscription(accountId: number, productId: number): Promise<Subscription>;
  getSubscription(accountId: number): Promise<(Subscription & { product: Product }) | undefined>;

  // Buckets
  createBucket(data: CreateBucketRequest): Promise<Bucket>;
  getBuckets(accountId: number): Promise<Bucket[]>;
  getBucket(id: number): Promise<Bucket | undefined>;
  deleteBucket(id: number): Promise<void>;

  // Object Metadata
  getObjectFavorites(userId: string, accountId: number, bucketId: number): Promise<string[]>;
  addObjectFavorite(userId: string, accountId: number, bucketId: number, objectKey: string): Promise<void>;
  removeObjectFavorite(userId: string, accountId: number, bucketId: number, objectKey: string): Promise<void>;
  getObjectTags(userId: string, accountId: number, bucketId: number): Promise<{ key: string; tags: string[] }[]>;
  addObjectTag(userId: string, accountId: number, bucketId: number, objectKey: string, tag: string): Promise<void>;
  removeObjectTag(userId: string, accountId: number, bucketId: number, objectKey: string, tag: string): Promise<void>;
  createObjectShare(data: { accountId: number; bucketId: number; objectKey: string; sharedByUserId: string; sharedWithEmail?: string | null; access?: string; expiresAt?: Date | null; token: string; }): Promise<ObjectShare>;
  getObjectSharesByUser(accountId: number, bucketId: number, userId: string): Promise<ObjectShare[]>;
  getObjectSharesWithUser(accountId: number, bucketId: number, userEmail: string): Promise<ObjectShare[]>;
  revokeObjectShare(accountId: number, bucketId: number, userId: string, shareId: number): Promise<void>;
  getObjectShareByToken(token: string): Promise<ObjectShare | undefined>;

  // Access Keys
  createAccessKey(data: CreateAccessKeyRequest): Promise<AccessKey & { rawSecret: string }>;
  getAccessKeys(accountId: number): Promise<AccessKey[]>;
  revokeAccessKey(id: number): Promise<void>;
  rotateAccessKey(id: number): Promise<AccessKey & { rawSecret: string }>;
  toggleAccessKeyActive(id: number): Promise<AccessKey>;
  getAccessKey(id: number): Promise<AccessKey | undefined>;

  // Notifications
  createNotification(data: CreateNotificationRequest): Promise<Notification>;
  getNotifications(accountId: number, limit?: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;
  markAllNotificationsRead(accountId: number): Promise<void>;
  getUnreadCount(accountId: number): Promise<number>;
  deleteNotification(id: number): Promise<void>;

  // Audit Logs
  createAuditLog(data: CreateAuditLogRequest): Promise<AuditLog>;
  getAuditLogs(accountId: number, options?: { limit?: number; action?: string; severity?: string; search?: string; startDate?: Date; endDate?: Date }): Promise<any[]>;

  // Invitations
  createInvitation(accountId: number, email: string, role: string, invitedById: string | null): Promise<Invitation>;
  getInvitationsByAccount(accountId: number): Promise<Invitation[]>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  deleteInvitation(id: number): Promise<void>;
  acceptInvitation(token: string, userId: string): Promise<AccountMember>;

  // SFTP Credentials
  getSftpCredentials(accountId: number): Promise<SftpCredential | undefined>;
  createSftpCredentials(accountId: number): Promise<SftpCredential & { rawPassword: string }>;
  resetSftpPassword(accountId: number): Promise<SftpCredential & { rawPassword: string }>;

  // Invoices
  getInvoices(accountId: number): Promise<Invoice[]>;

  // Usage Summary
  getUsageSummary(accountId: number): Promise<{
    storageUsedGB: number;
    bandwidthUsedGB: number;
    apiRequestsCount: number;
    projectedCost: number;
  }>;

  // Quota Requests
  createQuotaRequest(data: CreateQuotaRequestRequest): Promise<QuotaRequest>;
  getQuotaRequests(accountId: number): Promise<QuotaRequest[]>;
  getAllPendingQuotaRequests(): Promise<(QuotaRequest & { account: Account })[]>;
  getQuotaRequest(id: number): Promise<QuotaRequest | undefined>;
  approveQuotaRequest(id: number, reviewerId: string | null, note?: string): Promise<QuotaRequest>;
  rejectQuotaRequest(id: number, reviewerId: string | null, note?: string): Promise<QuotaRequest>;

  // Orders
  createOrder(data: CreateOrderRequest): Promise<Order>;
  getOrders(accountId: number): Promise<OrderWithDetails[]>;
  getAllOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: number): Promise<OrderWithDetails | undefined>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order>;
  cancelOrder(id: number, reason?: string): Promise<Order>;
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: any): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createAccount(data: CreateAccountRequest, ownerId: string | null): Promise<Account> {
    if (!ownerId) throw new Error("Owner ID is required");
    const [account] = await db.insert(accounts).values({ ...data, ownerId }).returning();
    // Add owner as member
    await this.addMember(account.id, ownerId, "owner");
    return account;
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountsByOwner(userId: string | null): Promise<Account[]> {
    if (!userId) return [];
    return await db.select().from(accounts).where(eq(accounts.ownerId, userId));
  }

  async updateAccount(id: number, data: Partial<Account>): Promise<Account> {
    const [account] = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
    return account;
  }

  async getAllAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async addMember(accountId: number, userId: string, role: string): Promise<AccountMember> {
    const [member] = await db.insert(accountMembers).values({ accountId, userId, role }).returning();
    return member;
  }

  async getMembers(accountId: number): Promise<(AccountMember & { user: any })[]> {
    const results = await db.select({
      member: accountMembers,
      user: users
    })
      .from(accountMembers)
      .innerJoin(users, eq(accountMembers.userId, users.id))
      .where(eq(accountMembers.accountId, accountId));

    return results.map(r => ({ ...r.member, user: r.user }));
  }

  async getMembership(userId: string | null, accountId: number): Promise<AccountMember | undefined> {
    if (!userId) return undefined;
    const [member] = await db.select().from(accountMembers)
      .where(and(eq(accountMembers.userId, userId), eq(accountMembers.accountId, accountId)));
    return member;
  }

  async getUserAccounts(userId: string | null): Promise<{ account: Account, role: string }[]> {
    if (!userId) return [];
    const results = await db.select({
      account: accounts,
      member: accountMembers
    })
      .from(accountMembers)
      .innerJoin(accounts, eq(accountMembers.accountId, accounts.id))
      .where(eq(accountMembers.userId, userId));

    return results.map(r => ({ account: r.account, role: r.member.role }));
  }

  async createSubscription(accountId: number, productId: number): Promise<Subscription> {
    // Deactivate old subscriptions
    await db.update(subscriptions)
      .set({ status: 'canceled', currentPeriodEnd: new Date() })
      .where(and(eq(subscriptions.accountId, accountId), eq(subscriptions.status, 'active')));

    const [sub] = await db.insert(subscriptions).values({
      accountId,
      productId,
      status: 'active',
    }).returning();
    return sub;
  }

  async getSubscription(accountId: number): Promise<(Subscription & { product: Product }) | undefined> {
    const [sub] = await db.select({
      subscription: subscriptions,
      product: products
    })
      .from(subscriptions)
      .innerJoin(products, eq(subscriptions.productId, products.id))
      .where(and(eq(subscriptions.accountId, accountId), eq(subscriptions.status, 'active')))
      .limit(1);

    if (!sub) return undefined;
    return { ...sub.subscription, product: sub.product };
  }

  async removeMember(accountId: number, memberId: number): Promise<void> {
    await db.delete(accountMembers)
      .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.id, memberId)));
  }

  async updateMemberRole(memberId: number, role: string): Promise<AccountMember> {
    const [member] = await db.update(accountMembers)
      .set({ role })
      .where(eq(accountMembers.id, memberId))
      .returning();
    return member;
  }

  // Buckets
  async createBucket(data: CreateBucketRequest): Promise<Bucket> {
    // 1. Create in MinIO first
    console.log(`[STORAGE] Iniciando criação de bucket: ${data.name} para tenant: ${data.accountId}`);

    const { MinioService: MinioServiceClass } = await import("./services/minio.service");
    const tenantService = new MinioServiceClass(String(data.accountId));

    const result = await tenantService.createBucket(data.name, data.region || "us-east-1");
    console.log(`[STORAGE] Resultado MinIO para bucket '${data.name}':`, result);

    if (!result.success) {
      if (result.error !== "Bucket already exists") {
        console.error(`[STORAGE] ERRO CRÍTICO ao criar bucket no MinIO: ${result.error}`);
        throw new Error(`Failed to create bucket in storage: ${result.error}`);
      }
    }

    // 2. Save to DB
    const [bucket] = await db.insert(buckets).values(data).returning();
    return bucket;
  }

  async getBuckets(accountId: number): Promise<Bucket[]> {
    return await db.select().from(buckets).where(eq(buckets.accountId, accountId));
  }

  async getBucket(id: number): Promise<Bucket | undefined> {
    const [bucket] = await db.select().from(buckets).where(eq(buckets.id, id));
    return bucket;
  }

  async deleteBucket(id: number): Promise<void> {
    const bucket = await this.getBucket(id);
    if (bucket) {
      const { MinioService: MinioServiceClass } = await import("./services/minio.service");
      const tenantService = new MinioServiceClass(String(bucket.accountId));

      const result = await tenantService.deleteBucket(bucket.name);
      if (!result.success) {
        console.warn(`Failed to delete bucket from MinIO: ${result.error}`);
      }
    }

    // 2. Remove from DB
    await db.delete(buckets).where(eq(buckets.id, id));
  }

  // Object Metadata
  async getObjectFavorites(userId: string, accountId: number, bucketId: number): Promise<string[]> {
    const rows = await db
      .select({ objectKey: objectFavorites.objectKey })
      .from(objectFavorites)
      .where(and(
        eq(objectFavorites.userId, userId),
        eq(objectFavorites.accountId, accountId),
        eq(objectFavorites.bucketId, bucketId)
      ));
    return rows.map((row) => row.objectKey);
  }

  async addObjectFavorite(userId: string, accountId: number, bucketId: number, objectKey: string): Promise<void> {
    const existing = await db
      .select({ id: objectFavorites.id })
      .from(objectFavorites)
      .where(and(
        eq(objectFavorites.userId, userId),
        eq(objectFavorites.accountId, accountId),
        eq(objectFavorites.bucketId, bucketId),
        eq(objectFavorites.objectKey, objectKey)
      ));
    if (existing.length > 0) return;
    await db.insert(objectFavorites).values({ userId, accountId, bucketId, objectKey });
  }

  async removeObjectFavorite(userId: string, accountId: number, bucketId: number, objectKey: string): Promise<void> {
    await db.delete(objectFavorites).where(and(
      eq(objectFavorites.userId, userId),
      eq(objectFavorites.accountId, accountId),
      eq(objectFavorites.bucketId, bucketId),
      eq(objectFavorites.objectKey, objectKey)
    ));
  }

  async getObjectTags(userId: string, accountId: number, bucketId: number): Promise<{ key: string; tags: string[] }[]> {
    const rows = await db
      .select({ objectKey: objectTags.objectKey, tag: objectTags.tag })
      .from(objectTags)
      .where(and(
        eq(objectTags.userId, userId),
        eq(objectTags.accountId, accountId),
        eq(objectTags.bucketId, bucketId)
      ));

    const tagMap = new Map<string, string[]>();
    rows.forEach((row) => {
      const list = tagMap.get(row.objectKey) || [];
      if (!list.includes(row.tag)) {
        list.push(row.tag);
      }
      tagMap.set(row.objectKey, list);
    });

    return Array.from(tagMap.entries()).map(([key, tags]) => ({ key, tags }));
  }

  async addObjectTag(userId: string, accountId: number, bucketId: number, objectKey: string, tag: string): Promise<void> {
    const existing = await db
      .select({ id: objectTags.id })
      .from(objectTags)
      .where(and(
        eq(objectTags.userId, userId),
        eq(objectTags.accountId, accountId),
        eq(objectTags.bucketId, bucketId),
        eq(objectTags.objectKey, objectKey),
        eq(objectTags.tag, tag)
      ));
    if (existing.length > 0) return;
    await db.insert(objectTags).values({ userId, accountId, bucketId, objectKey, tag });
  }

  async removeObjectTag(userId: string, accountId: number, bucketId: number, objectKey: string, tag: string): Promise<void> {
    await db.delete(objectTags).where(and(
      eq(objectTags.userId, userId),
      eq(objectTags.accountId, accountId),
      eq(objectTags.bucketId, bucketId),
      eq(objectTags.objectKey, objectKey),
      eq(objectTags.tag, tag)
    ));
  }

  async createObjectShare(data: { accountId: number; bucketId: number; objectKey: string; sharedByUserId: string; sharedWithEmail?: string | null; access?: string; expiresAt?: Date | null; token: string; }): Promise<ObjectShare> {
    const [share] = await db.insert(objectShares).values({
      accountId: data.accountId,
      bucketId: data.bucketId,
      objectKey: data.objectKey,
      sharedByUserId: data.sharedByUserId,
      sharedWithEmail: data.sharedWithEmail || null,
      access: data.access || "read",
      expiresAt: data.expiresAt || null,
      token: data.token,
    }).returning();
    return share;
  }

  async getObjectSharesByUser(accountId: number, bucketId: number, userId: string): Promise<ObjectShare[]> {
    return await db.select().from(objectShares).where(and(
      eq(objectShares.accountId, accountId),
      eq(objectShares.bucketId, bucketId),
      eq(objectShares.sharedByUserId, userId)
    )).orderBy(desc(objectShares.createdAt));
  }

  async getObjectSharesWithUser(accountId: number, bucketId: number, userEmail: string): Promise<ObjectShare[]> {
    return await db.select().from(objectShares).where(and(
      eq(objectShares.accountId, accountId),
      eq(objectShares.bucketId, bucketId),
      eq(objectShares.sharedWithEmail, userEmail)
    )).orderBy(desc(objectShares.createdAt));
  }

  async revokeObjectShare(accountId: number, bucketId: number, userId: string, shareId: number): Promise<void> {
    await db.delete(objectShares).where(and(
      eq(objectShares.id, shareId),
      eq(objectShares.accountId, accountId),
      eq(objectShares.bucketId, bucketId),
      eq(objectShares.sharedByUserId, userId)
    ));
  }

  async getObjectShareByToken(token: string): Promise<ObjectShare | undefined> {
    const [share] = await db.select().from(objectShares).where(eq(objectShares.token, token));
    return share;
  }

  async updateBucketVersioning(id: number, enabled: boolean): Promise<Bucket> {
    const [bucket] = await db.update(buckets)
      .set({ versioningEnabled: enabled })
      .where(eq(buckets.id, id))
      .returning();
    return bucket;
  }

  async updateBucketLimit(id: number, limit: number): Promise<Bucket> {
    const [bucket] = await db.update(buckets)
      .set({ storageLimitGB: limit })
      .where(eq(buckets.id, id))
      .returning();
    return bucket;
  }

  async getBucketLifecycle(id: number): Promise<any[]> {
    const bucket = await this.getBucket(id);
    return (bucket?.lifecycleRules as any[]) || [];
  }

  async addLifecycleRule(id: number, rule: any): Promise<Bucket> {
    const bucket = await this.getBucket(id);
    const currentRules = (bucket?.lifecycleRules as any[]) || [];
    const [updated] = await db.update(buckets)
      .set({ lifecycleRules: [...currentRules, rule] })
      .where(eq(buckets.id, id))
      .returning();
    return updated;
  }

  async deleteLifecycleRule(bucketId: number, ruleId: string): Promise<Bucket> {
    const bucket = await this.getBucket(bucketId);
    const currentRules = (bucket?.lifecycleRules as any[]) || [];
    const updatedRules = currentRules.filter((r: any) => r.id !== ruleId);
    const [updated] = await db.update(buckets)
      .set({ lifecycleRules: updatedRules })
      .where(eq(buckets.id, bucketId))
      .returning();
    return updated;
  }

  // Access Keys
  async createAccessKey(data: CreateAccessKeyRequest): Promise<AccessKey & { rawSecret: string }> {
    const accessKeyId = `AK${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
    const rawSecret = crypto.randomBytes(20).toString('hex');
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const [key] = await db.insert(accessKeys).values({
      ...data,
      accessKeyId,
      secretAccessKey: secretHash,
    }).returning();

    return { ...key, rawSecret };
  }

  async getAccessKeys(accountId: number): Promise<AccessKey[]> {
    return await db.select().from(accessKeys).where(eq(accessKeys.accountId, accountId));
  }

  async revokeAccessKey(id: number): Promise<void> {
    await db.update(accessKeys).set({ isActive: false }).where(eq(accessKeys.id, id));
  }

  async getAccessKey(id: number): Promise<AccessKey | undefined> {
    const [key] = await db.select().from(accessKeys).where(eq(accessKeys.id, id));
    return key;
  }

  async rotateAccessKey(id: number): Promise<AccessKey & { rawSecret: string }> {
    const rawSecret = crypto.randomBytes(20).toString('hex');
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const [key] = await db.update(accessKeys)
      .set({ secretAccessKey: secretHash })
      .where(eq(accessKeys.id, id))
      .returning();

    return { ...key, rawSecret };
  }

  async toggleAccessKeyActive(id: number): Promise<AccessKey> {
    const existingKey = await this.getAccessKey(id);
    if (!existingKey) {
      throw new Error("Access key not found");
    }

    const [key] = await db.update(accessKeys)
      .set({ isActive: !existingKey.isActive })
      .where(eq(accessKeys.id, id))
      .returning();

    return key;
  }

  // Notifications
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getNotifications(accountId: number, limit?: number): Promise<Notification[]> {
    const query = db.select().from(notifications)
      .where(eq(notifications.accountId, accountId))
      .orderBy(desc(notifications.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsRead(accountId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.accountId, accountId), eq(notifications.isRead, false)));
  }

  async getUnreadCount(accountId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.accountId, accountId), eq(notifications.isRead, false)));
    return result?.count ?? 0;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Audit Logs
  async createAuditLog(data: CreateAuditLogRequest): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs(
    accountId: number,
    options?: {
      limit?: number;
      action?: string;
      severity?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any[]> {
    let conditions = [eq(auditLogs.accountId, accountId)];

    if (options?.action) {
      // Use ilike for partial matching (e.g., "bucket" matches "bucket.created")
      conditions.push(ilike(auditLogs.action, `%${options.action}%`));
    }
    if (options?.severity) {
      conditions.push(eq(auditLogs.severity, options.severity));
    }
    if (options?.search) {
      // Search across action, resource, and details
      conditions.push(
        or(
          ilike(auditLogs.action, `%${options.search}%`),
          ilike(auditLogs.resource, `%${options.search}%`),
          ilike(auditLogs.ipAddress, `%${options.search}%`)
        )!
      );
    }
    if (options?.startDate) {
      conditions.push(gte(auditLogs.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(auditLogs.createdAt, options.endDate));
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        accountId: auditLogs.accountId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resource: auditLogs.resource,
        details: auditLogs.details,
        severity: auditLogs.severity,
        context: auditLogs.context,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(options?.limit || 100);

    return logs;
  }

  // Invitations
  async createInvitation(accountId: number, email: string, role: string, invitedById: string | null, metadata?: any): Promise<Invitation> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation] = await db.insert(invitations).values({
      accountId,
      email,
      role,
      token,
      invitedBy: invitedById,
      expiresAt,
      metadata: metadata || {},
    }).returning();
    return invitation;
  }

  async getInvitationsByAccount(accountId: number): Promise<Invitation[]> {
    return await db.select().from(invitations)
      .where(and(
        eq(invitations.accountId, accountId),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date())
      ))
      .orderBy(desc(invitations.createdAt));
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations)
      .where(eq(invitations.token, token));
    return invitation;
  }

  async deleteInvitation(id: number): Promise<void> {
    await db.delete(invitations).where(eq(invitations.id, id));
  }

  async acceptInvitation(token: string, userId: string): Promise<AccountMember> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.acceptedAt) {
      throw new Error("Invitation already accepted");
    }
    if (new Date() > invitation.expiresAt) {
      throw new Error("Invitation has expired");
    }

    const member = await this.addMember(invitation.accountId!, userId, invitation.role);
    console.log(`[AcceptInvite] Created member ID: ${member.id}, role: ${invitation.role}`);
    console.log(`[AcceptInvite] Invitation metadata:`, JSON.stringify(invitation.metadata));

    // Create bucket permissions for external_client
    if (invitation.role === 'external_client' && invitation.metadata) {
      const metadata = invitation.metadata as { bucketPermissions?: Array<{ bucketId: number; permission: string }> };
      console.log(`[AcceptInvite] Parsed bucket permissions:`, JSON.stringify(metadata.bucketPermissions));

      if (metadata.bucketPermissions && Array.isArray(metadata.bucketPermissions)) {
        for (const bp of metadata.bucketPermissions) {
          console.log(`[AcceptInvite] Creating permission: member=${member.id}, bucket=${bp.bucketId}, perm=${bp.permission}`);
          await db.insert(bucketPermissions).values({
            accountMemberId: member.id,
            bucketId: bp.bucketId,
            permission: bp.permission,
          });
        }
        console.log(`[AcceptInvite] Created ${metadata.bucketPermissions.length} bucket permissions`);
      } else {
        console.log(`[AcceptInvite] No bucket permissions to create`);
      }
    }

    await db.update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    return member;
  }

  // Bucket Permissions
  async getBucketPermissionsForMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: bucketPermissions.id,
      bucketId: bucketPermissions.bucketId,
      permission: bucketPermissions.permission,
      bucketName: buckets.name,
    })
      .from(bucketPermissions)
      .innerJoin(buckets, eq(buckets.id, bucketPermissions.bucketId))
      .where(eq(bucketPermissions.accountMemberId, memberId));
  }

  async getBucketPermissionForUser(userId: string, accountId: number, bucketId: number): Promise<string | null> {
    const membership = await this.getMembership(userId, accountId);
    if (!membership) return null;

    // Non-external clients have full access
    if (membership.role !== 'external_client') return 'read-write';

    const [permission] = await db.select()
      .from(bucketPermissions)
      .where(and(
        eq(bucketPermissions.accountMemberId, membership.id),
        eq(bucketPermissions.bucketId, bucketId)
      ));

    return permission?.permission || null;
  }

  async getAccessibleBucketsForUser(userId: string, accountId: number): Promise<number[]> {
    const membership = await this.getMembership(userId, accountId);
    if (!membership) return [];

    // Non-external clients have access to all buckets
    if (membership.role !== 'external_client') {
      const allBuckets = await this.getBuckets(accountId);
      return allBuckets.map(b => b.id);
    }

    const permissions = await db.select({ bucketId: bucketPermissions.bucketId })
      .from(bucketPermissions)
      .where(eq(bucketPermissions.accountMemberId, membership.id));

    return permissions.map(p => p.bucketId);
  }

  // SFTP Credentials
  async getSftpCredentials(accountId: number): Promise<SftpCredential | undefined> {
    const [credential] = await db.select().from(sftpCredentials)
      .where(eq(sftpCredentials.accountId, accountId));
    return credential;
  }

  async createSftpCredentials(accountId: number): Promise<SftpCredential & { rawPassword: string }> {
    const account = await this.getAccount(accountId);
    const username = `sftp_${account?.slug || accountId}_${crypto.randomBytes(4).toString('hex')}`;
    const rawPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(rawPassword).digest('hex');

    const [credential] = await db.insert(sftpCredentials).values({
      accountId,
      username,
      passwordHash,
      status: 'active',
    }).returning();

    return { ...credential, rawPassword };
  }

  async resetSftpPassword(accountId: number): Promise<SftpCredential & { rawPassword: string }> {
    const rawPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(rawPassword).digest('hex');

    const [credential] = await db.update(sftpCredentials)
      .set({ passwordHash })
      .where(eq(sftpCredentials.accountId, accountId))
      .returning();

    return { ...credential, rawPassword };
  }

  // Invoices
  async getInvoices(accountId: number): Promise<Invoice[]> {
    const existingInvoices = await db.select().from(invoices)
      .where(eq(invoices.accountId, accountId))
      .orderBy(desc(invoices.createdAt));

    // If no invoices exist, generate mock data for demo purposes
    if (existingInvoices.length === 0) {
      const now = new Date();
      const mockInvoices: Invoice[] = [];

      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 15);
        const isPaid = i > 0;
        const isOverdue = !isPaid && dueDate < now;

        mockInvoices.push({
          id: i + 1,
          accountId,
          invoiceNumber: `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(1000 + i).slice(1)}`,
          periodStart: date,
          periodEnd: dueDate,
          storageGB: 10 + i * 5,
          storageCost: (10 + i * 5) * 20, // 0.20 per GB
          bandwidthGB: 50 + i * 10,
          bandwidthCost: 0,
          subtotal: 2900 + Math.floor(Math.random() * 2000),
          taxAmount: 0,
          totalAmount: 2900 + Math.floor(Math.random() * 2000),
          status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
          dueDate: dueDate,
          paidAt: isPaid ? new Date(dueDate.getTime() - 86400000 * 3) : null,
          paymentMethod: isPaid ? 'credit_card' : null,
          pdfUrl: null,
          createdAt: date,
        });
      }

      // REMOVED MOCK GENERATION FOR INVOICES - RETURN EMPTY IF NO REAL INVOICES
      return existingInvoices || [];
    }

    return existingInvoices;
  }

  // Get all invoices (Admin)
  async getAllInvoices(): Promise<(Invoice & { account?: Account })[]> {
    const results = await db.select({
      invoice: invoices,
      account: accounts
    })
      .from(invoices)
      .leftJoin(accounts, eq(invoices.accountId, accounts.id))
      .orderBy(desc(invoices.createdAt));

    return results.map(r => ({
      ...r.invoice,
      account: r.account || undefined
    }));
  }

  // Get invoice by ID
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  // Generate invoice number
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${year}${month}-${random}`;
  }

  // Generate monthly invoice for a single account
  async generateMonthlyInvoice(accountId: number): Promise<Invoice> {
    const account = await this.getAccount(accountId);
    if (!account) throw new Error("Account not found");

    const usage = await this.getUsageSummary(accountId);
    const subscription = await this.getSubscription(accountId);

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Due date based on account's billingDay preference
    const billingDay = account.billingDay || 10;
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);

    // Calculate costs
    const baseCost = subscription?.product?.price || 0;
    const pricePerGB = subscription?.product?.pricePerStorageGB || 15;
    const pricePerTransferGB = subscription?.product?.pricePerTransferGB || 40;

    const storageLimit = subscription?.product?.storageLimit || 100;
    const transferLimit = subscription?.product?.transferLimit ?? 500;

    const excessStorage = Math.max(0, usage.storageUsedGB - storageLimit);
    const excessTransfer = Math.max(0, usage.bandwidthUsedGB - transferLimit);

    const storageCostCents = Math.ceil(excessStorage * pricePerGB);
    const bandwidthCostCents = Math.ceil(excessTransfer * pricePerTransferGB);

    const subtotal = baseCost + storageCostCents + bandwidthCostCents;
    const taxAmount = 0; // No tax for now
    const totalAmount = subtotal + taxAmount;

    const [invoice] = await db.insert(invoices).values({
      accountId,
      invoiceNumber: this.generateInvoiceNumber(),
      periodStart,
      periodEnd,
      storageGB: Math.ceil(usage.storageUsedGB),
      storageCost: storageCostCents,
      bandwidthGB: Math.ceil(usage.bandwidthUsedGB),
      bandwidthCost: bandwidthCostCents,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'pending',
      dueDate,
    }).returning();

    return invoice;
  }

  // Generate invoices for all active accounts
  async generateAllMonthlyInvoices(): Promise<{ generated: number; errors: string[] }> {
    const activeAccounts = await db.select().from(accounts).where(eq(accounts.status, 'active'));

    let generated = 0;
    const errors: string[] = [];

    for (const account of activeAccounts) {
      try {
        await this.generateMonthlyInvoice(account.id);
        generated++;
      } catch (err: any) {
        errors.push(`Account ${account.id} (${account.name}): ${err.message}`);
      }
    }

    return { generated, errors };
  }

  // Mark invoice as paid
  async markInvoicePaid(id: number, paymentMethod?: string): Promise<Invoice> {
    const [invoice] = await db.update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'manual'
      })
      .where(eq(invoices.id, id))
      .returning();

    return invoice;
  }

  // Update invoice status
  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const [invoice] = await db.update(invoices)
      .set({ status })
      .where(eq(invoices.id, id))
      .returning();

    return invoice;
  }

  // Usage Summary
  async getUsageSummary(accountId: number): Promise<{
    storageUsedGB: number;
    bandwidthUsedGB: number;
    apiRequestsCount: number;
    projectedCost: number;
    pricePerStorageGB?: number;
    pricePerTransferGB?: number;
    buckets: { name: string; sizeBytes: number; storageLimitGB: number }[];
  }> {
    const account = await this.getAccount(accountId);
    const subscription = await this.getSubscription(accountId);

    // Get real storage usage from buckets
    const bucketList = await this.getBuckets(accountId);
    const totalSizeBytes = bucketList.reduce((sum, b) => sum + Number(b.sizeBytes || 0), 0);

    let storageUsedGB = Math.round(totalSizeBytes / (1024 * 1024 * 1024) * 100) / 100;
    let bandwidthUsedGB = Math.round((account?.bandwidthUsed || 0) / (1024 * 1024 * 1024) * 100) / 100;

    let apiRequestsCount = bucketList.reduce((sum, b) => sum + (b.objectCount || 0), 0) * 10;

    const baseCost = subscription?.product?.price || 2900;

    // Use product-specific price per GB or default to 15 cents (R$ 0.15)
    // Note: The previous logic multiplied by 2 and then by 100 which seemed inconsistent.
    // Assuming calculation: (Excess Storage GB) * (Price Per GB in cents) 
    // Wait, the previous logic was: storageCost = (GB - Limit) * 2; projectedCost = baseCost + storageCost * 100;
    // Use explicit pricing from product
    const pricePerStorageGB = subscription?.product?.pricePerStorageGB || 15;
    const pricePerTransferGB = subscription?.product?.pricePerTransferGB || 40;

    const excessStorage = Math.max(0, storageUsedGB - (subscription?.product?.storageLimit || 100));
    const storageCostCents = Math.ceil(excessStorage * pricePerStorageGB);

    // Assuming transferLimit is nullable, if null = unlimited? Or 0? Schema says integer("transfer_limit_gb"), nullable.
    // If not set, treat as 500GB default or unlimited? Let's use logic: if limit exists and used > limit, charge.
    // If limit is null (unlimited), extra cost is 0. 
    // If we want to charge for ALL usage (meaning no free tier in plan), limit should be 0.
    const transferLimit = subscription?.product?.transferLimit ?? 500;
    const excessTransfer = Math.max(0, bandwidthUsedGB - transferLimit);
    const bandwidthCostCents = Math.ceil(excessTransfer * pricePerTransferGB);

    const projectedCost = baseCost + storageCostCents + bandwidthCostCents;

    return {
      storageUsedGB,
      bandwidthUsedGB,
      apiRequestsCount,
      projectedCost,
      pricePerStorageGB,
      pricePerTransferGB,
      buckets: bucketList.map(b => ({
        name: b.name,
        sizeBytes: Number(b.sizeBytes || 0),
        storageLimitGB: b.storageLimitGB || 50
      }))
    };
  }

  // Quota Requests
  async createQuotaRequest(data: CreateQuotaRequestRequest): Promise<QuotaRequest> {
    const [request] = await db.insert(quotaRequests).values(data).returning();
    return request;
  }

  async getQuotaRequests(accountId: number): Promise<QuotaRequest[]> {
    return await db.select().from(quotaRequests)
      .where(eq(quotaRequests.accountId, accountId))
      .orderBy(desc(quotaRequests.createdAt));
  }

  async getAllPendingQuotaRequests(): Promise<(QuotaRequest & { account: Account })[]> {
    const results = await db.select({
      request: quotaRequests,
      account: accounts
    })
      .from(quotaRequests)
      .innerJoin(accounts, eq(quotaRequests.accountId, accounts.id))
      .where(eq(quotaRequests.status, 'pending'))
      .orderBy(desc(quotaRequests.createdAt));

    return results.map(r => ({ ...r.request, account: r.account }));
  }

  async getQuotaRequest(id: number): Promise<QuotaRequest | undefined> {
    const [request] = await db.select().from(quotaRequests).where(eq(quotaRequests.id, id));
    return request;
  }

  async approveQuotaRequest(id: number, reviewerId: string | null, note?: string): Promise<QuotaRequest> {
    const request = await this.getQuotaRequest(id);
    if (!request) throw new Error("Quota request not found");
    // reviewerId can be null if auto-approved, but usually required. If null, we'll store null.

    // Update the account's quota
    await this.updateAccount(request.accountId!, { storageQuotaGB: request.requestedQuotaGB });

    // Update the request status
    const [updated] = await db.update(quotaRequests)
      .set({
        status: 'approved',
        reviewedById: reviewerId,
        reviewNote: note || null,
        reviewedAt: new Date()
      })
      .where(eq(quotaRequests.id, id))
      .returning();

    return updated;
  }

  async rejectQuotaRequest(id: number, reviewerId: string | null, note?: string): Promise<QuotaRequest> {
    const [updated] = await db.update(quotaRequests)
      .set({
        status: 'rejected',
        reviewedById: reviewerId,
        reviewNote: note || null,
        reviewedAt: new Date()
      })
      .where(eq(quotaRequests.id, id))
      .returning();

    return updated;
  }

  // Orders
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const [order] = await db.insert(orders).values({
      ...data,
      orderNumber
    }).returning();
    return order;
  }

  async getOrders(accountId: number): Promise<OrderWithDetails[]> {
    const results = await db.select({
      order: orders,
      account: accounts,
      product: products
    })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.accountId, accountId))
      .orderBy(desc(orders.createdAt));

    return results.map(r => ({
      ...r.order,
      account: r.account || undefined,
      product: r.product || undefined
    }));
  }

  async getAllOrders(): Promise<OrderWithDetails[]> {
    const results = await db.select({
      order: orders,
      account: accounts,
      product: products,
      vpsConfig: vpsConfigs,
    })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(vpsConfigs, eq(orders.id, vpsConfigs.orderId))
      .orderBy(desc(orders.createdAt));

    return results.map(r => ({
      ...r.order,
      account: r.account || undefined,
      product: r.product || undefined,
      vpsConfig: r.vpsConfig || undefined,
    }));
  }

  async getOrder(id: number): Promise<OrderWithDetails | undefined> {
    const results = await db.select({
      order: orders,
      account: accounts,
      product: products
    })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, id));

    if (results.length === 0) return undefined;

    const r = results[0];
    return {
      ...r.order,
      account: r.account || undefined,
      product: r.product || undefined
    };
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async cancelOrder(id: number, reason?: string): Promise<Order> {
    const [order] = await db.update(orders)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        cancelReason: reason || null,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async createVpsOrder(accountId: number, vpsConfig: CreateVpsConfigRequest, notes?: string, paymentMethod?: string): Promise<{ order: Order, vpsConfig: VpsConfig }> {
    const orderNumber = this.generateOrderNumber();

    // Calculate estimated price from vpsConfig
    const estimatedPrice = vpsConfig.basePriceCents || 0;

    // Create the order first
    const [order] = await db.insert(orders).values({
      accountId,
      orderNumber,
      orderType: 'vps',
      status: 'pending', // Will be changed to 'quoting' by admin
      unitPrice: estimatedPrice,
      totalAmount: estimatedPrice,
      notes: notes || null,
      paymentMethod: paymentMethod || null,
      // Set estimated delivery to 5 business days from now
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    }).returning();

    // Create the VPS configuration linked to this order
    const [config] = await db.insert(vpsConfigs).values({
      orderId: order.id,
      os: vpsConfig.os,
      osVersion: vpsConfig.osVersion || null,
      location: vpsConfig.location,
      locationCode: vpsConfig.locationCode || null,
      cpuCores: vpsConfig.cpuCores,
      ramGB: vpsConfig.ramGB,
      storageGB: vpsConfig.storageGB,
      storageType: vpsConfig.storageType || 'ssd',
      bandwidth: vpsConfig.bandwidth || '50',
      hasPublicIP: vpsConfig.hasPublicIP || false,
      publicIPCount: vpsConfig.publicIPCount || 0,
      hasBackup: vpsConfig.hasBackup || false,
      backupFrequency: vpsConfig.backupFrequency || null,
      internalNetworks: vpsConfig.internalNetworks || 0,
      basePriceCents: vpsConfig.basePriceCents || 0,
    }).returning();

    return { order, vpsConfig: config };
  }

  async getVpsConfig(orderId: number): Promise<VpsConfig | undefined> {
    const [config] = await db.select().from(vpsConfigs).where(eq(vpsConfigs.orderId, orderId));
    return config;
  }

  async createBackupOrder(accountId: number, type: string, config: any): Promise<Order> {
    const orderNumber = `BCK-${Date.now().toString(36).toUpperCase()}`;

    const [order] = await db.insert(orders).values({
      accountId,
      orderNumber,
      orderType: type, // 'backup-cloud' or 'backup-vps'
      status: 'quoting',
      unitPrice: config.estimatedPrice || 0,
      totalAmount: config.estimatedPrice || 0,
      notes: JSON.stringify(config),
      paymentMethod: 'pix',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    }).returning();

    return order;
  }

  async getAdminStats(): Promise<any> {
    const allAccounts = await this.getAllAccounts();
    const activeAccounts = allAccounts.filter(a => a.status === 'active');
    const pendingAccounts = allAccounts.filter(a => a.status === 'pending');
    const suspendedAccounts = allAccounts.filter(a => a.status === 'suspended');

    let totalMrr = 0;
    let projectedRevenue = 0;

    for (const account of activeAccounts) {
      const summary = await this.getUsageSummary(account.id);
      projectedRevenue += summary.projectedCost;

      // MRR is based on the subscription base price
      const sub = await this.getSubscription(account.id);
      if (sub && sub.product) {
        totalMrr += sub.product.price;
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newSignupsThisMonth = allAccounts.filter(a => a.createdAt && new Date(a.createdAt) >= startOfMonth).length;

    // History (Last 6 months)
    const mrrHistory = [];
    const signupsHistory = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];

      // For signups history, we can filter based on createdAt
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const count = allAccounts.filter(a => {
        const created = a.createdAt ? new Date(a.createdAt) : null;
        return created && created >= monthStart && created <= monthEnd;
      }).length;

      signupsHistory.push({ name: monthName, signups: count });

      // For MRR history, for now we return a growth curve based on current MRR
      // In a real system we would query past invoices
      const factor = 1 - (i * 0.15); // Simple mock de crescimento
      mrrHistory.push({ name: monthName, mrr: Math.round(totalMrr * factor) });
    }

    return {
      totalMrr,
      projectedRevenue,
      activeAccounts: activeAccounts.length,
      pendingAccounts: pendingAccounts.length,
      suspendedAccounts: suspendedAccounts.length,
      totalAccounts: allAccounts.length,
      newSignupsThisMonth,
      mrrHistory,
      signupsHistory
    };
  }

  // === PRICING MANAGEMENT ===
  async getPricingConfigs(category?: string): Promise<PricingConfig[]> {
    if (category) {
      return await db.select().from(pricingConfigs)
        .where(and(eq(pricingConfigs.category, category), eq(pricingConfigs.isActive, true)))
        .orderBy(pricingConfigs.sortOrder);
    }
    return await db.select().from(pricingConfigs)
      .where(eq(pricingConfigs.isActive, true))
      .orderBy(pricingConfigs.category, pricingConfigs.sortOrder);
  }

  async getPricingConfig(id: number): Promise<PricingConfig | undefined> {
    const [config] = await db.select().from(pricingConfigs).where(eq(pricingConfigs.id, id));
    return config;
  }

  async createPricingConfig(data: CreatePricingConfigRequest): Promise<PricingConfig> {
    const [config] = await db.insert(pricingConfigs).values(data).returning();
    return config;
  }

  async updatePricingConfig(id: number, data: UpdatePricingConfigRequest, changedBy: string, changeReason?: string): Promise<PricingConfig> {
    // Get current config for history
    const current = await this.getPricingConfig(id);
    if (!current) throw new Error('Pricing config not found');

    // Update the config
    const [updated] = await db.update(pricingConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingConfigs.id, id))
      .returning();

    // Record history if price changed
    if (data.priceCents !== undefined && data.priceCents !== current.priceCents) {
      await db.insert(pricingHistory).values({
        pricingConfigId: id,
        oldPriceCents: current.priceCents,
        newPriceCents: data.priceCents,
        changedBy,
        changeReason,
      });
    }

    return updated;
  }

  async deletePricingConfig(id: number): Promise<void> {
    await db.update(pricingConfigs)
      .set({ isActive: false })
      .where(eq(pricingConfigs.id, id));
  }

  async getPricingHistory(configId?: number): Promise<PricingHistory[]> {
    if (configId) {
      return await db.select().from(pricingHistory)
        .where(eq(pricingHistory.pricingConfigId, configId))
        .orderBy(desc(pricingHistory.createdAt));
    }
    return await db.select().from(pricingHistory)
      .orderBy(desc(pricingHistory.createdAt))
      .limit(100);
  }

  async seedPricingConfigs(): Promise<void> {
    const existing = await db.select().from(pricingConfigs).limit(1);
    if (existing.length > 0) return; // Already seeded

    const seedData: CreatePricingConfigRequest[] = [
      // VPS Pricing
      { category: 'vps', resourceKey: 'cpu_per_core', resourceLabel: 'CPU por Core', priceCents: 1500, unit: 'core', sortOrder: 1 },
      { category: 'vps', resourceKey: 'ram_per_gb', resourceLabel: 'RAM por GB', priceCents: 800, unit: 'gb', sortOrder: 2 },
      { category: 'vps', resourceKey: 'storage_per_gb', resourceLabel: 'SSD por GB', priceCents: 15, unit: 'gb', sortOrder: 3 },
      { category: 'vps', resourceKey: 'bandwidth_per_mbps', resourceLabel: 'Banda por Mbps', priceCents: 20, unit: 'mbps', sortOrder: 4 },
      { category: 'vps', resourceKey: 'public_ip', resourceLabel: 'IP Público', priceCents: 1500, unit: 'unit', sortOrder: 5 },
      { category: 'vps', resourceKey: 'backup_base', resourceLabel: 'Backup Base', priceCents: 2000, unit: 'unit', sortOrder: 6 },
      { category: 'vps', resourceKey: 'internal_network', resourceLabel: 'Rede Interna', priceCents: 500, unit: 'unit', sortOrder: 7 },
      // Backup Cloud Pricing
      { category: 'backup_cloud', resourceKey: 'storage_per_gb', resourceLabel: 'Armazenamento por GB', priceCents: 8, unit: 'gb', sortOrder: 1 },
      { category: 'backup_cloud', resourceKey: 'daily_backup', resourceLabel: 'Backup Diário', priceCents: 2000, unit: 'unit', sortOrder: 2 },
      { category: 'backup_cloud', resourceKey: 'weekly_backup', resourceLabel: 'Backup Semanal', priceCents: 1000, unit: 'unit', sortOrder: 3 },
      { category: 'backup_cloud', resourceKey: 'monthly_backup', resourceLabel: 'Backup Mensal', priceCents: 500, unit: 'unit', sortOrder: 4 },
      { category: 'backup_cloud', resourceKey: 'retention_per_day', resourceLabel: 'Retenção Extra por Dia', priceCents: 50, unit: 'day', sortOrder: 5 },
      // Backup VPS Pricing
      { category: 'backup_vps', resourceKey: 'snapshot_base', resourceLabel: 'Base Snapshot', priceCents: 5000, unit: 'unit', sortOrder: 1 },
      { category: 'backup_vps', resourceKey: 'per_gb', resourceLabel: 'Por GB de VM', priceCents: 15, unit: 'gb', sortOrder: 2 },
      { category: 'backup_vps', resourceKey: 'daily_multiplier', resourceLabel: 'Multiplicador Diário', priceCents: 150, unit: 'percent', sortOrder: 3 },
      { category: 'backup_vps', resourceKey: 'weekly_multiplier', resourceLabel: 'Multiplicador Semanal', priceCents: 100, unit: 'percent', sortOrder: 4 },
      { category: 'backup_vps', resourceKey: 'monthly_multiplier', resourceLabel: 'Multiplicador Mensal', priceCents: 50, unit: 'percent', sortOrder: 5 },
      { category: 'backup_vps', resourceKey: 'retention_per_day', resourceLabel: 'Retenção por Dia', priceCents: 100, unit: 'day', sortOrder: 6 },
      { category: 'backup_vps', resourceKey: 'database_addon', resourceLabel: 'Addon Databases', priceCents: 2000, unit: 'unit', sortOrder: 7 },
    ];

    for (const config of seedData) {
      await db.insert(pricingConfigs).values(config);
    }
  }

  // === ADMIN BUCKETS ===
  async getAllBucketsWithDetails(): Promise<{
    id: number;
    name: string;
    region: string | null;
    sizeBytes: number;
    objectCount: number | null;
    storageLimitGB: number | null;
    createdAt: Date | null;
    accountId: number | null;
    accountName: string;
    accountStatus: string | null;
    estimatedCostCents: number;
  }[]> {
    const results = await db.select({
      id: buckets.id,
      name: buckets.name,
      region: buckets.region,
      sizeBytes: buckets.sizeBytes,
      objectCount: buckets.objectCount,
      storageLimitGB: buckets.storageLimitGB,
      createdAt: buckets.createdAt,
      accountId: buckets.accountId,
      accountName: accounts.name,
      accountStatus: accounts.status,
    })
      .from(buckets)
      .leftJoin(accounts, eq(buckets.accountId, accounts.id))
      .orderBy(desc(buckets.sizeBytes));

    // Cost estimation: use default 15 cents per GB/month (0.15 BRL)
    const COST_PER_GB_CENTS = 15;

    return results.map(r => {
      const sizeGB = Number(r.sizeBytes || 0) / (1024 * 1024 * 1024);
      const estimatedCostCents = Math.ceil(sizeGB * COST_PER_GB_CENTS);

      return {
        id: r.id,
        name: r.name,
        region: r.region,
        sizeBytes: Number(r.sizeBytes || 0),
        objectCount: r.objectCount,
        storageLimitGB: r.storageLimitGB,
        createdAt: r.createdAt,
        accountId: r.accountId,
        accountName: r.accountName || 'Unknown',
        accountStatus: r.accountStatus,
        estimatedCostCents,
      };
    });
  }
}

export const storage = new DatabaseStorage();
