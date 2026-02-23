import { pgEnum,text, uuid} from "drizzle-orm/pg-core";
import { createTable, id, thisProjectAuditMeta, thisProjectTimestamps } from "../utils";
import {user} from '@/lib/db/schemas'

/**
 * 
 * RBAC Schemas
 * 
 */

export const permissionEnum=pgEnum('permission_enum',[
'CREATE',
'DELETE',
'UPDATE',
'ACCESS',
'READ'
]);

export const pageEnum=pgEnum('admin_page_enum',[
   'HOME_PAGE',
   'USERS',
   'ROLES',
   'ROLE_GROUPS',
   'USER_ROLES',
   'USER_ROLE_GROUPS',
   'LOGO',
   'POST',
   'PROJECT',
]);


export const roleTable = createTable("role_table", {
    id,
    name:text().notNull().unique(),
    description:text().notNull(),
    permissions:permissionEnum('permissionEnum').array().notNull(),
    page:pageEnum('page').notNull(),
    ...thisProjectTimestamps,
    ...thisProjectAuditMeta,
});

export const roleGroupTable = createTable("role_group_table", {
    id,
    name:text().notNull().unique(),
    description:text().notNull(),
    ...thisProjectTimestamps,
    ...thisProjectAuditMeta,
});

export const roleGroupRoleTable = createTable("role_group_role_table", {
    id,
    roleGroupId: uuid('role_group_id')
    .notNull()
    .references(() => roleGroupTable.id, { onDelete: "cascade" }),
    roleId: uuid('role_id')
    .notNull()
    .references(() => roleTable.id, { onDelete: "cascade" }),
});


export const userRoleTable = createTable("user_role_table", {
    id,
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
    roleId: uuid('role_id')
    .notNull()
    .references(() => roleTable.id, { onDelete: "cascade" }),
    ...thisProjectTimestamps,
    ...thisProjectAuditMeta,
});


export const userRoleGroupTable = createTable("user_role_group_table", {
    id,
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
    roleGroupId: uuid('role_group_id')
    .notNull()
    .references(() => roleGroupTable.id, { onDelete: "cascade" }),
    ...thisProjectTimestamps,
    ...thisProjectAuditMeta,
});