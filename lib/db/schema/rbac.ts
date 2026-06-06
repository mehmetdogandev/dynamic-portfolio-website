import { pgEnum, pgTable, text, uuid, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { id, timestamps, auditMeta } from '../utils'
import { z } from 'zod/v4'
import { user } from './auth'

export const permissionEnum = pgEnum('permission', [
  'CREATE', // Permission to create new records
  'READ', // Permission to read/view records
  'ACCESS', // Permission to access pages
  'UPDATE', // Permission to update/modify records
  'DELETE', // Permission to delete records
  'EXPORT', // Permission to export data
  'IMPORT', // Permission to import data
  'APPROVE', // Permission to approve requests
  'REJECT', // Permission to reject requests
  'ARCHIVE', // Permission to archive records
])

export const scopesEnum = pgEnum('scope', [
  'USER',
  'ROLE',
  'ROLE_GROUP',
  'MAIL',
  'MAIL_LOG',
  'JOB',
  'REFERENCE',
  'MEDIA',
  'MEDIA_GROUP',
  'BLOG',
  'BLOG_TYPE',
  'SLIDER',
  'SOLUTION_TECHNOLOGY',
  'SOLUTION_GROUP',
  'SOLUTION',
  'SITE_SEO',
  'HEADER_NAV',
  'FOOTER_NAV',
  'ABOUT',
  'JAPON_CUSTOMER',
  'JAPON_SERVICE',
  'JAPON_FORMEN',
  'JAPON_OTO_OPERATIONS',
  'JAPON_OTO_CUSTOMER',
  'JAPON_OTO_CAR',
  'JAPON_OTO_SERVICE',
  'JAPON_OTO_FORMEN',
  'RADIO_MOBILE_ANDROID_RELEASE',
  'RADIO_MOBILE_ANDROID_DEBUG',
  'RADIO_MOBILE_IOS_RELEASE',
  'RADIO_MOBILE_IOS_DEBUG',
  'RADIO_MOBILE_API_KEY',
])

// Role Groups (Titles) to manage multiple roles easier
export const roleGroup = pgTable(
  'role_group',
  {
    id,
    title: text('title').notNull(),
    description: text('description'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: Role group title must be unique only for non-deleted role groups
    uniqueIndex('unique_role_group_title')
      .on(table.title)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

export const role = pgTable(
  'role',
  {
    id,
    name: text('name').notNull(),
    scope: scopesEnum('scope').notNull(),
    permissions: permissionEnum('permissions').array().notNull(),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: Role name must be unique within the same scope for non-deleted roles
    uniqueIndex('unique_role_name')
      .on(table.name, table.scope)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

// User assignment to role groups instead of individual roles
export const userRoleGroup = pgTable(
  'user_role_group',
  {
    id,
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleGroupId: uuid('role_group_id')
      .notNull()
      .references(() => roleGroup.id, { onDelete: 'cascade' }),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: User-role group assignment must be unique only for non-deleted records
    uniqueIndex('unique_user_role_group')
      .on(table.userId, table.roleGroupId)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

// Many-to-many relationship between role groups and roles
export const roleGroupRole = pgTable(
  'role_group_role',
  {
    id,
    roleGroupId: uuid('role_group_id')
      .notNull()
      .references(() => roleGroup.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: Role group-role relationship must be unique only for non-deleted records
    uniqueIndex('unique_role_group_role')
      .on(table.roleGroupId, table.roleId)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

// Keep legacy userRole table for backward compatibility during migration
export const userRole = pgTable(
  'user_role',
  {
    id,
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: User-role assignment must be unique only for non-deleted records
    uniqueIndex('unique_user_role')
      .on(table.userId, table.roleId)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

export const PERMISSIONS = z.enum(permissionEnum.enumValues).enum
export const SCOPES_ZOD = z.enum(scopesEnum.enumValues)
export const SCOPES = SCOPES_ZOD.enum
export type Permission = typeof PERMISSIONS
export type Scope = typeof SCOPES

/** Single source for scope string literals (DB enum). */
export type ScopeLiteral = (typeof scopesEnum.enumValues)[number]

/** ACCESS gate per scope for navigation / route helpers. */
export type NavigationAccessByScope = Record<ScopeLiteral, boolean>

export const RoleSelect = role.$inferSelect
export const RoleGroupSelect = roleGroup.$inferSelect
export const UserRoleSelect = userRole.$inferSelect
export const UserRoleGroupSelect = userRoleGroup.$inferSelect
export const RoleGroupRoleSelect = roleGroupRole.$inferSelect

export type RoleInsert = typeof role.$inferInsert
export type RoleGroupInsert = typeof roleGroup.$inferInsert
export type UserRoleInsert = typeof userRole.$inferInsert
export type UserRoleGroupInsert = typeof userRoleGroup.$inferInsert
export type RoleGroupRoleInsert = typeof roleGroupRole.$inferInsert

export type Role = typeof RoleSelect
export type RoleGroup = typeof RoleGroupSelect
export type UserRole = typeof UserRoleSelect
export type UserRoleGroup = typeof UserRoleGroupSelect
export type RoleGroupRole = typeof RoleGroupRoleSelect
