ALTER TABLE "users" ADD COLUMN "verify_email_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verify_email_expires" timestamp;