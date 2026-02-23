import { text, boolean } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/lib/db/utils";
import { user } from "./accounts";
import { file } from "./file";

export const post = createTable("post", {
  id,
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  imageId: text("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }), // Gönderinin Kapak görselinin ID'si
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false), // Gönderinin yayınlanıp yayınlanmadığını belirtir. Örneğin: true
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const postImages = createTable("post_images", {
  id,
  postId: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  imageId: text("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});

export const postGallery = createTable("post_gallery", {
  id,
  postId: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  galleryId: text("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
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
  galleryId: text("gallery_id")
    .notNull()
    .references(() => gallery.id, { onDelete: "cascade" }),
  imageId: text("image_id")
    .notNull()
    .references(() => file.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});
