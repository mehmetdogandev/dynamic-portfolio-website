import { pgEnum,text} from "drizzle-orm/pg-core";
import { createTable,id,thisProjectAuditMeta,thisProjectTimestamps } from "../utils";
import {user} from '@/lib/db/schemas'

export const userRoleEnum=pgEnum('user_role_enum',
[
"USER",
"ADMIN",
"WRITTER",

],

);


export const userRole=createTable('user_role',
   {
    id,
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...thisProjectTimestamps,
  ...thisProjectAuditMeta,
   }
);