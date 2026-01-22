CREATE TABLE "vps_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"os" text NOT NULL,
	"os_version" text,
	"location" text NOT NULL,
	"location_code" text,
	"cpu_cores" integer DEFAULT 1 NOT NULL,
	"ram_gb" integer DEFAULT 1 NOT NULL,
	"storage_gb" integer DEFAULT 25 NOT NULL,
	"storage_type" text DEFAULT 'ssd',
	"bandwidth" text DEFAULT '50',
	"bandwidth_unlimited" boolean DEFAULT false,
	"has_public_ip" boolean DEFAULT false,
	"public_ip_count" integer DEFAULT 0,
	"has_backup" boolean DEFAULT false,
	"backup_frequency" text,
	"backup_retention" integer,
	"internal_networks" integer DEFAULT 0,
	"base_price_cents" integer DEFAULT 0,
	"ip_price_cents" integer DEFAULT 0,
	"backup_price_cents" integer DEFAULT 0,
	"network_price_cents" integer DEFAULT 0,
	"server_ip" text,
	"server_hostname" text,
	"access_credentials" jsonb,
	"provisioned_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vps_configs_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" text DEFAULT 'product';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "vps_configs" ADD CONSTRAINT "vps_configs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;