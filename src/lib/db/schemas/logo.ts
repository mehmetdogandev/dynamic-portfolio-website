import { pgEnum, text } from "drizzle-orm/pg-core";
import {
  createTable,
  id,
  thisProjectTimestamps,
  thisProjectAuditMeta,
} from "@/lib/db/utils";

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
  path: text("path").notNull(),

  status: logoStatusEnum("status")
    .notNull()
    .default("ACTIVE"),

  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
});
