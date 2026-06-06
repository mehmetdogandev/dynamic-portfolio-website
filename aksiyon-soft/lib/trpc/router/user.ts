import {
  rbacWithColumnAccessProcedure,
  router,
  publicProcedure,
  createAdminListSchema,
  Context,
} from '..'
import { paginatedListResponse } from '../admin-list'
import { z } from 'zod'
import {
  user,
  role,
  userRole,
  SCOPES,
  PERMISSIONS,
  userRoleGroup,
  roleGroup,
  roleGroupRole,
  file as fileSchema,
} from '../../db/schema'
import { eq, and, desc, asc, count, inArray, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import {
  applyColumnFilters,
  excludeDeleted,
  createMultiColumnSearch,
} from '@/lib/db/utils'
import { getTableColumnNames } from '@/lib/utils/table-utils'
import { RBAC_ERRORS } from '@/lib/utils/rbac-helpers'
import { TRPCError } from '@trpc/server'
import { canCached as can } from '../../utils/rbac-cached'
import {
  invalidateUserCache,
  invalidateUserMappingCache,
  afterMutationInvalidate,
} from '../../cache/redis-client'
import { PgColumn } from 'drizzle-orm/pg-core'
import { getPasswordResetAppOrigin } from '@/lib/auth/password-reset-origin'
import { adminHref } from '@/lib/admin-path'
/** Without org/location scoping: global USER access sees everyone; otherwise only self. */
const getVisibilityCondition = async (
  ctx: Pick<Context, 'rbac' | 'session'>
): Promise<ReturnType<typeof sql> | ReturnType<typeof inArray>> => {
  if (!ctx.rbac) return sql`FALSE`
  if (ctx.rbac.hasGlobalAccess) return sql`TRUE`
  const uid = ctx.session?.user?.id
  if (!uid) return sql`FALSE`
  return inArray(user.id, [uid])
}

const userListSelect = {
  id: user.id,
  name: user.name,
  lastName: user.lastName,
  email: user.email,
  emailVerified: user.emailVerified,
  username: user.username,
  displayUsername: user.displayUsername,
  image: user.image,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt,
} as const
export const userInsertSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  email: z.email('Geçerli bir e-posta adresi gereklidir'),
  username: z
    .string()
    .trim()
    .min(1, 'Kullanıcı adı gereklidir')
    .max(100, 'Kullanıcı adı en fazla 100 karakter olabilir'),
  roleIds: z.array(z.uuid()).optional().default([]),
})

export const userRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      return null
    }

    // Get fresh user data from database to ensure image field is up to date
    // This avoids session cache issues when profile photo is updated
    const userData = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        username: user.username,
        displayUsername: user.displayUsername,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1)

    if (!userData.length) {
      return null
    }

    // Merge session user data with fresh database data
    return {
      ...ctx.session.user,
      ...userData[0],
    }
  }),

  // list users with pagination, search, and sorting
  list: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.READ,
    getTableColumnNames(user)
  )
    .input(
      createAdminListSchema(['name', 'email', 'username', 'createdAt']).extend({
        includeDeleted: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      try {
        const visibilityCondition = input.includeDeleted
          ? sql`TRUE`
          : await getVisibilityCondition(ctx)

        const conditions: SQL[] = [visibilityCondition as SQL]

        if (input.includeDeleted) {
          conditions.push(sql`${user.deletedAt} IS NOT NULL`)
        } else {
          conditions.push(excludeDeleted(user))
        }

        if (search) {
          conditions.push(
            createMultiColumnSearch(
              [user.name, user.lastName, user.email, user.username],
              search
            )
          )
        }

        applyColumnFilters(conditions, columnFilters, {
          name: user.name,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        })

        const orderBy = sortOrder === 'asc' ? asc : desc
        let sortColumn: PgColumn | ReturnType<typeof sql> = user.createdAt
        if (sortBy === 'name') sortColumn = user.name
        else if (sortBy === 'email') sortColumn = user.email
        else if (sortBy === 'username') sortColumn = user.username
        else if (sortBy === 'createdAt') sortColumn = user.createdAt

        const whereCondition =
          conditions.length > 1 ? and(...conditions) : conditions[0]

        const [usersData, totalCount] = await Promise.all([
          ctx.db
            .select(userListSelect)
            .from(user)
            .where(whereCondition)
            .orderBy(orderBy(sortColumn))
            .limit(limit)
            .offset(offset),

          ctx.db.select({ count: count() }).from(user).where(whereCondition),
        ])

        type Row = (typeof usersData)[number]
        type EnhancedUser = Row & {
          roles?: Array<{ id: string; name: string; scope: string }>
        }

        const enhancedUsers: EnhancedUser[] = await Promise.all(
          usersData.map(async (userData) => {
            const result: EnhancedUser = { ...userData }
            if (!userData.id) return result
            try {
              const [directRoles, groupRoles] = await Promise.all([
                ctx.db
                  .select({
                    roleId: role.id,
                    roleName: role.name,
                    roleScope: role.scope,
                  })
                  .from(userRole)
                  .innerJoin(role, eq(userRole.roleId, role.id))
                  .where(
                    and(
                      eq(userRole.userId, userData.id),
                      excludeDeleted(userRole)
                    )
                  ),
                ctx.db
                  .select({
                    roleId: role.id,
                    roleName: role.name,
                    roleScope: role.scope,
                  })
                  .from(userRoleGroup)
                  .innerJoin(
                    roleGroupRole,
                    eq(userRoleGroup.roleGroupId, roleGroupRole.roleGroupId)
                  )
                  .innerJoin(role, eq(roleGroupRole.roleId, role.id))
                  .where(
                    and(
                      eq(userRoleGroup.userId, userData.id),
                      excludeDeleted(userRoleGroup)
                    )
                  ),
              ])
              const allRoles = [...directRoles, ...groupRoles]
              result.roles = allRoles.map((r) => ({
                id: r.roleId,
                name: r.roleName,
                scope: r.roleScope,
              }))
            } catch (error) {
              console.warn('Could not fetch user roles:', error)
              result.roles = []
            }
            return result
          })
        )

        return paginatedListResponse(
          enhancedUsers,
          totalCount[0]?.count ?? 0,
          page,
          limit
        )
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: RBAC_ERRORS.NO_ACCESS('User'),
          cause: error,
        })
      }
    }),

  // Kullanıcı detayları ve rolleri
  getById: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.READ,
    getTableColumnNames(user)
  )
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const visibilityCondition = await getVisibilityCondition(ctx)

        const userData = await ctx.db
          .select(userListSelect)
          .from(user)
          .where(
            and(
              eq(user.id, input.id),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!userData.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: RBAC_ERRORS.NOT_FOUND('User'),
          })
        }

        // Get user's roles (both direct and through role groups)
        const [directRoles, groupRoles] = await Promise.all([
          // Direct role assignments (legacy)
          ctx.db
            .select({
              id: role.id,
              name: role.name,
              scope: role.scope,
              permissions: role.permissions,
            })
            .from(userRole)
            .innerJoin(role, eq(userRole.roleId, role.id))
            .where(
              and(eq(userRole.userId, input.id), excludeDeleted(userRole))
            ),

          // Role assignments through role groups (new system)
          ctx.db
            .select({
              id: role.id,
              name: role.name,
              scope: role.scope,
              permissions: role.permissions,
            })
            .from(userRoleGroup)
            .innerJoin(
              roleGroupRole,
              eq(userRoleGroup.roleGroupId, roleGroupRole.roleGroupId)
            )
            .innerJoin(role, eq(roleGroupRole.roleId, role.id))
            .where(
              and(
                eq(userRoleGroup.userId, input.id),
                excludeDeleted(userRoleGroup)
              )
            ),
        ])

        const allRoles = [...directRoles, ...groupRoles]

        // Return both direct and group-derived roles separately to allow clients
        // to distinguish between explicit assignments and inherited roles.
        return {
          ...userData[0],
          roles: allRoles,
          directRoles,
          groupRoles,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: RBAC_ERRORS.NOT_FOUND('User'),
          cause: error,
        })
      }
    }),

  // Yeni kullanıcı oluşturma
  create: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.CREATE,
    getTableColumnNames(user)
  )
    .input(userInsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Map input field names to database column names
        // firstName -> name (for database column name)
        const fieldMapping: Record<string, string> = {
          firstName: 'name',
        }

        // Map input fields to database column names before filtering
        const {
          password: _password,
          roleIds: _roleIds,
          ...userInputData
        } = input
        const mappedInputData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(userInputData)) {
          const dbColumnName = fieldMapping[key] || key
          if (value !== undefined) {
            mappedInputData[dbColumnName] = value
          }
        }

        const emailTrimmed = input.email.trim()
        const emailNormalized = emailTrimmed.toLowerCase()

        const userDataForFilter = {
          ...mappedInputData,
          email: emailTrimmed,
        }

        // Filter writable fields using column access helper (handles global access automatically)
        const { filteredData } =
          await ctx.columnAccess.filterInputData(userDataForFilter)

        // Ensure required fields are present and writable
        const requiredFields = ['name', 'lastName', 'email', 'username']
        const missingFields = requiredFields.filter(
          (field) => !(field in filteredData)
        )

        if (missingFields.length > 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Bu alanları değiştirmek için yetkiniz yok: ${missingFields.join(', ')}`,
          })
        }

        // Check if user already exists
        const existingUser = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              or(
                sql`lower(${user.email}) = ${emailNormalized}`,
                eq(user.username, input.username)
              ),
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'Bu e-posta adresi veya kullanıcı adı ile zaten bir kullanıcı kayıtlı',
          })
        }

        // Auth API needs its own connection, so call it outside transaction
        // Then use transaction only for role assignment and other operations
        const response = await ctx.auth.api.signUpEmail({
          headers: new Headers(),
          body: {
            email: emailTrimmed,
            password: input.password,
            lastName: input.lastName,
            name: input.firstName,
            username: input.username,
            displayUsername: `${input.firstName} ${input.lastName}`,
          },
        })

        const newUser = response.user

        if (input.roleIds && input.roleIds.length > 0) {
          await ctx.db.transaction(async (tx) => {
            const uniqueRoleIds = Array.from(new Set(input.roleIds))
            await tx
              .insert(userRole)
              .values(
                uniqueRoleIds.map((roleId: string) => ({
                  userId: newUser.id,
                  roleId,
                }))
              )
              .onConflictDoNothing()
          })
        }

        await afterMutationInvalidate(async () => {
          if (input.roleIds && input.roleIds.length > 0) {
            await invalidateUserCache(newUser.id)
          }
          await invalidateUserMappingCache(newUser.id)
        })

        return newUser
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        // Log the actual error for debugging
        console.error('User creation failed:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }

        // Provide a more descriptive error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : RBAC_ERRORS.CREATION_FAILED('User')

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Kullanıcı oluşturulamadı: ${errorMessage}`,
          cause: error,
        })
      }
    }),

  // Kullanıcı güncelleme
  update: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.UPDATE,
    getTableColumnNames(user)
  )
    .input(
      userInsertSchema.partial().extend({
        id: z.string(),
        roleIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const {
          roleIds,
          id: _id,
          password: _password,
          ...userInputData
        } = input

        // Map input field names to database column names
        // firstName -> name (for database column name)
        const fieldMapping: Record<string, string> = {
          firstName: 'name',
        }

        // Map input fields to database column names before filtering
        const mappedInputData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(userInputData)) {
          const dbColumnName = fieldMapping[key] || key
          if (value !== undefined) {
            mappedInputData[dbColumnName] = value
          }
        }

        // Filter writable fields using column access helper (handles global access automatically)
        const { filteredData } =
          await ctx.columnAccess.filterInputData(mappedInputData)

        // Apply visibility conditions to check if user can access the target user
        const visibilityCondition = await getVisibilityCondition(ctx)
        const existingUser = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              eq(user.id, input.id),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!existingUser.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: RBAC_ERRORS.NOT_FOUND('User'),
          })
        }

        const txResult = await ctx.db.transaction(async (tx) => {
          const userUpdateData = filteredData
          let needsRbacInvalidate = false
          let needsMappingInvalidate = false

          let updatedUser
          if (Object.keys(userUpdateData).length > 0) {
            ;[updatedUser] = await tx
              .update(user)
              .set(userUpdateData)
              .where(eq(user.id, input.id))
              .returning()

            if (!updatedUser) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: RBAC_ERRORS.UPDATE_FAILED('User'),
              })
            }

            needsRbacInvalidate = true
            if (userUpdateData.username) {
              needsMappingInvalidate = true
            }
          } else {
            const existing = await tx
              .select()
              .from(user)
              .where(eq(user.id, input.id))
              .limit(1)
            updatedUser = existing[0]
          }

          if (roleIds !== undefined) {
            const canManageRoles = await can(
              ctx.session.user.id,
              SCOPES.ROLE,
              PERMISSIONS.UPDATE
            )
            if (canManageRoles) {
              needsRbacInvalidate = true
              const uniqueRoleIds = Array.from(new Set(roleIds))
              const sessionUserId = ctx.session.user.id

              const currentActive = await tx
                .select({ roleId: userRole.roleId })
                .from(userRole)
                .where(
                  and(eq(userRole.userId, input.id), excludeDeleted(userRole))
                )
              const currentActiveRoleIds = new Set(
                currentActive.map((r) => r.roleId).filter(Boolean) as string[]
              )

              const toRemove = [...currentActiveRoleIds].filter(
                (rid) => !uniqueRoleIds.includes(rid)
              )
              if (toRemove.length > 0) {
                await tx
                  .update(userRole)
                  .set({
                    deletedAt: new Date(),
                    deletedBy: sessionUserId,
                  })
                  .where(
                    and(
                      eq(userRole.userId, input.id),
                      inArray(userRole.roleId, toRemove),
                      excludeDeleted(userRole)
                    )
                  )
              }

              const toAdd = uniqueRoleIds.filter(
                (rid) => !currentActiveRoleIds.has(rid)
              )
              for (const roleId of toAdd) {
                const existing = await tx
                  .select({ id: userRole.id, deletedAt: userRole.deletedAt })
                  .from(userRole)
                  .where(
                    and(
                      eq(userRole.userId, input.id),
                      eq(userRole.roleId, roleId)
                    )
                  )
                  .limit(1)

                if (existing.length > 0 && existing[0].deletedAt) {
                  await tx
                    .update(userRole)
                    .set({
                      deletedAt: null,
                      deletedBy: null,
                      lastUpdatedBy: sessionUserId,
                    })
                    .where(eq(userRole.id, existing[0].id!))
                } else if (existing.length === 0) {
                  await tx.insert(userRole).values({
                    userId: input.id,
                    roleId,
                    createdBy: sessionUserId,
                  })
                }
              }
            } else {
              console.warn('User attempted to modify roles without permission')
            }
          }

          return {
            updatedUser,
            needsRbacInvalidate,
            needsMappingInvalidate,
          }
        })

        await afterMutationInvalidate(async () => {
          if (txResult.needsRbacInvalidate) {
            await invalidateUserCache(input.id)
          }
          if (txResult.needsMappingInvalidate) {
            await invalidateUserMappingCache(input.id)
          }
        })

        return txResult.updatedUser
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: RBAC_ERRORS.UPDATE_FAILED('User'),
          cause: error,
        })
      }
    }),

  // Set user password (USER scope UPDATE via procedure; visibility still applies)
  setUserPassword: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.UPDATE,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        userId: z.string().min(1, 'Kullanıcı ID gereklidir'),
        newPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Apply visibility conditions to check if user can access the target user
        const visibilityCondition = await getVisibilityCondition(ctx)
        const existingUser = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              eq(user.id, input.userId),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!existingUser.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: RBAC_ERRORS.NOT_FOUND('User'),
          })
        }

        // Set password using Better Auth API
        await ctx.auth.api.setUserPassword({
          body: {
            newPassword: input.newPassword,
            userId: input.userId,
          },
          headers: ctx.headers,
        })

        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Şifre güncellenirken bir hata oluştu',
          cause: error,
        })
      }
    }),

  // Kullanıcı silme
  delete: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.DELETE,
    getTableColumnNames(user)
  )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Apply visibility conditions to check if user can access the target user
        const visibilityCondition = await getVisibilityCondition(ctx)
        const userToDelete = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              eq(user.id, input.id),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!userToDelete.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: RBAC_ERRORS.NOT_FOUND('User'),
          })
        }

        const sessionUserId = ctx.session.user.id
        const deletedUser = await ctx.db.transaction(async (tx) => {
          const now = new Date()
          await Promise.all([
            tx
              .update(userRole)
              .set({ deletedAt: now, deletedBy: sessionUserId })
              .where(
                and(eq(userRole.userId, input.id), excludeDeleted(userRole))
              ),
            tx
              .update(userRoleGroup)
              .set({ deletedAt: now, deletedBy: sessionUserId })
              .where(
                and(
                  eq(userRoleGroup.userId, input.id),
                  excludeDeleted(userRoleGroup)
                )
              ),
          ])

          const [row] = await tx
            .update(user)
            .set({ deletedAt: new Date() })
            .where(and(eq(user.id, input.id), excludeDeleted(user)))
            .returning()

          if (!row) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: RBAC_ERRORS.DELETION_FAILED('User'),
            })
          }

          return row
        })

        await afterMutationInvalidate(async () => {
          await invalidateUserCache(input.id)
          await invalidateUserMappingCache(input.id)
        })

        return deletedUser
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: RBAC_ERRORS.DELETION_FAILED('User'),
          cause: error,
        })
      }
    }),

  // Kullanıcıyı geri al (soft-undelete)
  restore: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.CREATE,
    getTableColumnNames(user)
  )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Ensure caller can see the target user (visibility)
        const visibilityCondition = await getVisibilityCondition(ctx)

        const target = await ctx.db
          .select({ id: user.id, deletedAt: user.deletedAt })
          .from(user)
          .where(and(eq(user.id, input.id), visibilityCondition))
          .limit(1)

        if (!target.length || !target[0].deletedAt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kullanıcı bulunamadı veya zaten aktif',
          })
        }

        const [restored] = await ctx.db
          .update(user)
          .set({ deletedAt: null })
          .where(eq(user.id, input.id))
          .returning()

        if (!restored) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Kullanıcı geri alınamadı',
          })
        }

        await afterMutationInvalidate(async () => {
          await invalidateUserCache(input.id)
          await invalidateUserMappingCache(input.id)
        })

        return restored
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kullanıcı geri alınırken hata oluştu',
          cause: error,
        })
      }
    }),

  // Get role groups assigned to a specific user (including roles for hover/view)
  getRoleGroupsFor: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.READ,
    getTableColumnNames(user)
  )
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Ensure the target user exists and is visible to the caller
        const userExists = await ctx.db
          .select()
          .from(user)
          .where(eq(user.id, input.userId))
          .limit(1)

        if (userExists.length === 0) {
          throw new Error('Kullanıcı bulunamadı veya erişim izniniz yok')
        }

        // Fetch role groups assigned to the user
        const roleGroups = await ctx.db
          .select({
            id: roleGroup.id,
            title: roleGroup.title,
            description: roleGroup.description,
            createdAt: roleGroup.createdAt,
            updatedAt: roleGroup.updatedAt,
          })
          .from(userRoleGroup)
          .innerJoin(roleGroup, eq(userRoleGroup.roleGroupId, roleGroup.id))
          .where(
            and(
              eq(userRoleGroup.userId, input.userId),
              excludeDeleted(userRoleGroup)
            )
          )

        // If none, return empty array
        if (!roleGroups.length) {
          return []
        }

        const roleGroupIds = roleGroups
          .map((rg) => rg.id)
          .filter((id): id is string => !!id)

        // Fetch roles for these role groups
        const rolesWithGroups = await ctx.db
          .select({
            roleGroupId: roleGroupRole.roleGroupId,
            roleId: role.id,
            roleName: role.name,
            roleScope: role.scope,
            rolePermissions: role.permissions,
          })
          .from(roleGroupRole)
          .where(inArray(roleGroupRole.roleGroupId, roleGroupIds))
          .innerJoin(role, eq(roleGroupRole.roleId, role.id))

        // Map roles into their groups
        const result = roleGroups.map((rg) => ({
          ...rg,
          roles: rolesWithGroups
            .filter((r) => r.roleGroupId === rg.id)
            .map((r) => ({
              id: r.roleId,
              name: r.roleName,
              scope: r.roleScope,
              permissions: r.rolePermissions,
            })),
        }))

        return result
      } catch (error) {
        if (error instanceof Error) throw error
        throw new Error('Rol grupları getirilirken bir hata oluştu')
      }
    }),

  /**
   * Generate presigned upload URL for profile photo
   */
  generateProfilePhotoUploadUrl: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.UPDATE,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        fileName: z.string().min(1, 'File name is required'),
        mimeType: z.string().min(1, 'MIME type is required'),
        fileSize: z.number().int().positive('File size must be positive'),
        userId: z.string().optional(), // Optional - defaults to current user
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const targetUserId = input.userId || ctx.session.user.id

        // Check if user can update the target user's profile photo
        if (targetUserId !== ctx.session.user.id) {
          // Check if user has permission to update other users
          const canUpdate = await can(
            ctx.session.user.id,
            SCOPES.USER,
            PERMISSIONS.UPDATE
          )
          if (!canUpdate) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message:
                'Bu kullanıcının profil fotoğrafını güncelleme yetkiniz yok',
            })
          }
        }

        const { validateProfilePhotoType, validateProfilePhotoSize } =
          await import('@/lib/utils/profile-photo-utils')

        // Validate file type
        if (!validateProfilePhotoType(input.mimeType)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Geçersiz dosya tipi. Sadece resim dosyaları (JPEG, PNG, WebP, GIF) kabul edilir',
          })
        }

        // Validate file size
        try {
          validateProfilePhotoSize(input.fileSize)
        } catch (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              error instanceof Error ? error.message : 'Geçersiz dosya boyutu',
          })
        }

        // Generate file path for profile photo
        const { generateProfilePhotoFileName, getProfilePhotoPath } =
          await import('@/lib/utils/profile-photo-utils')

        const fileName = generateProfilePhotoFileName(input.fileName)
        const filePath = getProfilePhotoPath(targetUserId, fileName)

        // Return API endpoint instead of presigned URL
        return {
          uploadUrl: '/api/files/upload', // API endpoint for upload
          fileId: '', // Will be set after upload
          fileName: filePath,
          filePath,
          expiresIn: 3600, // 1 hour (kept for compatibility)
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Profil fotoğrafı yükleme URL'si oluşturulamadı",
          cause: error,
        })
      }
    }),

  /**
   * Update profile photo after successful upload
   * Creates file record and updates user.image field with file ID
   */
  updateProfilePhoto: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.UPDATE,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        fileId: z.string().uuid('File ID is required'),
        userId: z.string().optional(), // Optional - defaults to current user
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const targetUserId = input.userId || ctx.session.user.id

        // Check if user can update the target user's profile photo
        if (targetUserId !== ctx.session.user.id) {
          const canUpdate = await can(
            ctx.session.user.id,
            SCOPES.USER,
            PERMISSIONS.UPDATE
          )
          if (!canUpdate) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message:
                'Bu kullanıcının profil fotoğrafını güncelleme yetkiniz yok',
            })
          }
        }

        // Get file record
        const { getFileRecord } = await import('@/lib/s3/utils')
        const fileRecord = await getFileRecord(input.fileId)
        if (!fileRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dosya kaydı bulunamadı',
          })
        }

        // Verify file belongs to profile photos
        if (!fileRecord.fileName.startsWith(`profile/${targetUserId}/`)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bu dosya profil fotoğrafı değil',
          })
        }

        // Get visibility condition to check access
        const visibilityCondition = await getVisibilityCondition(ctx)
        const existingUser = await ctx.db
          .select({ id: user.id, image: user.image })
          .from(user)
          .where(
            and(
              eq(user.id, targetUserId),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!existingUser.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kullanıcı bulunamadı veya erişim izniniz yok',
          })
        }

        // If there's an old profile photo, we can optionally delete it
        // For now, we'll just update the reference

        // Update file record URL if needed
        if (!fileRecord.url || fileRecord.url === '') {
          await ctx.db
            .update(fileSchema)
            .set({ url: `api/files/${fileRecord.id}/view` })
            .where(eq(fileSchema.id, fileRecord.id))
        }

        // Update user.image field with file ID
        await ctx.db
          .update(user)
          .set({ image: fileRecord.id })
          .where(eq(user.id, targetUserId))

        await afterMutationInvalidate(async () => {
          await invalidateUserCache(targetUserId)
        })

        return {
          success: true,
          fileId: fileRecord.id,
          message: 'Profil fotoğrafı başarıyla güncellendi',
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Profil fotoğrafı güncellenemedi',
          cause: error,
        })
      }
    }),

  /**
   * Delete profile photo
   */
  deleteProfilePhoto: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.UPDATE,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        userId: z.string().optional(), // Optional - defaults to current user
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const targetUserId = input.userId || ctx.session.user.id

        // Check if user can update the target user's profile photo
        if (targetUserId !== ctx.session.user.id) {
          const canUpdate = await can(
            ctx.session.user.id,
            SCOPES.USER,
            PERMISSIONS.UPDATE
          )
          if (!canUpdate) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message:
                'Bu kullanıcının profil fotoğrafını kaldırma yetkiniz yok',
            })
          }
        }

        // Get visibility condition to check access
        const visibilityCondition = await getVisibilityCondition(ctx)
        const existingUser = await ctx.db
          .select({ id: user.id, image: user.image })
          .from(user)
          .where(
            and(
              eq(user.id, targetUserId),
              visibilityCondition,
              excludeDeleted(user)
            )
          )
          .limit(1)

        if (!existingUser.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kullanıcı bulunamadı veya erişim izniniz yok',
          })
        }

        // Update user.image field to null
        await ctx.db
          .update(user)
          .set({ image: null })
          .where(eq(user.id, targetUserId))

        await afterMutationInvalidate(async () => {
          await invalidateUserCache(targetUserId)
        })

        return {
          success: true,
          message: 'Profil fotoğrafı başarıyla kaldırıldı',
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Profil fotoğrafı kaldırılamadı',
          cause: error,
        })
      }
    }),

  /**
   * Get profile photo download URL
   */
  getProfilePhotoUrl: rbacWithColumnAccessProcedure(
    SCOPES.USER,
    PERMISSIONS.READ,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        userId: z.string().optional(), // Optional - defaults to current user
        fileId: z.string().uuid().optional(), // Optional - if not provided, gets from user.image
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const targetUserId = input.userId || ctx.session.user.id
        let fileIdToUse = input.fileId

        // If fileId not provided, get from user.image
        if (!fileIdToUse) {
          const visibilityCondition = await getVisibilityCondition(ctx)
          const userRecord = await ctx.db
            .select({ image: user.image })
            .from(user)
            .where(
              and(
                eq(user.id, targetUserId),
                visibilityCondition,
                excludeDeleted(user)
              )
            )
            .limit(1)

          if (!userRecord.length) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Kullanıcı bulunamadı veya erişim izniniz yok',
            })
          }

          fileIdToUse = userRecord[0].image ?? undefined
        }

        if (!fileIdToUse) {
          return null // No profile photo
        }

        // Get file record
        const { getFileRecord } = await import('@/lib/s3/utils')
        const fileRecord = await getFileRecord(fileIdToUse)
        if (!fileRecord) {
          return null // File record not found
        }

        // Verify file belongs to profile photos
        if (!fileRecord.fileName.startsWith('profile/')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bu dosya profil fotoğrafı değil',
          })
        }

        // Return API endpoint instead of presigned URL
        const downloadUrl = `/api/files/${fileIdToUse}/view`

        return {
          downloadUrl,
          fileName: fileRecord.originalName,
          fileSize: fileRecord.size,
          mimeType: fileRecord.mimeType,
          expiresIn: 3600, // 1 hour (kept for compatibility)
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Profil fotoğrafı URL'si oluşturulamadı",
          cause: error,
        })
      }
    }),

  sendForgotPasswordEmail: publicProcedure
    .input(z.object({ email: z.email('Geçerli bir e-posta adresi giriniz') }))
    .mutation(async ({ input, ctx }) => {
      const normalized = input.email.trim().toLowerCase()
      const [_user] = await ctx.db
        .select({
          id: user.id,
          email: user.email,
        })
        .from(user)
        .where(
          and(sql`lower(${user.email}) = ${normalized}`, excludeDeleted(user))
        )
        .limit(1)
      if (!_user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Kullanıcı bulunamadı',
        })
      }

      if (!_user.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Kullanıcının e-posta adresi bulunamadı',
        })
      }

      const origin = getPasswordResetAppOrigin(ctx.headers)
      const response = await ctx.auth.api.requestPasswordReset({
        headers: ctx.headers,
        body: {
          email: _user.email,
          redirectTo: `${origin}${adminHref('/reset-password')}`,
        },
      })
      const success = response?.status ?? false
      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Şifre sıfırlama bağlantısı gönderilemedi',
        })
      }
      return { success: true }
    }),
})
