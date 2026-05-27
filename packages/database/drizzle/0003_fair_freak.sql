ALTER TABLE "users" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" varchar(50);--> statement-breakpoint
CREATE INDEX "responses_form_id_idx" ON "responses" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "responses_completed_idx" ON "responses" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "responses_form_completed_idx" ON "responses" USING btree ("form_id","completed");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_email_per_form_completed" ON "responses" USING btree ("form_id","respondent_email") WHERE completed = true;