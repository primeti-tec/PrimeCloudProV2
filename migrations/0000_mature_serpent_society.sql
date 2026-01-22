CREATE TABLE "access_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"name" text NOT NULL,
	"access_key_id" text NOT NULL,
	"secret_access_key" text NOT NULL,
	"permissions" text DEFAULT 'read-write',
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "access_keys_access_key_id_unique" UNIQUE("access_key_id")
);
--> statement-breakpoint
CREATE TABLE "account_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"user_id" varchar,
	"role" text DEFAULT 'developer' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"owner_id" varchar,
	"status" text DEFAULT 'active',
	"document" text,
	"document_type" text,
	"phone" text,
	"storage_used" bigint DEFAULT 0,
	"bandwidth_used" bigint DEFAULT 0,
	"storage_quota_gb" integer DEFAULT 100,
	"branding_name" text,
	"branding_logo" text,
	"branding_favicon" text,
	"branding_primary_color" text,
	"branding_sidebar_color" text,
	"custom_domain" text,
	"domain_status" text DEFAULT 'pending',
	"dns_verification_token" text,
	"smtp_enabled" boolean DEFAULT false,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_user" text,
	"smtp_pass" text,
	"smtp_from_email" text,
	"smtp_from_name" text,
	"smtp_encryption" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"user_id" varchar,
	"action" text NOT NULL,
	"resource" text,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bucket_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_member_id" integer NOT NULL,
	"bucket_id" integer NOT NULL,
	"permission" text DEFAULT 'read' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"name" text NOT NULL,
	"region" text DEFAULT 'us-east-1',
	"is_public" boolean DEFAULT false,
	"object_count" integer DEFAULT 0,
	"size_bytes" bigint DEFAULT 0,
	"storage_limit_gb" integer DEFAULT 50,
	"versioning_enabled" boolean DEFAULT false,
	"lifecycle_rules" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"email" text NOT NULL,
	"role" text DEFAULT 'developer' NOT NULL,
	"token" text NOT NULL,
	"invited_by" varchar,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"invoice_number" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"storage_gb" integer DEFAULT 0,
	"storage_cost" integer DEFAULT 0,
	"bandwidth_gb" integer DEFAULT 0,
	"bandwidth_cost" integer DEFAULT 0,
	"subtotal" integer DEFAULT 0,
	"tax_amount" integer DEFAULT 0,
	"total_amount" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"due_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"payment_method" text,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"product_id" integer,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending',
	"quantity" integer DEFAULT 1,
	"unit_price" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"discount" integer DEFAULT 0,
	"notes" text,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending',
	"paid_at" timestamp,
	"canceled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"price_per_storage_gb" integer DEFAULT 15,
	"price_per_transfer_gb" integer DEFAULT 40,
	"storage_limit_gb" integer NOT NULL,
	"transfer_limit_gb" integer,
	"is_public" boolean DEFAULT true,
	"features" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "quota_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"current_quota_gb" integer NOT NULL,
	"requested_quota_gb" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending',
	"reviewed_by_id" varchar,
	"review_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sftp_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"status" text DEFAULT 'active',
	"last_login_at" timestamp,
	"last_login_ip" text,
	"login_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sftp_credentials_account_id_unique" UNIQUE("account_id"),
	CONSTRAINT "sftp_credentials_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"product_id" integer,
	"status" text DEFAULT 'active',
	"current_period_start" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"storage_bytes" bigint DEFAULT 0,
	"bandwidth_ingress" bigint DEFAULT 0,
	"bandwidth_egress" bigint DEFAULT 0,
	"requests_count" integer DEFAULT 0,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_permissions" ADD CONSTRAINT "bucket_permissions_account_member_id_account_members_id_fk" FOREIGN KEY ("account_member_id") REFERENCES "public"."account_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_permissions" ADD CONSTRAINT "bucket_permissions_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_requests" ADD CONSTRAINT "quota_requests_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_requests" ADD CONSTRAINT "quota_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sftp_credentials" ADD CONSTRAINT "sftp_credentials_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");