CREATE TYPE "public"."footer_social_platform" AS ENUM('INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'FACEBOOK', 'X', 'GITHUB', 'WHATSAPP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."site_nav_placement" AS ENUM('HEADER', 'FOOTER');--> statement-breakpoint
CREATE TYPE "public"."social_icon_type" AS ENUM('ICON', 'IMAGE');--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'HEADER_NAV' BEFORE 'ABOUT';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'FOOTER_NAV' BEFORE 'ABOUT';--> statement-breakpoint
CREATE TABLE "footer_social_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "footer_social_platform" NOT NULL,
	"custom_label" text,
	"url" text NOT NULL,
	"type" "social_icon_type" DEFAULT 'ICON' NOT NULL,
	"icon_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "site_nav_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" "site_nav_placement" NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "header_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sticky_header_enabled" boolean DEFAULT false NOT NULL,
	"scroll_progress_bar_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "footer_social_link" ADD CONSTRAINT "footer_social_link_icon_file_id_files_id_fk" FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_social_link" ADD CONSTRAINT "footer_social_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_social_link" ADD CONSTRAINT "footer_social_link_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "footer_social_link" ADD CONSTRAINT "footer_social_link_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_nav_link" ADD CONSTRAINT "site_nav_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_nav_link" ADD CONSTRAINT "site_nav_link_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_nav_link" ADD CONSTRAINT "site_nav_link_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_footer_social_platform_active" ON "footer_social_link" USING btree ("platform",coalesce("custom_label", '')) WHERE "footer_social_link"."is_active" = true AND "footer_social_link"."deleted_at" IS NULL;