import { text, boolean, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/lib/db/utils";
import { user } from "./accounts";
import { file } from "./file";
import { gallery } from "./post";

export const projectCategory = createTable("project_category", {
  id,
  name: text("name").notNull(),
  description: text("description").notNull(),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
})

export const project = createTable("project", {
  id,
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => projectCategory.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const projectImages = createTable("project_images", {
  id,
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const projectGallery = createTable("project_gallery", {
  id,
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  galleryId: uuid("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true), // Projenin aktif olup olmadığını belirtir. Örneğin: true
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});


export const projectDiscussions = createTable("project_discussions", {
  id,
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  username: text("username").notNull(),
  message: text("message").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(false), // Admin onayı; true ise sitede gösterilir
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});