CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"industry" varchar(100),
	"employee_count" integer,
	"revenue" numeric(15, 2),
	"location" text,
	"enrichment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_enriched_at" timestamp,
	"enrichment_version" integer DEFAULT 1,
	"enriched_data" jsonb,
	"data_cached_until" timestamp,
	"enrichment_cost" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "enrichment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"company_id" uuid,
	"provider" varchar(50) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"request_data" jsonb,
	"response_data" jsonb,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"tokens_used" integer,
	"cost" numeric(10, 6),
	"currency" varchar(3) DEFAULT 'USD',
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"contact_name" text NOT NULL,
	"company_email" text NOT NULL,
	"contact_phone" text,
	"company_website" text NOT NULL,
	"country" text NOT NULL,
	"company_size" text NOT NULL,
	"product_interest" text NOT NULL,
	"how_can_we_help" text NOT NULL,
	"privacy_policy" boolean DEFAULT false,
	"mock_behavioral_data" boolean DEFAULT false,
	"behavioral_data" jsonb,
	"lead_score" integer,
	"firmographic_score" integer,
	"behavioral_score" integer,
	"intent_score" integer,
	"technographic_score" integer,
	"classification" varchar(20),
	"classification_confidence" numeric(5, 2),
	"intent_analysis" jsonb,
	"enrichment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"routing_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"enriched_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "enrichment_logs" ADD CONSTRAINT "enrichment_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_logs" ADD CONSTRAINT "enrichment_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_domain_idx" ON "companies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "companies_industry_idx" ON "companies" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "companies_enrichment_status_idx" ON "companies" USING btree ("enrichment_status");--> statement-breakpoint
CREATE INDEX "enrichment_logs_lead_id_idx" ON "enrichment_logs" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "enrichment_logs_company_id_idx" ON "enrichment_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "enrichment_logs_provider_idx" ON "enrichment_logs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "enrichment_logs_status_idx" ON "enrichment_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enrichment_logs_created_at_idx" ON "enrichment_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_company_id_idx" ON "leads" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("company_email");--> statement-breakpoint
CREATE INDEX "leads_score_idx" ON "leads" USING btree ("lead_score");--> statement-breakpoint
CREATE INDEX "leads_classification_idx" ON "leads" USING btree ("classification");--> statement-breakpoint
CREATE INDEX "leads_enrichment_status_idx" ON "leads" USING btree ("enrichment_status");--> statement-breakpoint
CREATE INDEX "leads_routing_status_idx" ON "leads" USING btree ("routing_status");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");