CREATE TABLE "sales_form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" text NOT NULL,
	"company_email" text NOT NULL,
	"contact_phone" text,
	"company_website" text NOT NULL,
	"country" text NOT NULL,
	"company_size" text NOT NULL,
	"product_interest" text NOT NULL,
	"how_can_we_help" text NOT NULL,
	"privacy_policy" boolean DEFAULT false,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
