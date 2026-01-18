import { db } from "./db";
import {
  users, accounts, products, accountMembers, subscriptions, buckets, accessKeys,
  type Account, type Product, type Subscription, type AccountMember, type Bucket, type AccessKey,
  type CreateAccountRequest, type CreateMemberRequest, type CreateBucketRequest, type CreateAccessKeyRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;

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
}

export const storage = new DatabaseStorage();
