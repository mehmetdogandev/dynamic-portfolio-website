import {
  Context,
  createAdminListSchema,
  rbacWithColumnAccessProcedure,
  router,
} from '@/lib/trpc/'
import { paginatedListResponse } from '../admin-list'
import { z } from 'zod'
import {
  role,
  userRole,
  permissionEnum,
  scopesEnum,
  SCOPES,
  PERMISSIONS,
} from '@/lib/db/schema'
import { eq, and, desc, asc, count, sql, getTableColumns } from 'drizzle-orm'
import {
  applyColumnFilters,
  excludeDeleted,
  createLocaleInsensitiveSearch,
} from '@/lib/db/utils'
import {
  createColumnValidator,
  getTableColumnNames,
} from '@/lib/utils/table-utils'
import { RBAC_ERRORS } from '@/lib/utils/rbac-helpers'
import {
  invalidateUserCache,
  invalidateEntityListCache,
  getRedisClient,
  CACHE_KEYS,
  CACHE_TTL,
  afterMutationInvalidate,
} from '@/lib/cache/redis-client'
import { recordCacheHit, recordCacheMiss } from '@/lib/cache/cache-stats'

const roleSelect = getTableColumns(role)

// Local visibility condition function for role router
const getVisibilityCondition = async (
  ctx: Pick<Context, 'rbac'>
): Promise<ReturnType<typeof sql>> => {
  if (!ctx.rbac) return sql`FALSE`

  if (ctx.rbac.hasGlobalAccess) return sql`TRUE`

  return sql`TRUE`
}

export const insertRoleSchema = z.object({
  name: z.string().min(1).max(100),
  scope: z.enum(scopesEnum.enumValues),
  permissions: z.array(z.enum(permissionEnum.enumValues)).min(1),
})

export const roleRouter = router({
  list: rbacWithColumnAccessProcedure(
    SCOPES.ROLE,
    PERMISSIONS.READ,
    getTableColumnNames(role)
  )
    .input(
      createAdminListSchema(['name', 'scope', 'createdAt']).extend({
        scope: z.enum(scopesEnum.enumValues).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, search, scope, sortBy, sortOrder, columnFilters } =
        input
      const offset = (page - 1) * limit

      const conditions = [excludeDeleted(role)]
      const visibilityCondition = await getVisibilityCondition(ctx)
      conditions.push(visibilityCondition)

      if (search) {
        conditions.push(createLocaleInsensitiveSearch(role.name, search))
      }
      if (scope) {
        conditions.push(eq(role.scope, scope))
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          name: role.name,
          scope: role.scope,
          createdAt: role.createdAt,
        },
        { exactKeys: ['scope'] }
      )

      const orderBy = sortOrder === 'asc' ? asc : desc
      const isValidSortColumn = createColumnValidator(role)
      const sortColumn =
        (isValidSortColumn(sortBy) &&
          roleSelect[sortBy as keyof typeof roleSelect]) ||
        role.createdAt

      const [rolesData, totalCount] = await Promise.all([
        ctx.db
          .select(roleSelect)
          .from(role)
          .where(and(...conditions))
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),

        ctx.db
          .select({ count: count() })
          .from(role)
          .where(and(...conditions)),
      ])

      const roleIds = rolesData.map((r) => r.id).filter(Boolean) as string[]
      type RoleWithCount = (typeof rolesData)[number] & {
        userCount: number
      }
      let roles: RoleWithCount[] = rolesData.map((roleData) => ({
        ...roleData,
        userCount: 0,
        scope: roleData.scope || 'USER',
      }))

      if (roleIds.length > 0) {
        const allUserCounts = await Promise.all(
          roleIds.map(async (roleId) => {
            if (!roleId) return { roleId, count: 0 }
            const result = await ctx.db
              .select({ count: count() })
              .from(userRole)
              .where(and(eq(userRole.roleId, roleId), excludeDeleted(userRole)))
            return { roleId, count: result[0].count }
          })
        )

        roles = rolesData.map((roleData) => {
          const userCountData = allUserCounts.find(
            (uc) => uc.roleId === roleData.id
          )
          return {
            ...roleData,
            userCount: userCountData?.count || 0,
            scope: roleData.scope || 'USER',
          }
        })
      } else {
        roles = rolesData.map((roleData) => ({
          ...roleData,
          userCount: 0,
          scope: roleData.scope || 'USER',
        }))
      }

      return paginatedListResponse(
        roles,
        totalCount[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacWithColumnAccessProcedure(
    SCOPES.ROLE,
    PERMISSIONS.READ,
    getTableColumnNames(role)
  )
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const redis = getRedisClient()
      const cacheKey = CACHE_KEYS.roleById(input.id)

      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          recordCacheHit('entity-details')
          return JSON.parse(cached)
        }
      } catch (cacheError) {
        console.error('Redis cache read error:', cacheError)
      }

      recordCacheMiss('entity-details')

      const visibilityCondition = await getVisibilityCondition(ctx)
      const roleData = await ctx.db
        .select(roleSelect)
        .from(role)
        .where(
          and(eq(role.id, input.id), visibilityCondition, excludeDeleted(role))
        )
        .limit(1)

      if (!roleData.length) {
        throw new Error(RBAC_ERRORS.NOT_FOUND('Role'))
      }

      let userCount = 0
      const userCountResult = await ctx.db
        .select({ count: count() })
        .from(userRole)
        .where(and(eq(userRole.roleId, input.id), excludeDeleted(userRole)))
      userCount = userCountResult[0].count

      const result = {
        ...roleData[0],
        userCount,
      }

      try {
        await redis.setex(cacheKey, CACHE_TTL.LONG, JSON.stringify(result))
      } catch (cacheError) {
        console.error('Redis cache write error:', cacheError)
      }

      return result
    }),

  create: rbacWithColumnAccessProcedure(
    SCOPES.ROLE,
    PERMISSIONS.CREATE,
    getTableColumnNames(role)
  )
    .input(insertRoleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const newRole = await ctx.db.transaction(async (trx) => {
          const [row] = await trx
            .insert(role)
            .values({
              name: input.name,
              scope: input.scope,
              permissions: input.permissions,
            })
            .returning()
          if (!row) {
            throw new Error(RBAC_ERRORS.CREATION_FAILED('Role'))
          }
          return row
        })
        await afterMutationInvalidate(() => invalidateEntityListCache('ROLE'))
        return newRole
      } catch (_error) {
        throw new Error(RBAC_ERRORS.CREATION_FAILED('Role'))
      }
    }),

  update: rbacWithColumnAccessProcedure(
    SCOPES.ROLE,
    PERMISSIONS.UPDATE,
    getTableColumnNames(role)
  )
    .input(insertRoleSchema.partial().extend({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      const visibilityCondition = await getVisibilityCondition(ctx)
      const existing = await ctx.db
        .select()
        .from(role)
        .where(and(eq(role.id, id), visibilityCondition, excludeDeleted(role)))
        .limit(1)

      if (!existing.length) {
        throw new Error(RBAC_ERRORS.NOT_FOUND('Role'))
      }

      const currentRole = existing[0]

      try {
        const updatedRole = await ctx.db.transaction(async (trx) => {
          const roleUpdateData: Partial<typeof role.$inferInsert> = {}

          if (updateData.name !== undefined)
            roleUpdateData.name = updateData.name
          if (updateData.scope !== undefined)
            roleUpdateData.scope = updateData.scope
          if (updateData.permissions !== undefined)
            roleUpdateData.permissions = updateData.permissions

          let next: typeof role.$inferSelect | undefined
          if (Object.keys(roleUpdateData).length > 0) {
            ;[next] = await trx
              .update(role)
              .set(roleUpdateData)
              .where(eq(role.id, id))
              .returning()
          } else {
            next = currentRole
          }

          if (!next) {
            throw new Error(RBAC_ERRORS.NOT_FOUND('Role'))
          }

          return next
        })

        const usersWithRole = await ctx.db
          .select({ userId: userRole.userId })
          .from(userRole)
          .where(eq(userRole.roleId, id))

        await afterMutationInvalidate(async () => {
          await Promise.all(
            usersWithRole.map((u) => invalidateUserCache(u.userId))
          )
        })

        return updatedRole
      } catch (_error) {
        throw new Error(RBAC_ERRORS.UPDATE_FAILED('Role'))
      }
    }),

  delete: rbacWithColumnAccessProcedure(
    SCOPES.ROLE,
    PERMISSIONS.DELETE,
    getTableColumnNames(role)
  )
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const visibilityCondition = await getVisibilityCondition(ctx)
      const existing = await ctx.db
        .select({ id: role.id })
        .from(role)
        .where(
          and(eq(role.id, input.id), visibilityCondition, excludeDeleted(role))
        )
        .limit(1)

      if (!existing.length) {
        throw new Error(RBAC_ERRORS.NOT_FOUND('Role'))
      }

      const usersWithRole = await ctx.db
        .select({ count: count() })
        .from(userRole)
        .where(eq(userRole.roleId, input.id))

      if (usersWithRole[0].count > 0) {
        throw new Error(
          `Bu rol ${usersWithRole[0].count} kullanıcı tarafından kullanılıyor. Önce kullanıcıları bu rolden çıkarın.`
        )
      }

      try {
        await ctx.db
          .update(role)
          .set({ deletedAt: new Date() })
          .where(and(eq(role.id, input.id), excludeDeleted(role)))

        await afterMutationInvalidate(() => invalidateEntityListCache('ROLE'))

        return { success: true }
      } catch (_error) {
        throw new Error(RBAC_ERRORS.DELETION_FAILED('Role'))
      }
    }),
})
