import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/server/db/utils";
import { user } from "./authentication";

export const posts = createTable("post", {
  id,
  name: text("name").notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});
