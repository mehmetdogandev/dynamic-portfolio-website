import { pgEnum, text, uuid } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/lib/db/utils";
import { file } from "./file";
  
export const logoStatusEnum = pgEnum("logoStatusEnum", [
  "ACTIVE",
  "PASSIVE",
]);

/*
 * This table is website active and passive logo
 */
export const logo = createTable("logo", {
  id,
  name: text("name").notNull(),
  fileId: uuid("file_id").references(() => file.id),
  status: logoStatusEnum("status")
    .notNull()
    .default("ACTIVE"),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});
