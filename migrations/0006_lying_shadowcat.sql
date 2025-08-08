DROP TABLE "lead_activities" CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "routing_action" varchar(50);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "routing_message" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "routed_at" timestamp;