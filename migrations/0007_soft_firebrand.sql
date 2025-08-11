CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"level" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "logs_session_id_idx" ON "logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "logs_level_idx" ON "logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "logs_timestamp_idx" ON "logs" USING btree ("timestamp");