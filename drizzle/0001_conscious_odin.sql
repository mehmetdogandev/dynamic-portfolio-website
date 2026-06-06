ALTER TYPE "public"."scope" ADD VALUE 'JAPON_CUSTOMER';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_SERVICE';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_FORMEN';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_OTO_OPERATIONS';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_OTO_CUSTOMER';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_OTO_CAR';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_OTO_SERVICE';--> statement-breakpoint
ALTER TYPE "public"."scope" ADD VALUE 'JAPON_OTO_FORMEN';--> statement-breakpoint
CREATE TABLE "japon_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_no" text NOT NULL,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"address" text,
	"phone" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"plate" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"color" text NOT NULL,
	"km" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_car_ownership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_formen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"surname" text,
	"phone" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_job_id" uuid NOT NULL,
	"brand" text,
	"part_no" text,
	"part_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_service_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"formen_id" uuid,
	"km_at_visit" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"service_fee" numeric(12, 2),
	"started_at" timestamp,
	"completed_at" timestamp,
	"customer_name_snapshot" text,
	"customer_surname_snapshot" text,
	"customer_no_snapshot" text,
	"car_plate_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" text,
	"last_updated_by" text,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "japon_service_job_services" (
	"service_job_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	CONSTRAINT "japon_service_job_services_service_job_id_service_id_pk" PRIMARY KEY("service_job_id","service_id")
);
--> statement-breakpoint
ALTER TABLE "japon_customers" ADD CONSTRAINT "japon_customers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_customers" ADD CONSTRAINT "japon_customers_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_customers" ADD CONSTRAINT "japon_customers_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_cars" ADD CONSTRAINT "japon_cars_customer_id_japon_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."japon_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_cars" ADD CONSTRAINT "japon_cars_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_cars" ADD CONSTRAINT "japon_cars_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_cars" ADD CONSTRAINT "japon_cars_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_car_ownership" ADD CONSTRAINT "japon_car_ownership_car_id_japon_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."japon_cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_car_ownership" ADD CONSTRAINT "japon_car_ownership_customer_id_japon_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."japon_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_car_ownership" ADD CONSTRAINT "japon_car_ownership_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_car_ownership" ADD CONSTRAINT "japon_car_ownership_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_car_ownership" ADD CONSTRAINT "japon_car_ownership_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_formen" ADD CONSTRAINT "japon_formen_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_formen" ADD CONSTRAINT "japon_formen_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_formen" ADD CONSTRAINT "japon_formen_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_services" ADD CONSTRAINT "japon_services_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_services" ADD CONSTRAINT "japon_services_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_services" ADD CONSTRAINT "japon_services_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_parts" ADD CONSTRAINT "japon_parts_service_job_id_japon_service_jobs_id_fk" FOREIGN KEY ("service_job_id") REFERENCES "public"."japon_service_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_parts" ADD CONSTRAINT "japon_parts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_parts" ADD CONSTRAINT "japon_parts_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_parts" ADD CONSTRAINT "japon_parts_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_customer_id_japon_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."japon_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_car_id_japon_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."japon_cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_formen_id_japon_formen_id_fk" FOREIGN KEY ("formen_id") REFERENCES "public"."japon_formen"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_jobs" ADD CONSTRAINT "japon_service_jobs_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_job_services" ADD CONSTRAINT "japon_service_job_services_service_job_id_japon_service_jobs_id_fk" FOREIGN KEY ("service_job_id") REFERENCES "public"."japon_service_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "japon_service_job_services" ADD CONSTRAINT "japon_service_job_services_service_id_japon_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."japon_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_japon_customer_no_active" ON "japon_customers" USING btree ("customer_no") WHERE "japon_customers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_japon_car_plate_active" ON "japon_cars" USING btree ("plate") WHERE "japon_cars"."deleted_at" IS NULL;