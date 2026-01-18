import { db } from "./db";
import {
  users, accounts, products, accountMembers, subscriptions, buckets, accessKeys, notifications, auditLogs, invitations, sftpCredentials, invoices, usageRecords, quotaRequests,
  type Account, type Product, type Subscription, type AccountMember, type Bucket, type AccessKey,
  type Notification, type AuditLog, type Invitation, type SftpCredential, type Invoice, type QuotaRequest,
  type CreateAccountRequest, type CreateMemberRequest, type CreateBucketRequest, type CreateAccessKeyRequest,
  type CreateNotificationRequest, type CreateAuditLogRequest, type CreateQuotaRequestRequest
} from "@shared/schema";
import { eq, and, desc, count, isNull, gt } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Accounts
  createAccount(data: CreateAccountRequest, ownerId: string): Promise<Account>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountsByOwner(userId: string): Promise<Account[]>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account>;
  getAllAccounts(): Promise<Account[]>; // Admin

  // Members
  addMember(accountId: number, userId: string, role: string): Promise<AccountMember>;
  getMembers(accountId: number): Promise<(AccountMember & { user: any })[]>;
  getMembership(userId: string, accountId: number): Promise<AccountMember | undefined>;
  getUserAccounts(userId: string): Promise<{ account: Account, role: string }[]>;
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
  getAuditLogs(accountId: number, limit?: number): Promise<AuditLog[]>;

  // Invitations
  createInvitation(accountId: number, email: string, role: string, invitedById: string): Promise<Invitation>;
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
  approveQuotaRequest(id: number, reviewerId: string, note?: string): Promise<QuotaRequest>;
  rejectQuotaRequest(id: number, reviewerId: string, note?: string): Promise<QuotaRequest>;
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

  async createAccount(data: CreateAccountRequest, ownerId: string): Promise<Account> {
    const [account] = await db.insert(accounts).values({ ...data, ownerId }).returning();
    // Add owner as member
    await this.addMember(account.id, ownerId, "owner");
    return account;
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountsByOwner(userId: string): Promise<Account[]> {
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

  async getMembership(userId: string, accountId: number): Promise<AccountMember | undefined> {
    const [member] = await db.select().from(accountMembers)
      .where(and(eq(accountMembers.userId, userId), eq(accountMembers.accountId, accountId)));
    return member;
  }

  async getUserAccounts(userId: string): Promise<{ account: Account, role: string }[]> {
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
    await db.delete(buckets).where(eq(buckets.id, id));
  }

  async updateBucketVersioning(id: number, enabled: boolean): Promise<Bucket> {
    const [bucket] = await db.update(buckets)
      .set({ versioningEnabled: enabled })
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

  async getAuditLogs(accountId: number, limit?: number): Promise<AuditLog[]> {
    const query = db.select().from(auditLogs)
      .where(eq(auditLogs.accountId, accountId))
      .orderBy(desc(auditLogs.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  // Invitations
  async createInvitation(accountId: number, email: string, role: string, invitedById: string): Promise<Invitation> {
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
    
    await db.update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    return member;
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
          createdAt: date,
          dueDate: dueDate,
          totalAmount: 2900 + Math.floor(Math.random() * 2000),
          status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
          paidAt: isPaid ? new Date(dueDate.getTime() - 86400000 * 3) : null,
        });
      }
      
      return mockInvoices;
    }
    
    return existingInvoices;
  }

  // Usage Summary
  async getUsageSummary(accountId: number): Promise<{
    storageUsedGB: number;
    bandwidthUsedGB: number;
    apiRequestsCount: number;
    projectedCost: number;
  }> {
    const account = await this.getAccount(accountId);
    const subscription = await this.getSubscription(accountId);
    
    let storageUsedGB = Math.round((account?.storageUsed || 0) / (1024 * 1024 * 1024) * 100) / 100;
    let bandwidthUsedGB = Math.round((account?.bandwidthUsed || 0) / (1024 * 1024 * 1024) * 100) / 100;
    
    const bucketList = await this.getBuckets(accountId);
    let apiRequestsCount = bucketList.reduce((sum, b) => sum + (b.objectCount || 0), 0) * 10;
    
    // Generate realistic mock data if no actual usage
    if (storageUsedGB === 0 && bandwidthUsedGB === 0) {
      storageUsedGB = 24.7;
      bandwidthUsedGB = 156.3;
      apiRequestsCount = 45230;
    }
    
    const baseCost = subscription?.product?.price || 2900;
    const storageCost = Math.max(0, storageUsedGB - (subscription?.product?.storageLimit || 100)) * 2;
    const projectedCost = baseCost + storageCost * 100;
    
    return {
      storageUsedGB,
      bandwidthUsedGB,
      apiRequestsCount,
      projectedCost,
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

  async approveQuotaRequest(id: number, reviewerId: string, note?: string): Promise<QuotaRequest> {
    const request = await this.getQuotaRequest(id);
    if (!request) throw new Error("Quota request not found");

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

  async rejectQuotaRequest(id: number, reviewerId: string, note?: string): Promise<QuotaRequest> {
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
}

export const storage = new DatabaseStorage();
