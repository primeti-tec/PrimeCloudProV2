import { db } from "./db";
import {
  users, accounts, products, accountMembers, subscriptions,
  type Account, type Product, type Subscription, type AccountMember,
  type CreateAccountRequest, type CreateMemberRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

  // Subscriptions
  createSubscription(accountId: number, productId: number): Promise<Subscription>;
  getSubscription(accountId: number): Promise<(Subscription & { product: Product }) | undefined>;
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
}

export const storage = new DatabaseStorage();
