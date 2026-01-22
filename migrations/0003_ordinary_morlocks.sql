CREATE TABLE "pricing_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"resource_key" text NOT NULL,
	"resource_label" text NOT NULL,
	"price_cents" integer NOT NULL,
	"unit" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"min_value" integer DEFAULT 1,
	"max_value" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"pricing_config_id" integer,
	"old_price_cents" integer,
	"new_price_cents" integer,
	"changed_by" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pricing_history" ADD CONSTRAINT "pricing_history_pricing_config_id_pricing_configs_id_fk" FOREIGN KEY ("pricing_config_id") REFERENCES "public"."pricing_configs"("id") ON DELETE no action ON UPDATE no action;