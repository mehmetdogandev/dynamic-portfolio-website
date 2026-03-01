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

export const logoTypeEnum = pgEnum("logoTypeEnum", [
  "WEBSITE_LOGO",
  "WEBSITE_FAVICON",
  "EMAIL_LOGO",
  "EMAIL_FAVICON",
]);

/*
 * This table is website active and passive logo
 */
export const logo = createTable("logo", {
  id,
  name: text("name").notNull(),
  fileId: uuid("file_id").references(() => file.id),
  type: logoTypeEnum("type")
    .notNull()
    .default("WEBSITE_LOGO"),
  status: logoStatusEnum("status")
    .notNull()
    .default("ACTIVE"),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});
