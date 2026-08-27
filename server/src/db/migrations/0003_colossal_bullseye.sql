ALTER TABLE "child_invitations" DROP CONSTRAINT "child_invitations_used_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_activity_types_id_fk";
--> statement-breakpoint
ALTER TABLE "wishes" DROP CONSTRAINT "wishes_fulfilled_for_child_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_types" ADD COLUMN "value" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_types" ADD COLUMN "direction" varchar(10) DEFAULT 'plus' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_types" ADD COLUMN "created_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_types" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "child_invitations" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "wish_id" integer;--> statement-breakpoint
ALTER TABLE "wishes" ADD COLUMN "is_self_fulfillment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wishes" ADD COLUMN "multiplier" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wish_id_wishes_id_fk" FOREIGN KEY ("wish_id") REFERENCES "public"."wishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_types" DROP COLUMN "default_stars";--> statement-breakpoint
ALTER TABLE "child_invitations" DROP COLUMN "used_by";--> statement-breakpoint
ALTER TABLE "child_invitations" DROP COLUMN "used_at";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "wishes" DROP COLUMN "fulfilled_at";--> statement-breakpoint
ALTER TABLE "wishes" DROP COLUMN "fulfilled_for_child_id";