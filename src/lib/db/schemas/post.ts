import { text, boolean, uuid, integer } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/lib/db/utils";
import { user } from "./accounts";
import { file } from "./file";

export const postCategory = createTable("post_category", {
  id,
  name: text("name").notNull(),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const post = createTable("post", {
  id,
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }), // Gönderinin Kapak görselinin ID'si
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false), // Gönderinin yayınlanıp yayınlanmadığını belirtir. Örneğin: true
  categoryId: uuid("category_id")
    .notNull()
    .references(() => postCategory.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const postImages = createTable("post_images", {
  id,
  postId: uuid("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const gallery = createTable("gallery", {
  id,
  name: text("name").notNull(),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const galleryImages = createTable("gallery_images", {
  id,
  galleryId: uuid("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
  imageId: uuid("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const postGallery = createTable("post_gallery", {
  id,
  postId: uuid("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  galleryId: uuid("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true), // Gönderinin aktif olup olmadığını belirtir. Örneğin: true
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});