import { eq } from 'drizzle-orm'
import { db } from '..'
import { roleGroup, user, userRoleGroup } from '../schema'
import { auth } from '@/lib/auth'

/**
 * Portfolio admin: primary user mehmet.dogan@gmail.com (SUPER_ADMIN).
 * Aksiyon Soft test kullanıcıları isteğe bağlıdır (SEED_AKSIYON_SOFT_ADMINS=true).
 */

const PRIMARY_ADMIN = {
  username: 'mehmet.dogan',
  password: 'mehmet1234!',
  firstName: 'Mehmet',
  lastName: 'Doğan',
  email: 'mehmetdogan.dev@gmail.com',
} as const

const OPTIONAL_AKSİYON_ADMINS = [
  {
    username: 'abdulsamet.ok',
    password: 'abdulsamet1234!',
    firstName: 'Abdulsamet',
    lastName: 'Ok',
    email: 'abdulsamet.ok@aksiyonsoft.com',
  },
  {
    username: 'yusuf.bozkurt',
    password: 'yusuf1234!',
    firstName: 'Yusuf',
    lastName: 'Bozkurt',
    email: 'yusuf.bozkurt@aksiyonsoft.com',
  },
  {
    username: 'berat.yasa',
    password: 'berat1234!',
    firstName: 'Berat',
    lastName: 'Yasa',
    email: 'berat.yasa@aksiyonsoft.com',
  },
] as const

function shouldSeedAksiyonSoftAdmins(): boolean {
  return process.env.SEED_AKSIYON_SOFT_ADMINS === 'true'
}

export async function seed() {
  const admins = shouldSeedAksiyonSoftAdmins()
    ? [PRIMARY_ADMIN, ...OPTIONAL_AKSİYON_ADMINS]
    : [PRIMARY_ADMIN]

  for (const admin of admins) {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, admin.username))
      .limit(1)
      .then((r) => r[0])

    let userId = existingUser?.id

    if (!existingUser) {
      const addedAdmin = await auth.api.signUpEmail({
        headers: new Headers(),
        body: {
          password: admin.password,
          email: admin.email,
          username: admin.username,
          lastName: admin.lastName,
          name: admin.firstName,
          displayUsername: `${admin.firstName} ${admin.lastName}`,
        },
      })

      if (!addedAdmin.user.id) {
        throw new Error(
          `Failed to retrieve the newly created admin user: ${admin.username}`
        )
      }

      userId = addedAdmin.user.id
      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, userId))
    } else {
      console.log(`Admin user ${admin.username} already exists`)
      userId = existingUser.id
      if (!existingUser.emailVerified) {
        await db
          .update(user)
          .set({ emailVerified: true })
          .where(eq(user.id, existingUser.id))
      }
    }

    if (!userId) {
      throw new Error(`Unable to resolve user id for admin ${admin.username}`)
    }

    await ensureSuperAdminAssignments(userId)
  }
}

const ensureSuperAdminAssignments = async (userId: string) => {
  const superAdminRoleGroup = await db
    .select()
    .from(roleGroup)
    .where(eq(roleGroup.title, 'SUPER_ADMIN'))
    .limit(1)
    .then((r) => r[0])
  if (!superAdminRoleGroup) {
    throw new Error(`Super admin role group not found`)
  }

  await db
    .insert(userRoleGroup)
    .values({
      userId: userId,
      roleGroupId: superAdminRoleGroup.id,
    })
    .onConflictDoNothing()
}
