import { protectedProcedure, router } from '..'
import { z } from 'zod'
import {
  canCached as can,
  rbacCached as rbac,
  getAllEntityIdsCached,
} from '../../utils/rbac-cached'
import { getNavigationAccessForUser } from '../../utils/rbac'
import { getDbConnection } from '../../db'
import {
  role,
  userRole,
  permissionEnum,
  scopesEnum,
  roleGroup,
  userRoleGroup,
  session,
  type NavigationAccessByScope,
} from '../../db/schema'
import { eq } from 'drizzle-orm'
import {
  getRedisClient,
  CACHE_KEYS,
  CACHE_TTL,
  withRedisDeadline,
  registerUserRbacCacheKey,
} from '../../cache/redis-client'
import { recordCacheHit, recordCacheMiss } from '../../cache/cache-stats'

const getAuthDb = () => getDbConnection()

export const authRouter = router({
  // check if user has a specific permission in a scope
  hasPermission: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopesEnum.enumValues),
        permission: z.enum(permissionEnum.enumValues),
      })
    )
    .query(async ({ ctx, input }) => {
      return await can(ctx.session.user.id, input.scope, input.permission)
    }),

  // Get user's roles
  getUserRoles: protectedProcedure.query(async ({ ctx }) => {
    const authDb = getAuthDb()
    const userRoles = await authDb
      .select({
        id: role.id,
        name: role.name,
        scope: role.scope,
        permissions: role.permissions,
      })
      .from(userRole)
      .where(eq(userRole.userId, ctx.session.user.id))
      .leftJoin(role, eq(userRole.roleId, role.id))

    return userRoles.filter((r: { name: string | null }) => r.name !== null)
  }),

  // Navigation ACCESS flags for every DB scope (`scopesEnum`).
  getNavigationPermissions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const redis = getRedisClient()
    const navKey = CACHE_KEYS.navigationPermissions(userId)
    const accessPerm = ctx.PERMISSIONS.ACCESS
    try {
      const cached = await withRedisDeadline(redis.get(navKey))
      if (cached !== null && cached !== undefined) {
        recordCacheHit('permissions')
        return JSON.parse(cached) as NavigationAccessByScope
      }
      recordCacheMiss('permissions')
    } catch {
      recordCacheMiss('permissions')
    }

    const result = await getNavigationAccessForUser(userId)

    try {
      await withRedisDeadline(
        redis.setex(navKey, CACHE_TTL.MEDIUM, JSON.stringify(result))
      )
      void registerUserRbacCacheKey(userId, navKey)
    } catch {
      // ignore cache write errors / deadline
    }

    try {
      const pipe = redis.pipeline()
      for (const scope of scopesEnum.enumValues) {
        pipe.setex(
          CACHE_KEYS.userPermission(userId, scope, accessPerm),
          CACHE_TTL.MEDIUM,
          result[scope] ? 'true' : 'false'
        )
      }
      await withRedisDeadline(pipe.exec())
      for (const scope of scopesEnum.enumValues) {
        void registerUserRbacCacheKey(
          userId,
          CACHE_KEYS.userPermission(userId, scope, accessPerm)
        )
      }
    } catch {
      // optional warm; ignore
    }

    return result
  }),

  // Get active sessions for the current user
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.auth.api.listSessions({
      headers: ctx.headers,
    })

    const currentSessionId = ctx.session.session?.id ?? null

    return sessions.map((session) => ({
      id: session.id,
      token: session.token,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      isCurrent: session.id === currentSessionId,
    }))
  }),

  // Get active sessions with device info (MAC, local IP, global IP)
  getSessionsWithDeviceInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get sessions from the database to include device info
    const dbSessions = await ctx.db
      .select({
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        macAddress: session.macAddress,
        deviceLocalIp: session.deviceLocalIp,
        deviceGlobalIp: session.deviceGlobalIp,
      })
      .from(session)
      .where(eq(session.userId, userId))

    const currentSessionId = ctx.session.session?.id ?? null

    return dbSessions.map((sess) => ({
      id: sess.id,
      token: sess.token,
      createdAt: sess.createdAt,
      updatedAt: sess.updatedAt,
      expiresAt: sess.expiresAt,
      ipAddress: sess.ipAddress ?? null,
      userAgent: sess.userAgent ?? null,
      macAddress: sess.macAddress ?? null,
      deviceLocalIp: sess.deviceLocalIp ?? null,
      deviceGlobalIp: sess.deviceGlobalIp ?? null,
      isCurrent: sess.id === currentSessionId,
    }))
  }),

  // Revoke a specific session using the auth API
  revokeSession: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Session token is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.auth.api.revokeSession({
        headers: ctx.headers,
        body: {
          token: input.token,
        },
      })

      return { success: true }
    }),

  // Change password for the current user using Better Auth API
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
        newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
        revokeOtherSessions: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.auth.api.changePassword({
        headers: ctx.headers,
        body: {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: input.revokeOtherSessions ?? true,
        },
      })

      return { success: true }
    }),

  // Get user's role groups (new RBAC system)
  getUserRoleGroups: protectedProcedure.query(async ({ ctx }) => {
    // Try cache first
    const redis = getRedisClient()
    const cacheKey = CACHE_KEYS.userRoleGroups(ctx.session.user.id)

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

    const userRoleGroups = await ctx.db
      .select({
        id: roleGroup.id,
        title: roleGroup.title,
        description: roleGroup.description,
        createdAt: roleGroup.createdAt,
        updatedAt: roleGroup.updatedAt,
      })
      .from(userRoleGroup)
      .where(eq(userRoleGroup.userId, ctx.session.user.id))
      .innerJoin(roleGroup, eq(userRoleGroup.roleGroupId, roleGroup.id))

    // Cache with MEDIUM TTL
    try {
      await redis.setex(
        cacheKey,
        CACHE_TTL.MEDIUM,
        JSON.stringify(userRoleGroups)
      )
    } catch (cacheError) {
      console.error('Redis cache write error:', cacheError)
    }

    return userRoleGroups
  }),

  // Get accessible entity IDs for a specific scope and permission
  getAccessibleEntities: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopesEnum.enumValues),
        permission: z.enum(permissionEnum.enumValues),
      })
    )
    .query(async () => getAllEntityIdsCached()),

  // Check if user has global access for a scope and permission
  hasGlobalAccess: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopesEnum.enumValues),
        permission: z.enum(permissionEnum.enumValues),
      })
    )
    .query(async ({ ctx, input }) => {
      const rbacHelper = rbac(
        ctx.session.user.id,
        input.scope,
        input.permission
      )
      return await rbacHelper.hasGlobalAccess()
    }),

  // Get readable columns for a scope
  getReadableColumns: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopesEnum.enumValues),
      })
    )
    .query(async () => [] as string[]),

  // Get writable columns for a scope
  getWritableColumns: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopesEnum.enumValues),
      })
    )
    .query(async () => [] as string[]),

  // Check multiple permissions at once
  checkMultiplePermissions: protectedProcedure
    .input(
      z.object({
        permissions: z.array(
          z.object({
            scope: z.enum(scopesEnum.enumValues),
            permission: z.enum(permissionEnum.enumValues),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.permissions.map(async ({ scope, permission }) => ({
          scope,
          permission,
          hasPermission: await can(ctx.session.user.id, scope, permission),
        }))
      )

      return results.reduce(
        (acc, result) => {
          const key = `${result.scope}.${result.permission}`
          acc[key] = result.hasPermission
          return acc
        },
        {} as Record<string, boolean>
      )
    }),
})

export type NavigationPermissions = Awaited<
  ReturnType<typeof authRouter.getNavigationPermissions>
>
