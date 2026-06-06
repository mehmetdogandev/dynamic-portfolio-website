import { eq } from 'drizzle-orm'
import { db } from '..'
import { roleGroup, user, userRoleGroup } from '../schema'
import { auth } from '@/lib/auth'

/**
 * Admin seeder for the new RBAC system.
 * Creates system administrators with SUPER_ADMIN roles across all scopes.
 */

const ADMINS = [
  {
    username: 'mehmet.dogan',
    password: 'mehmet1234!',
    firstName: 'Mehmet',
    lastName: 'Dogan',
    email: 'mehmet.dogan@aksiyonsoft.com',
  },
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
]

export async function seed() {
  // Create Admin Users and ensure every one of them has SUPER_ADMIN role for all scopes and assigned to admins
  for (const admin of ADMINS) {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, admin.username))
      .limit(1)
      .then((r) => r[0])

    let userId = existingUser?.id

    if (!existingUser) {
      try {
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
      } catch (error) {
        throw error
      }
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
