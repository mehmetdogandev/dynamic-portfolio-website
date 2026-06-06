import {
  createAdminListSchema,
  rbacWithColumnAccessProcedure,
  router,
  Context,
} from '..'
import { paginatedListResponse } from '../admin-list'
import { z } from 'zod'
import {
  roleGroup,
  userRoleGroup,
  roleGroupRole,
  role,
  SCOPES,
  PERMISSIONS,
} from '@/lib/db/schema'
import { eq, and, desc, asc, count, inArray, sql } from 'drizzle-orm'
import {
  applyColumnFilters,
  excludeDeleted,
  createLocaleInsensitiveSearch,
} from '@/lib/db/utils'
import { RBAC_ERRORS } from '@/lib/utils/rbac-helpers'
import { getTableColumnNames } from '@/lib/utils/table-utils'
import {
  invalidateUserCache,
  invalidateEntityListCache,
  invalidateEntityCache,
  afterMutationInvalidate,
} from '@/lib/cache/redis-client'
import { generateExcelTemplate } from '@/lib/utils/import-export/excel-generator'
import { parseAndValidateExcel } from '@/lib/utils/import-export/excel-parser'
import {
  roleGroupImportSchema,
  roleGroupImportInstructions,
  type RoleGroupImportRow,
} from '@/lib/utils/import-export/entities/role-group-import'

// Local visibility condition function for role groups
const getVisibilityCondition = async (
  ctx: Pick<Context, 'rbac' | 'session'>
): Promise<ReturnType<typeof sql>> => {
  if (!ctx.rbac || !ctx.session?.user.id) {
    return sql`FALSE` // No access to any role groups
  }

  // With entity-scoped RBAC removed, READ on ROLE_GROUP is enforced by the procedure only.
  if (ctx.rbac.hasGlobalAccess) {
    return sql`TRUE`
  }

  return sql`FALSE`
}

// Define available columns for role group access control (no longer needed - use getTableColumnNames)
// const roleGroupColumns = {
// 	id: roleGroup.id,
// 	title: roleGroup.title,
// 	description: roleGroup.description,
// 	createdAt: roleGroup.createdAt,
// 	updatedAt: roleGroup.updatedAt,
// } as const;

export const insertRoleGroupSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  roleIds: z.array(z.uuid()).min(1),
})

export const roleGroupRouter = router({
  // List role groups with pagination and filtering
  list: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.READ,
    getTableColumnNames(roleGroup)
  )
    .input(
      createAdminListSchema(['title', 'createdAt']).extend({
        includeRoles: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        includeRoles,
        columnFilters,
      } = input
      const offset = (page - 1) * limit

      // Get filtered select based on user's column permissions
      const filteredSelect = await ctx.columnAccess.getFilteredSelect(roleGroup)

      // Ensure we have access to at least the ID column
      if (!filteredSelect.id) {
        throw new Error('Rol grubu verilerine erişim yetkiniz yok')
      }

      // Build filter conditions
      const conditions = []

      // Visibility condition
      const visibilityCondition = await getVisibilityCondition(ctx)
      conditions.push(visibilityCondition, excludeDeleted(roleGroup))

      // Search filter (only if user can read title field)
      if (search && filteredSelect.title) {
        conditions.push(createLocaleInsensitiveSearch(roleGroup.title, search))
      }

      if (filteredSelect.title && filteredSelect.createdAt) {
        applyColumnFilters(conditions, columnFilters, {
          title: roleGroup.title,
          createdAt: roleGroup.createdAt,
        })
      }

      // Sorting
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn =
        sortBy === 'title' && filteredSelect.title
          ? roleGroup.title
          : sortBy === 'createdAt' && filteredSelect.createdAt
            ? roleGroup.createdAt
            : roleGroup.createdAt // fallback

      // Query role groups with filtered columns
      const roleGroups = await ctx.db
        .select(filteredSelect)
        .from(roleGroup)
        .where(and(...conditions))
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset(offset)

      // Get total count
      const totalCountResult = await ctx.db
        .select({ count: count() })
        .from(roleGroup)
        .where(and(...conditions))

      const totalCount = totalCountResult[0].count

      // Optionally include roles for each role group
      if (includeRoles && roleGroups.length > 0) {
        const roleGroupIds = roleGroups
          .map((rg) => rg.id)
          .filter((id): id is string => id !== undefined)

        if (roleGroupIds.length > 0) {
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

          // Map roles to their role groups
          const roleGroupsWithRoles = roleGroups.map((rg) => ({
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

          return paginatedListResponse(
            roleGroupsWithRoles,
            totalCount,
            page,
            limit
          )
        }
      }

      return paginatedListResponse(roleGroups, totalCount, page, limit)
    }), // Get role group by ID
  getById: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.READ,
    getTableColumnNames(roleGroup)
  )
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      // Get filtered select based on user's column permissions
      const filteredSelect = await ctx.columnAccess.getFilteredSelect(roleGroup)

      if (!filteredSelect.id) {
        throw new Error('Rol grubu verilerine erişim yetkiniz yok')
      }

      const visibilityCondition = await getVisibilityCondition(ctx)
      const roleGroupData = await ctx.db
        .select(filteredSelect)
        .from(roleGroup)
        .where(
          and(
            eq(roleGroup.id, input.id),
            visibilityCondition,
            excludeDeleted(roleGroup)
          )
        )
        .limit(1)

      if (!roleGroupData.length) {
        throw new Error('Rol grubu bulunamadı veya erişim yetkiniz yok')
      }

      // Get associated roles if user has access to role group ID
      let associatedRoles: Array<{
        id: string
        name: string
        scope: string
        permissions: string[]
      }> = []
      if (filteredSelect.id) {
        associatedRoles = await ctx.db
          .select({
            id: role.id,
            name: role.name,
            scope: role.scope,
            permissions: role.permissions,
          })
          .from(roleGroupRole)
          .where(eq(roleGroupRole.roleGroupId, input.id))
          .innerJoin(role, eq(roleGroupRole.roleId, role.id))
      }

      return {
        ...roleGroupData[0],
        roles: associatedRoles,
      }
    }),

  // Create new role group
  create: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.CREATE,
    getTableColumnNames(roleGroup)
  )
    .input(insertRoleGroupSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate write access to the fields being set
      const inputFields = Object.keys(input).filter((key) => key !== 'roleIds') // roleIds is not a roleGroup column
      await ctx.columnAccess.validateWriteAccess(inputFields)

      try {
        const newRoleGroup = await ctx.db.transaction(async (trx) => {
          const [row] = await trx
            .insert(roleGroup)
            .values({
              title: input.title,
              description: input.description,
            })
            .returning()

          if (!row) {
            throw new Error('Rol grubu oluşturulurken bir hata oluştu')
          }

          if (input.roleIds && input.roleIds.length > 0) {
            await trx.insert(roleGroupRole).values(
              input.roleIds.map((roleId) => ({
                roleGroupId: row.id,
                roleId: roleId,
              }))
            )
          }

          return row
        })
        await afterMutationInvalidate(() =>
          invalidateEntityListCache('ROLE_GROUP')
        )
        return newRoleGroup
      } catch (_error) {
        throw new Error('Rol grubu oluşturulurken bir hata oluştu')
      }
    }),

  // Update role group
  update: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.UPDATE,
    getTableColumnNames(roleGroup)
  )
    .input(
      insertRoleGroupSchema.partial().extend({
        id: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      // Validate write access to the fields being updated
      const updateFields = Object.keys(updateData).filter(
        (key) => key !== 'roleIds'
      ) // roleIds is not a roleGroup column
      await ctx.columnAccess.validateWriteAccess(updateFields)

      // Check if role group exists and user has access
      const visibilityCondition = await getVisibilityCondition(ctx)
      const existing = await ctx.db
        .select({ id: roleGroup.id })
        .from(roleGroup)
        .where(
          and(
            eq(roleGroup.id, id),
            visibilityCondition,
            excludeDeleted(roleGroup)
          )
        )
        .limit(1)

      if (!existing.length) {
        throw new Error('Rol grubu bulunamadı veya güncelleme yetkiniz yok')
      }

      try {
        const updatedRoleGroup = await ctx.db.transaction(async (trx) => {
          // Update role group basic info
          const roleGroupUpdateData: Record<string, unknown> = {}
          if (updateData.title !== undefined)
            roleGroupUpdateData.title = updateData.title
          if (updateData.description !== undefined)
            roleGroupUpdateData.description = updateData.description

          let updatedRoleGroup
          if (Object.keys(roleGroupUpdateData).length > 0) {
            ;[updatedRoleGroup] = await trx
              .update(roleGroup)
              .set(roleGroupUpdateData)
              .where(and(eq(roleGroup.id, id), excludeDeleted(roleGroup)))
              .returning()
          } else {
            // If no role group fields to update, just fetch current data
            const current = await trx
              .select()
              .from(roleGroup)
              .where(and(eq(roleGroup.id, id), excludeDeleted(roleGroup)))
              .limit(1)
            updatedRoleGroup = current[0]
          }

          if (!updatedRoleGroup) {
            throw new Error('Rol grubu güncellenirken hata oluştu')
          }

          // Update role associations if roleIds provided
          if (updateData.roleIds) {
            // Use Set to avoid duplicate inserts
            const nextRoleIdsSet = new Set(updateData.roleIds)
            const nextRoleIds = Array.from(nextRoleIdsSet)

            // Fetch existing role relations for diffing
            const existingRoleRelations = await trx
              .select({ roleId: roleGroupRole.roleId })
              .from(roleGroupRole)
              .where(eq(roleGroupRole.roleGroupId, id))

            const existingRoleIds = existingRoleRelations
              .map((relation) => relation.roleId)
              .filter((roleId): roleId is string => Boolean(roleId))
            const existingRoleIdsSet = new Set(existingRoleIds)

            const roleIdsToRemove = existingRoleIds.filter(
              (roleId) => !nextRoleIdsSet.has(roleId)
            )
            const roleIdsToAdd = nextRoleIds.filter(
              (roleId) => !existingRoleIdsSet.has(roleId)
            )

            // Remove relations that are no longer needed
            if (roleIdsToRemove.length > 0) {
              await trx
                .delete(roleGroupRole)
                .where(
                  and(
                    eq(roleGroupRole.roleGroupId, id),
                    inArray(roleGroupRole.roleId, roleIdsToRemove)
                  )
                )
            }

            // Insert only the new relations
            if (roleIdsToAdd.length > 0) {
              await trx.insert(roleGroupRole).values(
                roleIdsToAdd.map((roleId) => ({
                  roleGroupId: id,
                  roleId,
                }))
              )
            }
          }

          return updatedRoleGroup
        })

        // Invalidate cache for all users with this role group
        const usersWithRoleGroup = await ctx.db
          .select({ userId: userRoleGroup.userId })
          .from(userRoleGroup)
          .where(
            and(
              eq(userRoleGroup.roleGroupId, id),
              excludeDeleted(userRoleGroup)
            )
          )

        await afterMutationInvalidate(async () => {
          await Promise.all(
            usersWithRoleGroup.map((u) => invalidateUserCache(u.userId))
          )
          await invalidateEntityCache('ROLE_GROUP', id)
          await invalidateEntityListCache('ROLE_GROUP')
        })

        return updatedRoleGroup
      } catch (_error) {
        throw new Error('Rol grubu güncellenirken bir hata oluştu')
      }
    }), // Delete role group
  delete: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.DELETE,
    getTableColumnNames(roleGroup)
  )
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check role group exists and user has access
      const visibilityCondition = await getVisibilityCondition(ctx)
      const existing = await ctx.db
        .select({ id: roleGroup.id })
        .from(roleGroup)
        .where(
          and(
            eq(roleGroup.id, input.id),
            visibilityCondition,
            excludeDeleted(roleGroup)
          )
        )
        .limit(1)

      if (!existing.length) {
        throw new Error(RBAC_ERRORS.NOT_FOUND('rol grubu'))
      }

      // Check if any users are assigned to this role group
      const usersWithRoleGroup = await ctx.db
        .select({ count: count() })
        .from(userRoleGroup)
        .where(
          and(
            eq(userRoleGroup.roleGroupId, input.id),
            excludeDeleted(userRoleGroup)
          )
        )

      if (usersWithRoleGroup[0].count > 0) {
        throw new Error(
          `Bu rol grubu ${usersWithRoleGroup[0].count} kullanıcı tarafından kullanılıyor. Önce kullanıcıları bu rol grubundan çıkarın.`
        )
      }

      // Soft delete: set deletedAt instead of hard delete
      const deletedRoleGroups = await ctx.db
        .update(roleGroup)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(roleGroup.id, input.id),
            excludeDeleted(roleGroup) // Only delete if not already deleted
          )
        )
        .returning()

      if (!deletedRoleGroups.length) {
        throw new Error('Rol grubu bulunamadı')
      }

      await afterMutationInvalidate(() =>
        invalidateEntityListCache('ROLE_GROUP')
      )

      return { success: true }
    }),

  // Assign role group to user
  assignToUser: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.UPDATE,
    getTableColumnNames(roleGroup)
  )
    .input(
      z.object({
        userId: z.string(),
        roleGroupId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const sessionUserId = ctx.session.user.id

        // Check if row exists (including soft-deleted)
        const existing = await ctx.db
          .select({ id: userRoleGroup.id, deletedAt: userRoleGroup.deletedAt })
          .from(userRoleGroup)
          .where(
            and(
              eq(userRoleGroup.userId, input.userId),
              eq(userRoleGroup.roleGroupId, input.roleGroupId)
            )
          )
          .limit(1)

        if (existing.length > 0) {
          if (existing[0].deletedAt) {
            // Restore soft-deleted assignment
            await ctx.db
              .update(userRoleGroup)
              .set({
                deletedAt: null,
                deletedBy: null,
                lastUpdatedBy: sessionUserId,
              })
              .where(eq(userRoleGroup.id, existing[0].id!))
          }
          // Else: already active, no-op
        } else {
          // Insert new assignment
          await ctx.db.insert(userRoleGroup).values({
            userId: input.userId,
            roleGroupId: input.roleGroupId,
            createdBy: sessionUserId,
          })
        }

        await afterMutationInvalidate(() => invalidateUserCache(input.userId))

        return { success: true }
      } catch (_error) {
        throw new Error('Rol grubu kullanıcıya atanırken bir hata oluştu')
      }
    }),

  // Remove role group from user
  removeFromUser: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.UPDATE,
    getTableColumnNames(roleGroup)
  )
    .input(
      z.object({
        userId: z.string(),
        roleGroupId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check role group exists and user has access
      const visibilityCondition = await getVisibilityCondition(ctx)
      const existing = await ctx.db
        .select({ id: roleGroup.id })
        .from(roleGroup)
        .where(and(eq(roleGroup.id, input.roleGroupId), visibilityCondition))
        .limit(1)

      if (!existing.length) {
        throw new Error(RBAC_ERRORS.NOT_FOUND('rol grubu'))
      }

      // Soft delete the user_role_group link. Do NOT touch `user_role` rows here.
      const sessionUserId = ctx.session.user.id
      await ctx.db.transaction(async (tx) => {
        const softDeleted = await tx
          .update(userRoleGroup)
          .set({
            deletedAt: new Date(),
            deletedBy: sessionUserId,
          })
          .where(
            and(
              eq(userRoleGroup.userId, input.userId),
              eq(userRoleGroup.roleGroupId, input.roleGroupId),
              excludeDeleted(userRoleGroup)
            )
          )
          .returning()

        if (!softDeleted.length) {
          // If the user wasn't assigned this role group, roll back with a clear error.
          throw new Error(
            'Kullanıcı bu rol grubuna atanmış değil veya zaten kaldırılmış'
          )
        }
      })

      await afterMutationInvalidate(() => invalidateUserCache(input.userId))

      const messages: string[] = ['Rol grubu kullanıcıdan kaldırıldı']

      return { success: true, messages }
    }),

  downloadImportTemplate: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.IMPORT,
    getTableColumnNames(roleGroup)
  ).query(async () => {
    const buf = await generateExcelTemplate(
      roleGroupImportSchema,
      roleGroupImportInstructions,
      'Veriler'
    )
    return {
      fileName: 'rol-grubu-import-sablon.xlsx',
      base64: buf.toString('base64'),
    }
  }),

  importFromExcel: rbacWithColumnAccessProcedure(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.IMPORT,
    getTableColumnNames(roleGroup)
  )
    .input(z.object({ fileBase64: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, 'base64')
      const processed = await parseAndValidateExcel(
        buffer,
        roleGroupImportSchema,
        'Veriler'
      )

      let successCount = 0
      let failedCount = 0
      const rowResults: Array<{
        rowNumber: number
        status: 'success' | 'failed'
        message?: string
      }> = []

      for (const pr of processed) {
        if (pr.errors.length > 0) {
          failedCount++
          rowResults.push({
            rowNumber: pr.rowNumber,
            status: 'failed',
            message: pr.errors.map((e) => e.message).join('; '),
          })
          continue
        }

        const data = pr.data as RoleGroupImportRow
        try {
          const names = data.roleNames
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
          if (names.length === 0) {
            failedCount++
            rowResults.push({
              rowNumber: pr.rowNumber,
              status: 'failed',
              message: 'Rol adı yok',
            })
            continue
          }

          const roleIds: string[] = []
          for (const nm of names) {
            const found = await ctx.db
              .select({ id: role.id })
              .from(role)
              .where(and(eq(role.name, nm), excludeDeleted(role)))
              .limit(2)
            if (found.length !== 1) {
              throw new Error(
                found.length === 0
                  ? `Rol bulunamadı: ${nm}`
                  : `Birden fazla rol eşleşti: ${nm}`
              )
            }
            roleIds.push(found[0].id)
          }

          await ctx.db.transaction(async (trx) => {
            const [rg] = await trx
              .insert(roleGroup)
              .values({
                title: data.title,
                description: data.description ?? null,
              })
              .returning()
            if (!rg) throw new Error('Rol grubu eklenemedi')
            await trx.insert(roleGroupRole).values(
              roleIds.map((roleId) => ({
                roleGroupId: rg.id,
                roleId,
              }))
            )
          })

          await afterMutationInvalidate(() =>
            invalidateEntityListCache('ROLE_GROUP')
          )
          successCount++
          rowResults.push({ rowNumber: pr.rowNumber, status: 'success' })
        } catch (e) {
          failedCount++
          rowResults.push({
            rowNumber: pr.rowNumber,
            status: 'failed',
            message: e instanceof Error ? e.message : String(e),
          })
        }
      }

      return {
        totalRows: processed.length,
        successCount,
        failedCount,
        rowResults,
      }
    }),
})
