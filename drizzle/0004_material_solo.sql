ALTER TYPE "public"."admin_page_enum" ADD VALUE 'PROJECT_CATEGORY' BEFORE 'PROJECT';--> statement-breakpoint
CREATE TABLE "project_discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"username" text NOT NULL,
	"message" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_unique" UNIQUE("slug");