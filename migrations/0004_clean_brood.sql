DO $$ BEGIN
 CREATE TYPE "public"."enrichment_status" AS ENUM('pending', 'enriching', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."routing_status" AS ENUM('pending', 'routed', 'notified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "enrichment_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "enrichment_status" SET DATA TYPE "public"."enrichment_status" USING "enrichment_status"::text::"public"."enrichment_status";--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "enrichment_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "enrichment_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "enrichment_status" SET DATA TYPE "public"."enrichment_status" USING "enrichment_status"::text::"public"."enrichment_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "enrichment_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "routing_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "routing_status" SET DATA TYPE "public"."routing_status" USING "routing_status"::text::"public"."routing_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "routing_status" SET DEFAULT 'pending';