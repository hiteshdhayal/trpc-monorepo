ALTER TABLE "users" ADD COLUMN "reset_password_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires" timestamp;