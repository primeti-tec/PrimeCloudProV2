import type { Express } from "express";
import type { Server } from "http";
import { getAuth, requireAuth } from "@clerk/express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { accounts } from "@shared/schema";
import { z } from "zod";
import { authStorage } from "./replit_integrations/auth"; // To find users by email
import { validateDocument } from "./lib/document-validation";
import * as domainService from "./services/domain-service";
import * as smtpRoutes from "./routes/smtp";
import { sendInvitationEmail, sendEmail } from "./services/email";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";
import { minioService } from "./services/minio.service";
import { appendFileSync } from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Clerk middleware is registered in server/index.ts

  // Multi-tenancy middleware - Identify tenant by custom domain
  app.use(async (req: any, res, next) => {
    const host = req.get("host");

    if (host) {
      // Remove port if present
      const cleanHost = host.split(":")[0];

      // Check if this host matches a custom domain
      const allAccounts = await storage.getAllAccounts();
      const matchedAccount = allAccounts.find((account: any) =>
        account.customDomain?.toLowerCase() === cleanHost.toLowerCase() &&
        account.domainStatus === "active"
      );

      if (matchedAccount) {
        // Store the tenant context in the request
        req.tenantAccount = matchedAccount;
      }
    }

    next();
  });

  // --- Health Check ---
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  // --- Public Routes ---
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  // --- Dynamic PWA Manifest ---
  app.get("/manifest.webmanifest", async (req: any, res) => {
    const tenant = req.tenantAccount; // Populated by middleware

    // Default Manifest (PrimeCloud Pro)
    const defaultManifest = {
      name: "PrimeCloud Pro",
      short_name: "PrimeCloud",
      description: "Secure Cloud Storage & Backup Solution",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      scope: "/",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    };

    if (!tenant || !tenant.brandingAppName) {
      return res.json(defaultManifest);
    }

    // Tenant Overrides
    const manifest = {
      ...defaultManifest,
      name: tenant.brandingAppName,
      short_name: tenant.brandingAppName,
      description: `App exclusivo ${tenant.brandingAppName}`,
      theme_color: tenant.brandingThemeColor || defaultManifest.theme_color,
      background_color: tenant.brandingBgColor || defaultManifest.background_color,
      icons: tenant.brandingIconUrl
        ? [
          {
            src: tenant.brandingIconUrl, // We will process this URL to return various sizes if possible, or just use one for now
            sizes: "192x192 512x512", // Allowing one icon to serve both if high res
            type: "image/png",
          },
        ]
        : defaultManifest.icons,
    };

    res.json(manifest);
  });

  // --- White Label Asset Routes ---

  // Proxy for Public Assets (Icons)
  app.get("/api/branding/assets/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const stream = await minioService.getPublicAssetStream(filename);
      const extension = filename.split('.').pop();
      const mimeType = extension === 'png' ? 'image/png' : 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      stream.pipe(res);
    } catch (error) {
      console.error("Asset proxy error:", error);
      res.status(404).send("Asset not found");
    }
  });

  // Upload Branding Icon (Account Specific Route)
  app.post("/api/accounts/:id/branding", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid Account ID" });
      }

      const { appName, themeColor, bgColor, primaryColor } = req.body;
      let iconUrl = null;

      // Only process icon if file is uploaded
      if (req.file && req.file.buffer) {
        const buffer = req.file.buffer;

        // 1. Process 192x192
        const icon192 = await sharp(buffer)
          .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        const filename192 = `tenant-${accountId}-icon-192.png`;
        await minioService.uploadPublicAsset(filename192, icon192, "image/png");

        // 2. Process 512x512
        const icon512 = await sharp(buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        const filename512 = `tenant-${accountId}-icon-512.png`;
        await minioService.uploadPublicAsset(filename512, icon512, "image/png");

        iconUrl = `/api/branding/assets/${filename192}`;
      }

      // 3. Update Account in DB
      const updateData: any = {
        brandingAppName: appName,
        brandingThemeColor: themeColor,
        brandingPrimaryColor: primaryColor,
        brandingBgColor: bgColor,
      };

      // Only update icon URL if a new one was generated
      if (iconUrl) {
        updateData.brandingIconUrl = iconUrl;
      }

      await storage.updateAccount(accountId, updateData);

      res.json({ success: true, iconUrl });
    } catch (error) {
      console.error("Icon upload failed:", error);
      res.status(500).json({ message: "Failed to process icon" });
    }
  });

  app.get("/api/shares/:token/download", async (req, res) => {
    const token = req.params.token;
    const share = await storage.getObjectShareByToken(token);

    if (!share) {
      return res.status(404).json({ message: "Share not found" });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({ message: "Share expired" });
    }

    if (!share.accountId || !share.bucketId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const bucket = await storage.getBucket(share.bucketId);
    if (!bucket || bucket.accountId !== share.accountId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const { MinioService } = await import("./services/minio.service");
    const minioService = new MinioService(share.accountId.toString());

    try {
      const extension = share.objectKey.split(".").pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        txt: "text/plain",
        md: "text/markdown",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        mp4: "video/mp4",
        webm: "video/webm",
        mp3: "audio/mpeg",
        wav: "audio/wav",
      };

      const disposition = share.access === "download" ? "attachment" : "inline";
      const fileName = share.objectKey.split("/").pop() || share.objectKey;
      const contentType = mimeTypes[extension || ""] || "application/octet-stream";
      const respHeaders: Record<string, string> = {
        "response-content-disposition": `${disposition}; filename=\"${fileName}\"`,
        "response-content-type": contentType,
      };

      const downloadUrl = await minioService.presignedGetObject(bucket.name, share.objectKey, 3600, respHeaders);
      res.redirect(downloadUrl);
    } catch (error) {
      console.error("Error generating share download URL:", error);
      res.status(500).json({ message: "Failed to generate download URL" });
    }
  });

  const envSuperAdmins = (process.env.SUPER_ADMINS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const defaultSuperAdmins = ["sergio.louzan@gmail.com", "admin@primecloudpro.com"];
  const superAdmins = envSuperAdmins.length > 0 ? envSuperAdmins : defaultSuperAdmins;
  const isSuperAdmin = (email?: string | null) => !!email && superAdmins.includes(email);

  app.get("/api/auth/user", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const user = req.currentUser || (userId ? await authStorage.getUser(userId) : null);
    res.json({ user: user ?? null, isSuperAdmin: isSuperAdmin(user?.email) });
  });

  // --- Protected Routes ---
  // Middleware to check auth is applied to all /api/accounts* and /api/my-accounts*
  // But we'll apply it per route for clarity or use a router.
  // For simplicity in this structure:

  // List My Accounts
  app.get(api.accounts.listMy.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accounts = await storage.getUserAccounts(userId);
    console.log("DEBUG: Accounts branding:", accounts.map(a => ({ id: a.account.id, name: a.account.name, brandingPrimaryColor: a.account.brandingPrimaryColor })));
    res.json(accounts.map(a => ({ ...a.account, role: a.role })));
  });

  // Create Account
  app.post(api.accounts.create.path, requireAuth(), async (req: any, res) => {
    try {
      const input = api.accounts.create.input.parse(req.body);
      const { userId } = getAuth(req);

      // Validate document if provided
      if (input.document && input.documentType) {
        const validation = validateDocument(input.document, input.documentType as 'cpf' | 'cnpj');
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }
      }

      const account = await storage.createAccount(input, userId);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get Account Details (with check membership)
  app.get(api.accounts.get.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const account = await storage.getAccount(accountId);
    if (!account) return res.status(404).json({ message: "Not found" });

    const subscription = await storage.getSubscription(accountId);
    res.json({ ...account, subscription });
  });

  // Get Account Usage Summary
  app.get("/api/accounts/:id/usage", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    try {
      const summary = await storage.getUsageSummary(accountId);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ message: "Error fetching usage summary" });
    }
  });

  // Update Account
  app.patch(api.accounts.update.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.accounts.update.input.parse(req.body);

      // Validate document if provided
      if (input.document && input.documentType) {
        const validation = validateDocument(input.document, input.documentType as 'cpf' | 'cnpj');
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }
      }

      const account = await storage.updateAccount(accountId, input);

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'account.updated',
        resource: 'account',
        details: { updatedFields: Object.keys(input), resourceId: accountId.toString() },
      });

      res.json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  // Update Account Branding
  app.patch("/api/accounts/:id/branding", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const brandingSchema = z.object({
        brandingName: z.string().optional().nullable().transform(val => val === "" ? null : val),
        brandingLogo: z.string().optional().nullable().transform(val => val === "" ? null : val).refine(val => !val || z.string().url().safeParse(val).success, "Invalid URL"),
        brandingFavicon: z.string().optional().nullable().transform(val => val === "" ? null : val).refine(val => !val || z.string().url().safeParse(val).success, "Invalid URL"),
        brandingPrimaryColor: z.string().optional().nullable().transform(val => val === "" ? null : val).refine(val => !val || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val), "Invalid color"),
        brandingSidebarColor: z.string().optional().nullable().transform(val => val === "" ? null : val).refine(val => !val || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val), "Invalid color"),
      });

      const input = brandingSchema.parse(req.body);
      const account = await storage.updateAccount(accountId, input);

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'account.branding_updated',
        resource: 'account',
        details: { updatedFields: Object.keys(input), resourceId: accountId.toString() },
      });

      res.json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Configure Custom Domain
  app.patch("/api/accounts/:id/domain", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const domainSchema = z.object({
        customDomain: z.string().min(1, "Domain is required"),
      });

      const { customDomain } = domainSchema.parse(req.body);

      // Validate domain format
      if (!domainService.isValidDomain(customDomain)) {
        return res.status(400).json({ message: "Invalid domain format" });
      }

      // Check if domain is already in use
      const allAccounts = await storage.getAllAccounts();
      if (!domainService.isDomainUnique(customDomain, allAccounts, accountId)) {
        return res.status(409).json({ message: "This domain is already in use by another account" });
      }

      // Generate verification token
      const verificationToken = domainService.generateVerificationToken();

      // Update account with domain and token
      const account = await storage.updateAccount(accountId, {
        customDomain: customDomain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        domainStatus: "pending",
        dnsVerificationToken: verificationToken,
      });

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'account.domain_configured',
        resource: 'account',
        details: { customDomain, resourceId: accountId.toString() },
      });

      res.json({
        account,
        verificationToken,
        instructions: {
          cname: `Add a CNAME record pointing ${customDomain} to app.primecloudpro.com.br`,
          txt: `Or add a TXT record with: primecloudpro-verification=${verificationToken}`,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify Custom Domain
  app.post("/api/accounts/:id/domain/verify", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const account = await storage.getAccount(accountId);
      if (!account || !account.customDomain || !account.dnsVerificationToken) {
        return res.status(400).json({ message: "No domain configured for verification" });
      }

      // Verify DNS records
      const verificationResult = await domainService.verifyDomainOwnership(
        account.customDomain,
        account.dnsVerificationToken
      );

      // Update domain status based on verification result
      const newStatus = verificationResult.verified ? "active" : "failed";
      await storage.updateAccount(accountId, {
        domainStatus: newStatus,
      });

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: verificationResult.verified ? 'account.domain_verified' : 'account.domain_verification_failed',
        resource: 'account',
        details: {
          customDomain: account.customDomain,
          method: verificationResult.method,
          resourceId: accountId.toString(),
        },
      });

      res.json({
        verified: verificationResult.verified,
        status: newStatus,
        message: verificationResult.message,
        method: verificationResult.method,
      });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove Custom Domain
  app.delete("/api/accounts/:id/domain", requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const account = await storage.updateAccount(accountId, {
        customDomain: null,
        domainStatus: "pending",
        dnsVerificationToken: null,
      });

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'account.domain_removed',
        resource: 'account',
        details: { resourceId: accountId.toString() },
      });

      res.json({ message: "Custom domain removed successfully", account });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // List Members
  app.get(api.members.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const members = await storage.getMembers(accountId);

    // Enriquecer membros com buckets se for external_client
    const enrichedMembers = await Promise.all(members.map(async (member) => {
      if (member.role === 'external_client') {
        const permissions = await storage.getBucketPermissionsForMember(member.id);
        return { ...member, bucketPermissions: permissions };
      }
      return member;
    }));

    res.json(enrichedMembers);
  });

  // Add Member
  app.post(api.members.add.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const { email, role } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Find user by email (in a real app, you might invite by email. Here we need the user to exist in our auth table)
    // Replit auth doesn't expose 'find by email' easily unless we store it. We DO store it in upsertUser.
    // However, IAuthStorage interface doesn't have getByEmail. Let's assume we can query the DB directly or add it.
    // For MVP, we'll try to find user in `users` table. 
    // Since `authStorage` implementation is local, let's just query db directly here or extend storage.
    // I'll extend the route logic to query db directly for this specific case or assume we can't add until they log in?
    // Better: Allow adding by email, if not found, maybe create a placeholder? 
    // Replit Auth users are only created on login. 
    // Solution: Just fail if not found for MVP, or implement a "pending invitations" table.
    // I'll implement "fail if not found" for simplicity of MVP.

    // Hack: import db to find user
    const { users } = await import("@shared/models/auth");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("./db");

    const [targetUser] = await db.select().from(users).where(eq(users.email, email));

    if (!targetUser) {
      return res.status(404).json({ message: "User not found. They must log in at least once." });
    }

    const member = await storage.addMember(accountId, targetUser.id, role);
    res.status(201).json(member);
  });

  // Subscribe
  app.post(api.subscriptions.subscribe.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const { productId } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ message: "Only owners can manage subscriptions" });
    }

    const sub = await storage.createSubscription(accountId, productId);
    res.status(201).json(sub);
  });

  // Admin Routes (Simple check for specific email or super admin flag)
  // For MVP, I'll allow anyone to see "Admin" routes if they pass a specific header or just open for now?
  // No, that's insecure. I'll check if the user is the FIRST user or specific email.
  // I'll just check if email contains "@admin.com" for demo purposes or "admin" role in a special way.
  // Better: I'll hardcode a "isSuperAdmin" check function.
  app.get(api.admin.listAccounts.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const { userId } = getAuth(req);
    const accounts = await storage.getAllAccounts();
    await storage.createAuditLog({
      userId: userId || "unknown",
      action: "ADMIN_ACCOUNTS_VIEWED",
      resource: "account",
      details: { total: accounts.length },
      context: "admin",
    });
    res.json(accounts);
  });

  app.get(api.admin.getStats.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const { userId } = getAuth(req);
    const stats = await storage.getAdminStats();
    await storage.createAuditLog({
      userId: userId || "unknown",
      action: "ADMIN_STATS_VIEWED",
      resource: "stats",
      details: { totalAccounts: stats.totalAccounts },
      context: "admin",
    });
    res.json(stats);
  });

  app.post(api.admin.approveAccount.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const accountId = parseInt(req.params.id);
    const { userId } = getAuth(req);
    const account = await storage.updateAccount(accountId, { status: 'active' });
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'ACCOUNT_APPROVED',
      resource: 'account',
      details: { accountId, accountName: account.name },
    });
    res.json(account);
  });

  app.post(api.admin.rejectAccount.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const accountId = parseInt(req.params.id);
    const { userId } = getAuth(req);
    const { reason } = req.body || {};
    const account = await storage.updateAccount(accountId, { status: 'rejected' });
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'ACCOUNT_REJECTED',
      resource: 'account',
      details: { accountId, accountName: account.name, reason },
    });
    res.json(account);
  });

  app.post(api.admin.suspendAccount.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const accountId = parseInt(req.params.id);
    const { userId } = getAuth(req);
    const { reason } = req.body || {};
    const account = await storage.updateAccount(accountId, { status: 'suspended' });
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'ACCOUNT_SUSPENDED',
      resource: 'account',
      details: { accountId, accountName: account.name, reason },
    });
    res.json(account);
  });

  app.post(api.admin.reactivateAccount.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const accountId = parseInt(req.params.id);
    const { userId } = getAuth(req);
    const account = await storage.updateAccount(accountId, { status: 'active' });
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'ACCOUNT_REACTIVATED',
      resource: 'account',
      details: { accountId, accountName: account.name },
    });
    res.json(account);
  });

  app.post(api.admin.adjustQuota.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const accountId = parseInt(req.params.id);
      const { userId } = getAuth(req);
      const input = api.admin.adjustQuota.input.parse(req.body);
      console.log(`[Admin] Adjust Quota Input:`, input);
      const previousAccount = await storage.getAccount(accountId);
      const previousQuota = previousAccount?.storageQuotaGB || 100;

      const updateData: Partial<typeof accounts.$inferInsert> = { storageQuotaGB: input.quotaGB };
      if (input.manualBandwidthGB !== undefined) {
        updateData.bandwidthUsed = Math.round(input.manualBandwidthGB * 1024 * 1024 * 1024);
      }
      if (input.imperiusLicenseCount !== undefined) {
        updateData.imperiusLicenseCount = input.imperiusLicenseCount;
      }

      const account = await storage.updateAccount(accountId, updateData);
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'QUOTA_ADJUSTED',
        resource: 'account',
        details: {
          accountId,
          accountName: account.name,
          previousQuotaGB: previousQuota,
          newQuotaGB: input.quotaGB,
          imperiusLicenses: input.imperiusLicenseCount,
          reason: input.reason
        },
      });
      res.json(account);
    } catch (err: any) {
      console.error("[Admin] Adjust Quota Error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  });

  // Admin Products CRUD (protected by isSuperAdmin check)
  app.get(api.admin.listProducts.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.admin.createProduct.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const input = api.admin.createProduct.input.parse(req.body);
      const product = await storage.createProduct(input);
      await storage.createAuditLog({
        userId: userId!,
        action: 'PRODUCT_CREATED',
        resource: 'product',
        details: { productId: product.id, productName: product.name },
      });
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.admin.updateProduct.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const productId = parseInt(req.params.id);

      console.log(`[Admin] Gerenciamento de Produtos - Iniciando PATCH /api/admin/products/${productId}`);
      console.log(`[Admin] Usuário ID: ${userId}`);
      console.log(`[Admin] Corpo da Requisição:`, JSON.stringify(req.body));

      const input = api.admin.updateProduct.input.parse(req.body);

      // Remove o campo id para evitar erro de chave primária no Drizzle
      const { id, ...updateData } = input as any;

      if (Object.keys(updateData).length === 0) {
        console.log(`[Admin] Nada para atualizar.`);
        const product = await storage.getProduct(productId);
        return res.json(product);
      }

      const product = await storage.updateProduct(productId, updateData);

      if (!product) {
        console.warn(`[Admin] Produto ${productId} não encontrado.`);
        return res.status(404).json({ message: "Product not found" });
      }

      console.log(`[Admin] Produto atualizado com sucesso: ${product.name}`);

      // Log de auditoria (não-crítico)
      try {
        await storage.createAuditLog({
          userId: userId || 'unknown',
          action: 'PRODUCT_UPDATED',
          resource: 'product',
          details: { productId: product.id, productName: product.name, changes: updateData },
        });
      } catch (auditErr) {
        console.error(`[Admin] Erro no log de auditoria:`, auditErr);
      }

      res.json(product);
    } catch (err: any) {
      console.error("[Admin] ERRO FATAL no PATCH de produto:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      // Retorna o erro real para ajudar no diagnóstico
      res.status(500).json({
        message: "Internal Server Error",
        detail: err.message,
        error: String(err)
      });
    }
  });

  app.delete(api.admin.deleteProduct.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const { userId } = getAuth(req);
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    await storage.deleteProduct(productId);
    await storage.createAuditLog({
      userId: userId!,
      action: 'PRODUCT_DELETED',
      resource: 'product',
      details: { productId, productName: product?.name },
    });
    res.json({ success: true });
  });

  // === PRICING MANAGEMENT (Admin Only) ===

  // Get all pricing configs (public for frontend)
  app.get('/api/pricing', async (req: any, res) => {
    const category = req.query.category as string | undefined;
    const configs = await storage.getPricingConfigs(category);
    res.json(configs);
  });

  // Get all pricing configs (admin)
  app.get('/api/admin/pricing', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const category = req.query.category as string | undefined;
    const configs = await storage.getPricingConfigs(category);
    res.json(configs);
  });

  // Create pricing config
  app.post('/api/admin/pricing', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const config = await storage.createPricingConfig(req.body);
      await storage.createAuditLog({
        userId: userId!,
        action: 'PRICING_CREATED',
        resource: 'pricing',
        details: { configId: config.id, category: config.category, resourceKey: config.resourceKey },
      });
      res.status(201).json(config);
    } catch (err) {
      res.status(400).json({ message: "Failed to create pricing config" });
    }
  });

  // Update pricing config
  app.put('/api/admin/pricing/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const configId = parseInt(req.params.id);
      const { changeReason, ...data } = req.body;
      const config = await storage.updatePricingConfig(configId, data, userId || 'unknown', changeReason);
      await storage.createAuditLog({
        userId: userId!,
        action: 'PRICING_UPDATED',
        resource: 'pricing',
        details: { configId, updates: data, changeReason },
      });
      res.json(config);
    } catch (err) {
      res.status(400).json({ message: "Failed to update pricing config" });
    }
  });

  // Delete (deactivate) pricing config
  app.delete('/api/admin/pricing/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const { userId } = getAuth(req);
    const configId = parseInt(req.params.id);
    await storage.deletePricingConfig(configId);
    await storage.createAuditLog({
      userId: userId!,
      action: 'PRICING_DELETED',
      resource: 'pricing',
      details: { configId },
    });
    res.json({ success: true });
  });

  // Get pricing history
  app.get('/api/admin/pricing/history', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
    const history = await storage.getPricingHistory(configId);
    res.json(history);
  });

  // Seed pricing configs (admin utility)
  app.post('/api/admin/pricing/seed', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    await storage.seedPricingConfigs();
    res.json({ success: true, message: 'Pricing configs seeded' });
  });

  // Update Subscription (Admin) - e.g. for prepaid date adjustments
  app.patch('/api/admin/subscriptions/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const subId = parseInt(req.params.id);
      const data = req.body; // { currentPeriodEnd, status, etc. }
      const updated = await storage.updateSubscription(subId, data);
      res.json(updated);
    } catch (err: any) {
      console.error('[Admin Subscription] Error updating:', err);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // === ADMIN BUCKETS MANAGEMENT ===
  // List all buckets across all accounts (Super Admin only)
  app.get('/api/admin/buckets', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const buckets = await storage.getAllBucketsWithDetails();
      await storage.createAuditLog({
        userId: userId || "unknown",
        action: "ADMIN_BUCKETS_VIEWED",
        resource: "bucket",
        details: { total: buckets.length },
        context: "admin",
      });
      res.json(buckets);
    } catch (err) {
      console.error('[Admin Buckets] Error fetching buckets:', err);
      res.status(500).json({ message: "Failed to fetch buckets" });
    }
  });

  // === ADMIN INVOICES MANAGEMENT ===
  // List all invoices (Admin)
  app.get('/api/admin/invoices', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const allInvoices = await storage.getAllInvoices();
      res.json(allInvoices);
    } catch (err) {
      console.error('[Admin Invoices] Error fetching invoices:', err);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Generate monthly invoices for all accounts (Admin)
  app.post('/api/admin/invoices/generate-monthly', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const result = await storage.generateAllMonthlyInvoices();

      await storage.createAuditLog({
        userId: userId!,
        action: 'INVOICES_GENERATED',
        resource: 'invoices',
        details: { generated: result.generated, errors: result.errors },
        severity: 'info',
      });

      res.json(result);
    } catch (err: any) {
      console.error('[Admin Invoices] Error generating invoices:', err);
      res.status(500).json({ message: err.message || "Failed to generate invoices" });
    }
  });

  // Generate invoice for a specific account (Admin)
  app.post('/api/admin/invoices/generate/:accountId', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const accountId = parseInt(req.params.accountId);
      const invoice = await storage.generateMonthlyInvoice(accountId);
      res.json(invoice);
    } catch (err: any) {
      console.error('[Admin Invoices] Error generating invoice:', err);
      res.status(500).json({ message: err.message || "Failed to generate invoice" });
    }
  });

  // Mark invoice as paid (Admin)
  app.patch('/api/admin/invoices/:id/paid', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const invoiceId = parseInt(req.params.id);
      const { paymentMethod } = req.body;

      const invoice = await storage.markInvoicePaid(invoiceId, paymentMethod);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      await storage.createAuditLog({
        userId: userId!,
        action: 'INVOICE_PAID',
        resource: 'invoice',
        details: { invoiceId, invoiceNumber: invoice.invoiceNumber, paymentMethod },
        severity: 'info',
      });

      res.json(invoice);
    } catch (err: any) {
      console.error('[Admin Invoices] Error marking invoice paid:', err);
      res.status(500).json({ message: err.message || "Failed to update invoice" });
    }
  });

  // Update invoice status (Admin)
  app.patch('/api/admin/invoices/:id/status', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'paid', 'overdue', 'canceled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const invoice = await storage.updateInvoiceStatus(invoiceId, status);
      res.json(invoice);
    } catch (err: any) {
      console.error('[Admin Invoices] Error updating invoice status:', err);
      res.status(500).json({ message: err.message || "Failed to update invoice" });
    }
  });

  // Delete Invoice (Admin)
  app.delete('/api/admin/invoices/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const invoiceId = parseInt(req.params.id);
      await storage.deleteInvoice(invoiceId);
      await storage.createAuditLog({
        userId: userId!,
        action: 'INVOICE_DELETED',
        resource: 'invoice',
        details: { invoiceId },
        severity: 'warning'
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete invoice" });
    }
  });

  // Admin Order Management
  app.patch('/api/admin/orders/:id/deny', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const orderId = parseInt(req.params.id);
      const { reason } = req.body;
      const order = await storage.denyOrder(orderId, reason);
      await storage.createAuditLog({
        userId: userId!,
        action: 'ORDER_DENIED',
        resource: 'order',
        details: { orderId, reason }
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/admin/orders/:id/cancel', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const orderId = parseInt(req.params.id);
      const { reason } = req.body;
      const order = await storage.updateOrder(orderId, { status: 'canceled', cancelReason: reason, canceledAt: new Date() });

      await storage.createAuditLog({
        userId: userId!,
        action: 'ORDER_CANCELED',
        resource: 'order',
        details: { orderId, reason }
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/admin/orders/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const orderId = parseInt(req.params.id);
      await storage.deleteOrder(orderId);
      await storage.createAuditLog({
        userId: userId!,
        action: 'ORDER_DELETED',
        resource: 'order',
        details: { orderId }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin Account Deletion
  app.delete('/api/admin/accounts/:id', requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.id);
      await storage.deleteAccount(accountId);
      await storage.createAuditLog({
        userId: userId!,
        action: 'ACCOUNT_DELETED',
        resource: 'account',
        details: { accountId },
        severity: 'warning'
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete account" });
    }
  });

  // Remove Member
  app.delete(api.members.remove.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const memberId = parseInt(req.params.memberId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.removeMember(accountId, memberId);
    res.json({ success: true });
  });

  // Update Member Role
  app.patch('/api/accounts/:accountId/members/:memberId', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const member = await storage.updateMemberRole(memberId, role);
    res.json(member);
  });

  // --- Buckets Routes ---
  app.get(api.buckets.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    let bucketList = await storage.getBuckets(accountId);

    // Debug logs
    console.log(`[Buckets] User: ${userId}, Account: ${accountId}, Role: ${membership.role}, Member ID: ${membership.id}`);
    console.log(`[Buckets] Total buckets in account: ${bucketList.length}`);

    // Filter buckets for external_client based on permissions
    if (membership.role === 'external_client') {
      const accessibleBucketIds = await storage.getAccessibleBucketsForUser(userId!, accountId);
      console.log(`[Buckets] Accessible bucket IDs for external client: ${JSON.stringify(accessibleBucketIds)}`);

      bucketList = bucketList.filter(b => accessibleBucketIds.includes(b.id));
      console.log(`[Buckets] Filtered bucket count: ${bucketList.length}`);

      // Add permission info to each bucket
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      console.log(`[Buckets] Member permissions: ${JSON.stringify(permissions)}`);

      bucketList = bucketList.map(bucket => ({
        ...bucket,
        userPermission: permissions.find(p => p.bucketId === bucket.id)?.permission || 'read'
      }));
    } else {
      // Non-external clients have full access
      bucketList = bucketList.map(bucket => ({
        ...bucket,
        userPermission: 'read-write'
      }));
    }

    res.json(bucketList);
  });

  app.post(api.buckets.create.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const { name, region, isPublic, storageLimitGB } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bucket = await storage.createBucket({ accountId, name, region, isPublic, storageLimitGB });
    res.status(201).json(bucket);
  });

  app.patch(api.buckets.updateLimit.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { limit } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bucket = await storage.updateBucketLimit(bucketId, limit);
    res.json(bucket);
  });

  // Update Bucket (Generic - for linking Customer)
  app.patch('/api/accounts/:accountId/buckets/:bucketId', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    // Only allow specific fields to be updated
    const { customerId, isImperiusBackup, storageLimitGB, isPublic } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updateData: any = {};

    // Verify properties if provided
    if (customerId !== undefined) {
      if (customerId === null) {
        updateData.customerId = null;
      } else {
        const customer = await storage.getCustomer(customerId);
        if (!customer || customer.accountId !== accountId) {
          return res.status(400).json({ message: "Invalid customer ID for this account" });
        }
        updateData.customerId = customerId;
      }
    }

    if (isImperiusBackup !== undefined) updateData.isImperiusBackup = isImperiusBackup;
    if (storageLimitGB !== undefined) updateData.storageLimitGB = storageLimitGB;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const bucket = await storage.updateBucket(bucketId, updateData);
    res.json(bucket);
  });

  app.delete(api.buckets.delete.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.deleteBucket(bucketId);
    res.json({ success: true });
  });

  // Bucket Versioning
  app.put('/api/accounts/:accountId/buckets/:bucketId/versioning', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { enabled } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bucket = await storage.updateBucketVersioning(bucketId, enabled);
    res.json(bucket);
  });

  // Bucket Lifecycle Rules
  app.get('/api/accounts/:accountId/buckets/:bucketId/lifecycle', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const rules = await storage.getBucketLifecycle(bucketId);
    res.json(rules);
  });

  app.post('/api/accounts/:accountId/buckets/:bucketId/lifecycle', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const rule = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bucket = await storage.addLifecycleRule(bucketId, rule);
    res.json(bucket);
  });

  app.delete('/api/accounts/:accountId/buckets/:bucketId/lifecycle/:ruleId', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const ruleId = req.params.ruleId;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bucket = await storage.deleteLifecycleRule(bucketId, ruleId);
    res.json(bucket);
  });

  // --- Bucket Objects (File Management) Routes ---
  // List objects in a bucket
  app.get(api.objects.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const prefix = req.query.prefix as string | undefined;
    const recursive = req.query.recursive === 'true';

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    // Check bucket permissions for external clients
    if (membership.role === 'external_client') {
      console.log(`[Objects] Checking permissions for external client ${userId} on bucket ${bucketId}`);
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      console.log(`[Objects] All member permissions:`, JSON.stringify(permissions));
      const bucketPerm = permissions.find(p => p.bucketId === bucketId);
      if (!bucketPerm || !['read', 'read-write'].includes(bucketPerm.permission)) {
        console.log(`[Objects] Access denied. Perm found:`, JSON.stringify(bucketPerm));
        return res.status(403).json({ message: "No read permission for this bucket" });
      }
      console.log(`[Objects] Permission granted: ${bucketPerm.permission}`);
    }

    // Get bucket info
    const bucket = await storage.getBucket(bucketId);
    if (!bucket || bucket.accountId !== accountId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    // Initialize MinIO service and list objects
    const { MinioService } = await import("./services/minio.service");
    const minioService = new MinioService(accountId.toString());

    try {
      console.log(`[Objects] Listing objects for bucket: ${bucket.name}, account: ${accountId}, prefix: ${prefix || '(none)'}, recursive: ${recursive}`);
      if (recursive) {
        const objects = await minioService.listObjectsRecursive(bucket.name, prefix || undefined);
        console.log(`[Objects] Recursive result: ${objects.length} objects`);
        res.json({
          objects: objects.map((obj: any) => ({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified?.toISOString() || new Date().toISOString(),
            etag: obj.etag,
          })),
          prefixes: [],
          prefix: prefix || '',
        });
      } else {
        const result = await minioService.listObjectsWithPrefixes(bucket.name, prefix || undefined);
        console.log(`[Objects] Listing result: ${result.objects.length} objects, ${result.prefixes.length} prefixes`);
        res.json({
          objects: result.objects.map((obj: any) => ({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified?.toISOString() || new Date().toISOString(),
            etag: obj.etag,
          })),
          prefixes: result.prefixes,
          prefix: prefix || '',
        });
      }
    } catch (error) {
      console.error("[Objects] Error listing objects:", error);
      res.status(500).json({ message: "Failed to list objects" });
    }
  });

  // Get presigned upload URL
  app.post(api.objects.getUploadUrl.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { filename, prefix } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    // Check bucket permissions for external clients
    if (membership.role === 'external_client') {
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      const bucketPerm = permissions.find(p => p.bucketId === bucketId);
      if (!bucketPerm || !['write', 'read-write'].includes(bucketPerm.permission)) {
        return res.status(403).json({ message: "No write permission for this bucket" });
      }
    }

    const bucket = await storage.getBucket(bucketId);
    if (!bucket || bucket.accountId !== accountId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const { MinioService } = await import("./services/minio.service");
    const minioService = new MinioService(accountId.toString());

    try {
      const objectKey = prefix ? `${prefix}${filename}` : filename;
      const uploadUrl = await minioService.presignedPutObject(bucket.name, objectKey, 3600);
      res.json({ uploadUrl, objectKey });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Get presigned download URL
  app.get(api.objects.getDownloadUrl.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const key = req.query.key as string;

    if (!key) {
      return res.status(400).json({ message: "Object key is required" });
    }

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    // Check bucket permissions for external clients
    if (membership.role === 'external_client') {
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      const bucketPerm = permissions.find(p => p.bucketId === bucketId);
      if (!bucketPerm || !['read', 'read-write'].includes(bucketPerm.permission)) {
        return res.status(403).json({ message: "No read permission for this bucket" });
      }
    }

    const bucket = await storage.getBucket(bucketId);
    if (!bucket || bucket.accountId !== accountId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const { MinioService } = await import("./services/minio.service");
    const minioService = new MinioService(accountId.toString());

    try {
      const extension = key.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
      };

      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      const fileName = key.split('/').pop() || key;
      const contentType = mimeTypes[extension || ''] || 'application/octet-stream';

      const respHeaders: Record<string, string> = {
        'response-content-disposition': `${disposition}; filename="${fileName}"`
      };

      // Always force content-type for preview to ensure browser handles it (PDF, TXT, etc)
      if (req.query.download !== 'true') {
        respHeaders['response-content-type'] = contentType;
      }

      const downloadUrl = await minioService.presignedGetObject(bucket.name, key, 3600, respHeaders);
      res.json({ downloadUrl });
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ message: "Failed to generate download URL" });
    }
  });

  // Delete object
  app.delete(api.objects.delete.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const key = req.query.key as string;

    if (!key) {
      return res.status(400).json({ message: "Object key is required" });
    }

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    // Check bucket permissions for external clients
    if (membership.role === 'external_client') {
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      const bucketPerm = permissions.find(p => p.bucketId === bucketId);
      if (!bucketPerm || !['write', 'read-write'].includes(bucketPerm.permission)) {
        return res.status(403).json({ message: "No write permission for this bucket" });
      }
    }

    const bucket = await storage.getBucket(bucketId);
    if (!bucket || bucket.accountId !== accountId) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const { MinioService } = await import("./services/minio.service");
    const minioService = new MinioService(accountId.toString());

    try {
      const result = await minioService.removeObject(bucket.name, key);
      if (result.success) {
        await storage.createAuditLog({
          accountId,
          userId,
          action: 'OBJECT_DELETED',
          resource: 'object',
          details: { bucketId, bucketName: bucket.name, objectKey: key },
        });
        res.json({ success: true });
      } else {
        res.status(500).json({ message: result.error || "Failed to delete object" });
      }
    } catch (error) {
      console.error("Error deleting object:", error);
      res.status(500).json({ message: "Failed to delete object" });
    }
  });

  // --- Access Keys Routes ---
  app.get(api.accessKeys.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const keys = await storage.getAccessKeys(accountId);
    res.json(keys);
  });

  app.post(api.accessKeys.create.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const { name, permissions } = req.body;

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const key = await storage.createAccessKey({ accountId, name, permissions });
    res.status(201).json(key);
  });

  app.delete(api.accessKeys.revoke.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const keyId = parseInt(req.params.keyId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.revokeAccessKey(keyId);
    res.json({ success: true });
  });

  const ensureBucketPermission = async (userId: string, accountId: number, bucketId: number, required: "read" | "write") => {
    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return { ok: false as const, message: "Forbidden" };

    const bucket = await storage.getBucket(bucketId);
    if (!bucket || bucket.accountId !== accountId) {
      return { ok: false as const, message: "Bucket not found" };
    }

    if (membership.role === 'external_client') {
      const permissions = await storage.getBucketPermissionsForMember(membership.id);
      const bucketPerm = permissions.find(p => p.bucketId === bucketId);
      if (!bucketPerm) return { ok: false as const, message: "No permission for this bucket" };

      if (required === "read" && !['read', 'read-write'].includes(bucketPerm.permission)) {
        return { ok: false as const, message: "No read permission for this bucket" };
      }
      if (required === "write" && !['write', 'read-write'].includes(bucketPerm.permission)) {
        return { ok: false as const, message: "No write permission for this bucket" };
      }
    }

    return { ok: true as const, membership };
  };

  // --- Object Favorites ---
  app.get(api.objectFavorites.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    const keys = await storage.getObjectFavorites(userId!, accountId, bucketId);
    res.json({ keys });
  });

  app.post(api.objectFavorites.add.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { key } = req.body || {};

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    if (!key) return res.status(400).json({ message: "Object key is required" });
    await storage.addObjectFavorite(userId!, accountId, bucketId, key);
    res.status(201).json({ success: true });
  });

  app.delete(api.objectFavorites.remove.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { key } = req.body || {};

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    if (!key) return res.status(400).json({ message: "Object key is required" });
    await storage.removeObjectFavorite(userId!, accountId, bucketId, key);
    res.json({ success: true });
  });

  // --- Object Tags ---
  app.get(api.objectTags.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    const tags = await storage.getObjectTags(userId!, accountId, bucketId);
    res.json({ tags });
  });

  app.post(api.objectTags.add.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { key, tag } = req.body || {};

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    if (!key || !tag) return res.status(400).json({ message: "Object key and tag are required" });
    await storage.addObjectTag(userId!, accountId, bucketId, key, tag);
    res.status(201).json({ success: true });
  });

  app.delete(api.objectTags.remove.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { key, tag } = req.body || {};

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    if (!key || !tag) return res.status(400).json({ message: "Object key and tag are required" });
    await storage.removeObjectTag(userId!, accountId, bucketId, key, tag);
    res.json({ success: true });
  });

  // --- Object Shares ---
  app.get(api.objectShares.listByMe.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    const shares = await storage.getObjectSharesByUser(accountId, bucketId, userId!);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json(shares.map((share) => ({
      ...share,
      shareUrl: `${baseUrl}/api/shares/${share.token}/download`,
    })));
  });

  app.get(api.objectShares.listWithMe.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const userEmail = req.currentUser?.email || "";

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    if (!userEmail) return res.json([]);
    const shares = await storage.getObjectSharesWithUser(accountId, bucketId, userEmail);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json(shares.map((share) => ({
      ...share,
      shareUrl: `${baseUrl}/api/shares/${share.token}/download`,
    })));
  });

  app.post(api.objectShares.create.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const { key, sharedWithEmail, access, expiresAt } = req.body || {};

    const accessCheck = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!accessCheck.ok) return res.status(403).json({ message: accessCheck.message });

    if (!key) return res.status(400).json({ message: "Object key is required" });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresDate = expiresAt ? new Date(expiresAt) : null;
    const share = await storage.createObjectShare({
      accountId,
      bucketId,
      objectKey: key,
      sharedByUserId: userId!,
      sharedWithEmail: sharedWithEmail || null,
      access: access || "read",
      expiresAt: expiresDate,
      token,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      id: share.id,
      token: share.token,
      shareUrl: `${baseUrl}/api/shares/${share.token}/download`,
      access: share.access,
      expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
    });
  });

  app.delete(api.objectShares.revoke.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const bucketId = parseInt(req.params.bucketId);
    const shareId = parseInt(req.params.shareId);

    const access = await ensureBucketPermission(userId!, accountId, bucketId, "read");
    if (!access.ok) return res.status(403).json({ message: access.message });

    await storage.revokeObjectShare(accountId, bucketId, userId!, shareId);
    res.json({ success: true });
  });

  app.post(api.accessKeys.rotate.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const keyId = parseInt(req.params.keyId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingKey = await storage.getAccessKey(keyId);
    if (!existingKey || existingKey.accountId !== accountId) {
      return res.status(404).json({ message: "Access key not found" });
    }

    const key = await storage.rotateAccessKey(keyId);
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'ACCESS_KEY_ROTATED',
      resource: 'access_key',
      details: { keyId, keyName: existingKey.name },
    });
    res.json(key);
  });

  app.post(api.accessKeys.toggleActive.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const keyId = parseInt(req.params.keyId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingKey = await storage.getAccessKey(keyId);
    if (!existingKey || existingKey.accountId !== accountId) {
      return res.status(404).json({ message: "Access key not found" });
    }

    const key = await storage.toggleAccessKeyActive(keyId);
    await storage.createAuditLog({
      accountId,
      userId,
      action: key.isActive ? 'ACCESS_KEY_ACTIVATED' : 'ACCESS_KEY_DEACTIVATED',
      resource: 'access_key',
      details: { keyId, keyName: existingKey.name, isActive: key.isActive },
    });
    res.json(key);
  });

  // --- Notifications Routes ---
  app.get('/api/accounts/:accountId/notifications', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const notificationList = await storage.getNotifications(accountId, 50);
    res.json(notificationList);
  });

  app.get('/api/accounts/:accountId/notifications/unread-count', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const count = await storage.getUnreadCount(accountId);
    res.json({ count });
  });

  app.patch('/api/accounts/:accountId/notifications/:notificationId/read', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const notificationId = parseInt(req.params.notificationId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const notification = await storage.markNotificationRead(notificationId);
    res.json(notification);
  });

  app.patch('/api/accounts/:accountId/notifications/read-all', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    await storage.markAllNotificationsRead(accountId);
    res.json({ success: true });
  });

  app.delete('/api/accounts/:accountId/notifications/:id', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const notificationId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteNotification(notificationId);
    res.json({ success: true });
  });

  // --- Audit Logs Routes ---
  app.get('/api/accounts/:accountId/audit-logs', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const { action, severity, search, startDate, endDate, limit } = req.query;

    const logs = await storage.getAuditLogs(accountId, {
      action: action as string | undefined,
      severity: severity as string | undefined,
      search: search as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });

    // Format the logs for the frontend
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceType: log.resource,
      resourceName: (log.details as any)?.resourceName || (log.details as any)?.resourceId || log.resource,
      details: log.details,
      severity: log.severity,
      context: log.context,
      ipAddress: log.ipAddress || "N/A",
      userAgent: log.userAgent,
      timestamp: log.createdAt,
      userId: log.userId,
      userName: [log.userFirstName, log.userLastName].filter(Boolean).join(" ") || null,
      userEmail: log.userEmail,
    }));

    res.json(formattedLogs);
  });

  // --- Invitations Routes ---
  app.post('/api/accounts/:accountId/invitations', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const { email, role, bucketPermissions: bpList } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      // Build metadata with bucket permissions for external_client
      const metadata = role === 'external_client' && bpList ? { bucketPermissions: bpList } : {};
      console.log(`[Invite] Creating invite for ${email}, role: ${role}, bucketPermissions:`, JSON.stringify(bpList));
      console.log(`[Invite] Metadata being saved:`, JSON.stringify(metadata));
      const invitation = await storage.createInvitation(accountId, email, role, userId, metadata);

      // Get account and inviter info for the email
      const account = await storage.getAccount(accountId);
      const inviter = userId ? await authStorage.getUser(userId) : null;

      // Build invite URL
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

      // Get account's SMTP config
      const smtpConfig = account ? {
        smtpEnabled: account.smtpEnabled || false,
        smtpHost: account.smtpHost,
        smtpPort: account.smtpPort,
        smtpUser: account.smtpUser,
        smtpPass: account.smtpPass,
        smtpFromEmail: account.smtpFromEmail,
        smtpFromName: account.smtpFromName,
        smtpEncryption: account.smtpEncryption,
        branding: {
          name: account.brandingAppName || undefined,
          logoUrl: account.brandingIconUrl || undefined,
          primaryColor: account.brandingPrimaryColor || undefined,
        },
      } : undefined;

      // Send invitation email
      try {
        const inviterName = inviter?.firstName
          ? `${inviter.firstName} ${inviter.lastName || ''}`.trim()
          : inviter?.email || 'Um administrador';
        const accountName = account?.name || 'Prime Cloud Pro';

        await sendInvitationEmail(email, inviterName, accountName, inviteUrl, smtpConfig);
        console.log(`✅ [Invitation] Email de convite enviado para ${email}`);
      } catch (emailError) {
        // Log error but don't fail the request - invitation was created successfully
        console.error(`⚠️ [Invitation] Falha ao enviar email de convite:`, emailError);
      }

      // Audit log
      await storage.createAuditLog({
        accountId,
        userId,
        action: 'MEMBER_INVITED',
        resource: 'invitation',
        details: { email, role, invitationId: invitation.id },
      });

      res.status(201).json(invitation);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create invitation" });
    }
  });

  app.get('/api/accounts/:accountId/invitations', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const invitationsList = await storage.getInvitationsByAccount(accountId);
    res.json(invitationsList);
  });

  app.delete('/api/accounts/:accountId/invitations/:id', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const invitationId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.deleteInvitation(invitationId);
    res.json({ success: true });
  });

  app.get('/api/invitations/:token', async (req: any, res) => {
    const { token } = req.params;
    const invitation = await storage.getInvitationByToken(token);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ message: "Invitation already accepted" });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: "Invitation has expired" });
    }

    const account = await storage.getAccount(invitation.accountId!);
    const { users } = await import("@shared/models/auth");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("./db");

    let inviter = null;
    if (invitation.invitedBy) {
      const [user] = await db.select().from(users).where(eq(users.id, invitation.invitedBy));
      inviter = user ? { firstName: user.firstName, email: user.email } : null;
    }

    res.json({
      ...invitation,
      account: account ? { id: account.id, name: account.name } : null,
      inviter,
    });
  });

  app.post('/api/invitations/:token/accept', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { token } = req.params;

    try {
      const member = await storage.acceptInvitation(token, userId);
      res.status(201).json(member);
    } catch (err: any) {
      if (err.message === "Invitation not found") {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === "Invitation already accepted" || err.message === "Invitation has expired") {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: err.message || "Failed to accept invitation" });
    }
  });

  // --- SFTP Credentials Routes ---
  app.get('/api/accounts/:accountId/sftp', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const credential = await storage.getSftpCredentials(accountId);
    res.json(credential || null);
  });

  app.post('/api/accounts/:accountId/sftp', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existing = await storage.getSftpCredentials(accountId);
    if (existing) {
      return res.status(400).json({ message: "SFTP credentials already exist. Use reset-password to generate a new password." });
    }

    const credential = await storage.createSftpCredentials(accountId);
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'SFTP_CREDENTIALS_CREATED',
      resource: 'sftp_credentials',
      details: { username: credential.username },
    });
    res.status(201).json(credential);
  });

  app.post('/api/accounts/:accountId/sftp/reset-password', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existing = await storage.getSftpCredentials(accountId);
    if (!existing) {
      return res.status(404).json({ message: "No SFTP credentials found. Create them first." });
    }

    const credential = await storage.resetSftpPassword(accountId);
    await storage.createAuditLog({
      accountId,
      userId,
      action: 'SFTP_PASSWORD_RESET',
      resource: 'sftp_credentials',
      details: { username: credential.username },
    });
    res.json(credential);
  });

  // --- Invoices Routes ---
  app.get(api.invoices.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const invoiceList = await storage.getInvoices(accountId);
    res.json(invoiceList);
  });

  // --- Usage Routes ---
  app.get(api.usage.get.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const usage = await storage.getUsageSummary(accountId);
    res.json(usage);
  });

  app.get('/api/accounts/:accountId/usage/history', requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const history = await storage.getUsageHistory(accountId);
    res.json(history);
  });

  // --- Quota Requests Routes ---
  // Create a quota request
  app.post(api.quotaRequests.create.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);
      const { requestedQuotaGB, reason } = req.body;

      const membership = await storage.getMembership(userId, accountId);
      if (!membership) return res.status(403).json({ message: "Forbidden" });

      const account = await storage.getAccount(accountId);
      if (!account) return res.status(404).json({ message: "Account not found" });

      const currentQuotaGB = account.storageQuotaGB || 100;

      const request = await storage.createQuotaRequest({
        accountId,
        currentQuotaGB,
        requestedQuotaGB,
        reason: reason || null,
      });

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'QUOTA_REQUEST_CREATED',
        resource: 'quota_request',
        details: { requestId: request.id, currentQuotaGB, requestedQuotaGB, reason },
      });

      res.status(201).json(request);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // List quota requests for an account
  app.get(api.quotaRequests.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) return res.status(403).json({ message: "Forbidden" });

    const requests = await storage.getQuotaRequests(accountId);
    res.json(requests);
  });

  // List all pending quota requests (admin)
  app.get(api.quotaRequests.listPending.path, requireAuth(), async (req: any, res) => {
    const requests = await storage.getAllPendingQuotaRequests();
    res.json(requests);
  });

  // Approve quota request
  app.post(api.quotaRequests.approve.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const requestId = parseInt(req.params.id);
      const { note } = req.body || {};

      const request = await storage.approveQuotaRequest(requestId, userId, note);

      await storage.createAuditLog({
        accountId: request.accountId!,
        userId,
        action: 'QUOTA_REQUEST_APPROVED',
        resource: 'quota_request',
        details: { requestId, newQuotaGB: request.requestedQuotaGB, note },
      });

      res.json(request);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  });

  // Reject quota request
  app.post(api.quotaRequests.reject.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const requestId = parseInt(req.params.id);
      const { note } = req.body || {};

      const request = await storage.rejectQuotaRequest(requestId, userId, note);

      await storage.createAuditLog({
        accountId: request.accountId!,
        userId,
        action: 'QUOTA_REQUEST_REJECTED',
        resource: 'quota_request',
        details: { requestId, note },
      });

      res.json(request);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  });


  // Delete account (Admin only)
  app.delete(api.accounts.delete.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.id);

      // Super admin check
      const user = await authStorage.getUser(userId);
      // Assuming role-based access control is handled by middleware or simpler check for now
      // Fix: 'isSuperAdmin' does not exist on type 'User'. 
      // User requested deletion from Admin Dashboard, implying they are admin.
      if (!user) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteAccount(accountId);

      // Audit log
      await storage.createAuditLog({
        accountId: 0, // System
        userId,
        action: 'ACCOUNT_DELETED',
        resource: 'account',
        details: { accountId },
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // === CUSTOMERS ROUTES ===

  // List customers
  app.get(api.customers.list.path, requireAuth(), async (req: any, res) => {
    try {
      appendFileSync('debug_log.txt', `[${new Date().toISOString()}] GET /api/customers hit\n`);
      const { userId } = getAuth(req);

      const memberships = await storage.getUserMemberships(userId);
      const validMembership = memberships.find(m => ['owner', 'admin'].includes(m.role));

      if (!validMembership) {
        return res.status(403).json({ message: "Forbidden: You must be an admin of at least one account." });
      }

      const accountId = validMembership.accountId;
      const customersList = await storage.listCustomers(accountId);
      res.json(customersList);
    } catch (err: any) {
      console.error("GET /api/customers error:", err);
      try {
        appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Error in GET /api/customers: ${err.message}\nStack: ${err.stack}\n`);
      } catch (e) {
        console.error("Failed to write to debug_log.txt", e);
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.customers.create.path, requireAuth(), async (req: any, res) => {
    try {
      appendFileSync('debug_log.txt', `[${new Date().toISOString()}] POST /api/customers hit. Body: ${JSON.stringify(req.body)}\n`);
      const { userId } = getAuth(req);

      // Find the first account where the user is an admin or owner
      const memberships = await storage.getUserMemberships(userId);
      const validMembership = memberships.find(m => ['owner', 'admin'].includes(m.role));

      if (!validMembership) {
        return res.status(403).json({ message: "Forbidden: You must be an admin of at least one account." });
      }

      const accountId = validMembership.accountId;

      // Validate input
      // Note: api.customers.create.input already validates the structural schema, 
      // but we need to handle the internal logic.
      const parsedData = api.customers.create.input.parse(req.body);

      // Create customer (storage handles bucket linking if bucketIds provided)
      const customer = await storage.createCustomer({
        ...parsedData,
        accountId,
      });

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'CUSTOMER_CREATED',
        resource: 'customer',
        details: { customerId: customer.id, name: customer.name, bucketIds: parsedData.bucketIds },
      });

      res.status(201).json(customer);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        console.log("ZOD VALIDATION ERROR:", JSON.stringify(err.errors, null, 2)); // Print to terminal
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      try {
        appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Error creating customer: ${err.message}\nStack: ${err.stack}\n`);
      } catch (e) {
        console.error("Failed to write to debug_log.txt", e);
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });



  // Delete customer
  app.delete(api.customers.delete.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const id = parseInt(req.params.id);

      // Basic audit
      // We could fetch the customer name first for better audit logs, but for speed just log ID.
      // Assuming storage.deleteCustomer handles unlink logic.
      await storage.deleteCustomer(id);

      await storage.createAuditLog({
        accountId: 0, // System or current account? Hard to get without fetching customer.
        // Actually we can get accountId from req user or pass 0.
        userId,
        action: 'CUSTOMER_DELETED',
        resource: 'customer',
        details: { customerId: id },
      });

      res.sendStatus(200);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // List orders for an account
  app.get(api.orders.list.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const accountOrders = await storage.getOrders(accountId);
    res.json(accountOrders);
  });

  // Create order
  app.post(api.orders.create.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);

      const membership = await storage.getMembership(userId, accountId);
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.orders.create.input.parse(req.body);
      const product = await storage.getProduct(input.productId);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

      const quantity = input.quantity || 1;
      const unitPrice = product.price;
      const discount = input.discount || 0;
      const totalAmount = (unitPrice * quantity) - discount;

      const order = await storage.createOrder({
        accountId,
        productId: input.productId,
        quantity,
        unitPrice,
        totalAmount,
        discount,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
      });

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'ORDER_CREATED',
        resource: 'order',
        details: { orderId: order.id, orderNumber: order.orderNumber, productName: product.name, totalAmount },
      });

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get single order
  app.get(api.orders.get.path, requireAuth(), async (req: any, res) => {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.accountId);
    const orderId = parseInt(req.params.orderId);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const order = await storage.getOrder(orderId);
    if (!order || order.accountId !== accountId) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  });

  // Update order
  app.patch(api.orders.update.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);
      const orderId = parseInt(req.params.orderId);

      const membership = await storage.getMembership(userId, accountId);
      if ((!membership || !['owner', 'admin'].includes(membership.role)) && !isSuperAdmin(req.currentUser?.email)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder || existingOrder.accountId !== accountId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const input = api.orders.update.input.parse(req.body);
      const order = await storage.updateOrder(orderId, {
        status: input.status,
        paymentStatus: input.paymentStatus,
        notes: input.notes,
        paidAt: input.paymentStatus === 'paid' ? new Date() : undefined,
      });

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'ORDER_UPDATED',
        resource: 'order',
        details: { orderId, changes: input },
      });

      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Cancel order
  app.post(api.orders.cancel.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);
      const orderId = parseInt(req.params.orderId);

      const membership = await storage.getMembership(userId, accountId);
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder || existingOrder.accountId !== accountId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const input = api.orders.cancel.input.parse(req.body || {});
      const order = await storage.cancelOrder(orderId, input.reason);

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'ORDER_CANCELED',
        resource: 'order',
        details: { orderId, orderNumber: order.orderNumber, reason: input.reason },
      });

      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin: List all orders (protected by isSuperAdmin)
  app.get(api.orders.listAll.path, requireAuth(), async (req: any, res) => {
    if (!isSuperAdmin(req.currentUser?.email)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  // Create VPS Order (new order type for VPS configuration)
  app.post(api.orders.createVps.path, requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);

      const membership = await storage.getMembership(userId, accountId);
      if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.orders.createVps.input.parse(req.body);

      // Create VPS order with configuration
      const result = await storage.createVpsOrder(
        accountId,
        input.vpsConfig,
        input.notes,
        input.paymentMethod
      );

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'VPS_ORDER_CREATED',
        resource: 'order',
        details: {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          vpsConfig: {
            os: input.vpsConfig.os,
            cpuCores: input.vpsConfig.cpuCores,
            ramGB: input.vpsConfig.ramGB,
            storageGB: input.vpsConfig.storageGB,
            location: input.vpsConfig.location,
          },
          estimatedPrice: result.order.totalAmount,
        },
      });

      // Create notification for admin
      await storage.createNotification({
        accountId,
        type: 'vps_order_pending',
        title: 'Nova Solicitação de VPS',
        message: `Novo pedido de VPS #${result.order.orderNumber} aguardando orçamento.`,
        metadata: { orderId: result.order.id },
      });

      res.status(201).json({
        success: true,
        order: result.order,
        message: 'Solicitação de VPS criada com sucesso. Aguarde o contato de nossa equipe.',
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create Backup Order (for backup cloud and backup vps)
  app.post('/api/accounts/:accountId/orders/backup', requireAuth(), async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      const accountId = parseInt(req.params.accountId);

      const membership = await storage.getMembership(userId, accountId);
      if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { type, ...config } = req.body;

      // Create backup order
      const order = await storage.createBackupOrder(accountId, type, config);

      await storage.createAuditLog({
        accountId,
        userId,
        action: 'BACKUP_ORDER_CREATED',
        resource: 'order',
        details: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type,
          config,
        },
      });

      // Create notification for admin
      await storage.createNotification({
        accountId,
        type: 'backup_order_pending',
        title: type === 'backup-cloud' ? 'Nova Solicitação de Backup Cloud' : 'Nova Solicitação de Backup VPS',
        message: `Novo pedido de backup #${order.orderNumber} aguardando orçamento.`,
        metadata: { orderId: order.id },
      });

      res.status(201).json({
        success: true,
        order,
        message: 'Solicitação de backup criada com sucesso. Aguarde o contato de nossa equipe.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Seed Data
  await seedDatabase();

  // SMTP Email Configuration Routes
  app.patch("/api/accounts/:id/email-config", requireAuth(), smtpRoutes.handleConfigureSMTP);
  app.post("/api/accounts/:id/email-test", requireAuth(), smtpRoutes.handleTestSMTP);

  return httpServer;
}

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    await storage.createProduct({
      name: "Starter",
      description: "Perfect for small teams",
      price: 2900, // $29.00
      storageLimit: 100,
      transferLimit: 500,
    });
    await storage.createProduct({
      name: "Pro",
      description: "For growing businesses",
      price: 9900, // $99.00
      storageLimit: 1000,
      transferLimit: 5000,
    });
    await storage.createProduct({
      name: "Enterprise",
      description: "Unlimited power",
      price: 49900, // $499.00
      storageLimit: 10000,
      transferLimit: 50000,
    });
  }
}
