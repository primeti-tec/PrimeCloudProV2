ALTER TABLE "audit_logs" ADD COLUMN "severity" text DEFAULT 'info';--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "context" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;