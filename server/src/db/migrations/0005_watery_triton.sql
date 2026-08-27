ALTER TABLE "wishes" ADD COLUMN "webhook_url" text;--> statement-breakpoint
ALTER TABLE "wishes" ADD COLUMN "webhook_secret" varchar(255);--> statement-breakpoint
ALTER TABLE "wishes" ADD COLUMN "webhook_param_name" varchar(100);