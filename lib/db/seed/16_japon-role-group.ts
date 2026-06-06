import { and, eq, inArray, isNull } from 'drizzle-orm'
import { SCOPES, db, role, roleGroup, roleGroupRole } from '@/lib/db/'

const JAPON_SCOPES = [
  SCOPES.JAPON_OTO_OPERATIONS,
  SCOPES.JAPON_OTO_CUSTOMER,
  SCOPES.JAPON_OTO_CAR,
  SCOPES.JAPON_OTO_SERVICE,
  SCOPES.JAPON_OTO_FORMEN,
] as const

const ROLE_GROUP_TITLE = 'JAPON_OTO_MANAGER'
const ROLE_GROUP_DESCRIPTION =
  'Japon Oto modülünün tüm scope ve izinlerine erişim sağlar. Tüm Japon Oto özelliklerini yönetebilen kullanıcılara atayın.'

/**
 * Re-syncable: each seed run wipes and rebuilds the role_group_role rows for
 * JAPON_OTO_MANAGER so that newly added Japon-scope roles (from 1_role.ts)
 * are picked up automatically.
 */
export async function seed() {
  const japonRoles = await db
    .select({ id: role.id, scope: role.scope, name: role.name })
    .from(role)
    .where(and(inArray(role.scope, [...JAPON_SCOPES]), isNull(role.deletedAt)))

  if (japonRoles.length === 0) {
    console.log(
      'Skip japon-role-group seed: no Japon scope roles found (run 1_role first)'
    )
    return
  }

  let group = await db
    .select()
    .from(roleGroup)
    .where(
      and(eq(roleGroup.title, ROLE_GROUP_TITLE), isNull(roleGroup.deletedAt))
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!group) {
    const [inserted] = await db
      .insert(roleGroup)
      .values({
        title: ROLE_GROUP_TITLE,
        description: ROLE_GROUP_DESCRIPTION,
      })
      .returning()
    group = inserted
    console.log(`✓ Created role group ${ROLE_GROUP_TITLE}`)
  }

  if (!group) {
    throw new Error('japon-role-group seed: failed to upsert role group')
  }

  await db.delete(roleGroupRole).where(eq(roleGroupRole.roleGroupId, group.id))

  await db.insert(roleGroupRole).values(
    japonRoles.map((r) => ({
      roleGroupId: group!.id,
      roleId: r.id,
    }))
  )

  console.log(
    `✓ Linked ${japonRoles.length} Japon Oto roles to ${ROLE_GROUP_TITLE}`
  )
}
