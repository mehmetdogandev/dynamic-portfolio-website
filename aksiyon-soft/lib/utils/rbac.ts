import {
  role,
  roleGroupRole,
  userRole,
  userRoleGroup,
  user,
  scopesEnum,
  type NavigationAccessByScope,
} from '../db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { AuthUser } from '../auth'
import { getDbConnection } from '../db'
import { SCOPES, PERMISSIONS } from '../db/schema'

if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

export const getAuthDb = () => getDbConnection()

export const ensureUserId = async (userId: AuthUser['id']) => {
  if (!userId) throw new Error('User ID is required')

  const db = getAuthDb()
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!existingUser.length) throw new Error('User not found')
  return userId
}

export const ensureUserIdForWorkingYear = async (userId: AuthUser['id']) =>
  ensureUserId(userId)

/** One DB round-trip for all scopes’ ACCESS flags (navigation / route gates). */
export const getNavigationAccessForUser = async (
  userId: AuthUser['id']
): Promise<NavigationAccessByScope> => {
  'use server'
  const allFalse = Object.fromEntries(
    scopesEnum.enumValues.map((s) => [s, false])
  ) as NavigationAccessByScope

  try {
    const normalizedUserId = await ensureUserId(userId)
    const authDb = getAuthDb()

    const [directRoles, groupRoles] = await Promise.all([
      authDb
        .select({ roleScope: role.scope, rolePermissions: role.permissions })
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .where(
          and(
            eq(userRole.userId, normalizedUserId),
            isNull(role.deletedAt),
            isNull(userRole.deletedAt)
          )
        ),
      authDb
        .select({ roleScope: role.scope, rolePermissions: role.permissions })
        .from(userRoleGroup)
        .innerJoin(
          roleGroupRole,
          eq(userRoleGroup.roleGroupId, roleGroupRole.roleGroupId)
        )
        .innerJoin(role, eq(roleGroupRole.roleId, role.id))
        .where(
          and(
            eq(userRoleGroup.userId, normalizedUserId),
            isNull(role.deletedAt),
            isNull(userRoleGroup.deletedAt),
            isNull(roleGroupRole.deletedAt)
          )
        ),
    ])

    const allUserRoles = [...directRoles, ...groupRoles]
    const access = PERMISSIONS.ACCESS

    return scopesEnum.enumValues.reduce((acc, scope) => {
      acc[scope] = allUserRoles.some(
        (row) => row.roleScope === scope && row.rolePermissions.includes(access)
      )
      return acc
    }, {} as NavigationAccessByScope)
  } catch {
    return allFalse
  }
}

export const can = async (
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
): Promise<boolean> => {
  'use server'
  try {
    const normalizedUserId = await ensureUserId(userId)
    const authDb = getAuthDb()

    const [directRoles, groupRoles] = await Promise.all([
      authDb
        .select({ roleScope: role.scope, rolePermissions: role.permissions })
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .where(
          and(
            eq(userRole.userId, normalizedUserId),
            isNull(role.deletedAt),
            isNull(userRole.deletedAt)
          )
        ),
      authDb
        .select({ roleScope: role.scope, rolePermissions: role.permissions })
        .from(userRoleGroup)
        .innerJoin(
          roleGroupRole,
          eq(userRoleGroup.roleGroupId, roleGroupRole.roleGroupId)
        )
        .innerJoin(role, eq(roleGroupRole.roleId, role.id))
        .where(
          and(
            eq(userRoleGroup.userId, normalizedUserId),
            isNull(role.deletedAt),
            isNull(userRoleGroup.deletedAt),
            isNull(roleGroupRole.deletedAt)
          )
        ),
    ])

    const allUserRoles = [...directRoles, ...groupRoles]
    return allUserRoles.some(
      (userRoleItem) =>
        userRoleItem.roleScope === scope &&
        userRoleItem.rolePermissions.includes(permission)
    )
  } catch {
    return false
  }
}

export const rbac = (
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) => {
  return {
    getOrganizationIds: async () => [] as string[],
    getLocationIds: async () => [] as string[],
    getDepartmentIds: async () => [] as string[],
    getGroupIds: async () => [] as string[],
    /** Entity-level restrictions removed; mirrors the same scope+permission gate as the procedure. */
    hasGlobalAccess: async () => can(userId, scope, permission),
    shouldRestrictToSubordinatesOnly: async () => false,
  }
}
