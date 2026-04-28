CREATE TYPE "public"."rate_type" AS ENUM('ral_annual', 'daily', 'hourly');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('professional', 'company');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"company_name" text,
	"vat_number" text,
	"vat_verified_at" timestamp,
	"logo_url" text,
	"city" text,
	"industry" text,
	"description" text,
	"website_url" text
);
--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"photo_url" text,
	"city" text,
	"remote_ok" boolean DEFAULT false,
	"years_experience" integer,
	"rate_type" "rate_type",
	"rate_amount_eur" integer,
	"bio_short" text,
	"bio_long" text,
	"top_skills" text[],
	"secondary_skills" text[],
	"clusters" text[],
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" "role",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;