import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db, role, roleGroupRole, userRole } from '@/lib/db'

const SCOPE_MIGRATION: Record<string, string> = {
  JAPON_CUSTOMER: 'JAPON_OTO_CUSTOMER',
  JAPON_SERVICE: 'JAPON_OTO_SERVICE',
  JAPON_FORMEN: 'JAPON_OTO_FORMEN',
}

type RoleScope = (typeof role.scope.enumValues)[number]

async function repointRoleAssignments(
  fromRoleId: string,
  toRoleId: string
): Promise<void> {
  const groupLinks = await db
    .select({
      id: roleGroupRole.id,
      roleGroupId: roleGroupRole.roleGroupId,
    })
    .from(roleGroupRole)
    .where(
      and(eq(roleGroupRole.roleId, fromRoleId), isNull(roleGroupRole.deletedAt))
    )

  for (const link of groupLinks) {
    const existingTarget = await db
      .select({ id: roleGroupRole.id })
      .from(roleGroupRole)
      .where(
        and(
          eq(roleGroupRole.roleGroupId, link.roleGroupId),
          eq(roleGroupRole.roleId, toRoleId),
          isNull(roleGroupRole.deletedAt)
        )
      )
      .limit(1)
      .then((rows) => rows[0])

    if (existingTarget) {
      await db
        .update(roleGroupRole)
        .set({ deletedAt: new Date() })
        .where(eq(roleGroupRole.id, link.id))
    } else {
      await db
        .update(roleGroupRole)
        .set({ roleId: toRoleId })
        .where(eq(roleGroupRole.id, link.id))
    }
  }

  const userLinks = await db
    .select({ id: userRole.id, userId: userRole.userId })
    .from(userRole)
    .where(and(eq(userRole.roleId, fromRoleId), isNull(userRole.deletedAt)))

  for (const link of userLinks) {
    const existingTarget = await db
      .select({ id: userRole.id })
      .from(userRole)
      .where(
        and(
          eq(userRole.userId, link.userId),
          eq(userRole.roleId, toRoleId),
          isNull(userRole.deletedAt)
        )
      )
      .limit(1)
      .then((rows) => rows[0])

    if (existingTarget) {
      await db
        .update(userRole)
        .set({ deletedAt: new Date() })
        .where(eq(userRole.id, link.id))
    } else {
      await db
        .update(userRole)
        .set({ roleId: toRoleId })
        .where(eq(userRole.id, link.id))
    }
  }
}

/**
 * One-time (idempotent): legacy JAPON_* role scopes → JAPON_OTO_*.
 * When 1_role.ts already created target-scope rows, merge assignments and soft-delete legacy rows.
 */
export async function seed() {
  const legacyScopes = Object.keys(SCOPE_MIGRATION)

  const legacyRoles = await db
    .select({ id: role.id, scope: role.scope, name: role.name })
    .from(role)
    .where(
      and(
        inArray(role.scope, legacyScopes as RoleScope[]),
        isNull(role.deletedAt)
      )
    )

  if (legacyRoles.length === 0) {
    console.log('Skip japon-scope-migrate: no legacy Japon roles found')
    return
  }

  let migrated = 0
  let merged = 0

  for (const row of legacyRoles) {
    const nextScope = SCOPE_MIGRATION[row.scope]
    if (!nextScope) continue

    const canonical = await db
      .select({ id: role.id })
      .from(role)
      .where(
        and(
          eq(role.name, row.name),
          eq(role.scope, nextScope as RoleScope),
          isNull(role.deletedAt)
        )
      )
      .limit(1)
      .then((rows) => rows[0])

    if (canonical && canonical.id !== row.id) {
      await repointRoleAssignments(row.id, canonical.id)
      await db
        .update(role)
        .set({ deletedAt: new Date() })
        .where(eq(role.id, row.id))
      merged += 1
      continue
    }

    if (canonical) {
      continue
    }

    await db
      .update(role)
      .set({ scope: nextScope as RoleScope })
      .where(eq(role.id, row.id))
    migrated += 1
  }

  console.log(
    `✓ Japon scope migrate: ${migrated} updated, ${merged} merged into existing JAPON_OTO_* roles`
  )
}
