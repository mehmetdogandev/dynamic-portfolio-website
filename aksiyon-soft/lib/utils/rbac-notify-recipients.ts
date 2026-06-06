import { role, userRole, userRoleGroup, roleGroupRole } from '@/lib/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import type { DB } from '@/lib/db'

/**
 * Auth DB üzerinde belirtilen scope + permission'a sahip tüm kullanıcı ID'leri (direkt rol veya rol grubu).
 */
export async function getUserIdsWithScopePermission(
  authDb: DB,
  scope: string,
  permission: string
): Promise<string[]> {
  const rolesWithScope = await authDb
    .select({ id: role.id, permissions: role.permissions })
    .from(role)
    .where(
      and(
        eq(role.scope, scope as typeof role.$inferSelect.scope),
        isNull(role.deletedAt)
      )
    )

  const roleIds = rolesWithScope
    .filter((r) => (r.permissions as readonly string[]).includes(permission))
    .map((r) => r.id)

  if (roleIds.length === 0) return []

  const direct = await authDb
    .selectDistinct({ userId: userRole.userId })
    .from(userRole)
    .where(and(inArray(userRole.roleId, roleIds), isNull(userRole.deletedAt)))

  const viaGroup = await authDb
    .selectDistinct({ userId: userRoleGroup.userId })
    .from(userRoleGroup)
    .innerJoin(
      roleGroupRole,
      eq(userRoleGroup.roleGroupId, roleGroupRole.roleGroupId)
    )
    .where(
      and(
        inArray(roleGroupRole.roleId, roleIds),
        isNull(userRoleGroup.deletedAt),
        isNull(roleGroupRole.deletedAt)
      )
    )

  return [
    ...new Set([
      ...direct.map((d) => d.userId),
      ...viaGroup.map((v) => v.userId),
    ]),
  ]
}
