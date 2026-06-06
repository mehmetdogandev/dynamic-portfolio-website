CREATE TYPE "public"."radio_mobile_channel" AS ENUM('android_release', 'android_debug', 'ios_release', 'ios_debug');--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'RADIO_MOBILE_ANDROID_RELEASE';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'RADIO_MOBILE_ANDROID_DEBUG';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'RADIO_MOBILE_IOS_RELEASE';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'RADIO_MOBILE_IOS_DEBUG';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'RADIO_MOBILE_API_KEY';--> statement-breakpoint
CREATE TABLE "radio_mobile_channel_config" (
	"channel" "radio_mobile_channel" PRIMARY KEY NOT NULL,
	"is_public_page" boolean DEFAULT false NOT NULL,
	"public_url_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "radio_mobile_build" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "radio_mobile_channel" NOT NULL,
	"version_major" integer NOT NULL,
	"version_patch" integer NOT NULL,
	"version_name" text NOT NULL,
	"version_code" integer NOT NULL,
	"display_name" text NOT NULL,
	"file_id" uuid NOT NULL,
	"size_bytes" bigint NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_stable" boolean DEFAULT false NOT NULL,
	"is_public_on_site" boolean DEFAULT false NOT NULL,
	"react_native_version" text,
	"min_sdk" integer,
	"target_sdk" integer,
	"build_toolchain" text,
	"notes" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "radio_mobile_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"can_android_release" boolean DEFAULT false NOT NULL,
	"can_android_debug" boolean DEFAULT false NOT NULL,
	"can_ios_release" boolean DEFAULT false NOT NULL,
	"can_ios_debug" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
ALTER TABLE "radio_mobile_channel_config" ADD CONSTRAINT "radio_mobile_channel_config_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_channel_config" ADD CONSTRAINT "radio_mobile_channel_config_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_channel_config" ADD CONSTRAINT "radio_mobile_channel_config_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_build" ADD CONSTRAINT "radio_mobile_build_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_build" ADD CONSTRAINT "radio_mobile_build_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_build" ADD CONSTRAINT "radio_mobile_build_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_build" ADD CONSTRAINT "radio_mobile_build_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_api_key" ADD CONSTRAINT "radio_mobile_api_key_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_api_key" ADD CONSTRAINT "radio_mobile_api_key_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radio_mobile_api_key" ADD CONSTRAINT "radio_mobile_api_key_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_radio_mobile_build_version" ON "radio_mobile_build" USING btree ("channel","version_major","version_patch") WHERE "radio_mobile_build"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_radio_mobile_build_version_code" ON "radio_mobile_build" USING btree ("channel","version_code") WHERE "radio_mobile_build"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_radio_mobile_api_key_hash" ON "radio_mobile_api_key" USING btree ("key_hash") WHERE "radio_mobile_api_key"."deleted_at" IS NULL;