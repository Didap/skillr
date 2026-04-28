CREATE TYPE "public"."match_status" AS ENUM('pending', 'liked', 'passed');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" text PRIMARY KEY NOT NULL,
	"professional_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"time_slot" text NOT NULL,
	"is_booked" boolean DEFAULT false,
	"booked_by_company_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"skills" text[],
	"budget_min_eur" integer,
	"budget_max_eur" integer,
	"rate_type" "rate_type",
	"location" text,
	"remote_ok" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"professional_id" text NOT NULL,
	"company_id" text NOT NULL,
	"job_id" text,
	"professional_status" "match_status" DEFAULT 'pending',
	"company_status" "match_status" DEFAULT 'pending',
	"matched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_professional_id_user_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_booked_by_company_id_user_id_fk" FOREIGN KEY ("booked_by_company_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_user_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_professional_id_user_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_company_id_user_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "company_profiles" DROP COLUMN "industry";--> statement-breakpoint
ALTER TABLE "company_profiles" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "company_profiles" DROP COLUMN "website_url";