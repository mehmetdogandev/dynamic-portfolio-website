import {
  PERMISSIONS,
  SCOPES,
  db,
  role,
  roleGroup,
  roleGroupRole,
} from '@/lib/db/'
import { and, eq, isNull } from 'drizzle-orm'
import {
  PERMISSION_TRANSLATIONS,
  SCOPE_TRANSLATIONS,
} from '@/lib/i18n/db-enum-translations'

export async function seed() {
  const matrixRoleIds: string[] = []

  for (const scope of Object.keys(SCOPES) as (keyof typeof SCOPES)[]) {
    await ensureRolesForScope(scope, matrixRoleIds)
  }

  const superAdminRoleGroup = await db
    .select()
    .from(roleGroup)
    .where(eq(roleGroup.title, 'SUPER_ADMIN'))
    .limit(1)
    .then((r) => r[0])

  if (!superAdminRoleGroup) {
    const [newSuperAdminRoleGroup] = await db
      .insert(roleGroup)
      .values({
        title: 'SUPER_ADMIN',
        description:
          'Sadece Aksiyon Soft ekibinin kullanacağı rol grubudur. Başka bir kullanıcıya atanamaz.',
      })
      .returning()

    await db.insert(roleGroupRole).values(
      matrixRoleIds.map((roleId) => ({
        roleGroupId: newSuperAdminRoleGroup.id,
        roleId,
      }))
    )
    return
  }

  await db
    .delete(roleGroupRole)
    .where(eq(roleGroupRole.roleGroupId, superAdminRoleGroup.id))

  await db.insert(roleGroupRole).values(
    matrixRoleIds.map((roleId) => ({
      roleGroupId: superAdminRoleGroup.id,
      roleId,
    }))
  )

  await db
    .update(role)
    .set({ deletedAt: new Date() })
    .where(and(eq(role.name, 'SUPER_ADMIN'), isNull(role.deletedAt)))
}

const ensureRolesForScope = async (
  scope: keyof typeof SCOPES,
  matrixRoleIds: string[]
) => {
  for (const permission of Object.values(PERMISSIONS)) {
    const baseRoleName = `${SCOPE_TRANSLATIONS[scope]} ${PERMISSION_TRANSLATIONS[permission]}`
    const existingRole = await db
      .select({ id: role.id })
      .from(role)
      .where(and(eq(role.name, baseRoleName), eq(role.scope, scope)))
      .limit(1)
      .then((r) => r[0])

    let roleId: string
    if (!existingRole) {
      console.log(`Creating role: ${baseRoleName}`)
      const [inserted] = await db
        .insert(role)
        .values({
          name: baseRoleName,
          scope,
          permissions: [permission],
        })
        .returning({ id: role.id })
      roleId = inserted.id
    } else {
      roleId = existingRole.id
    }
    matrixRoleIds.push(roleId)
  }
}
