import { AuthUser } from '../auth'
import { SCOPES, PERMISSIONS } from '../db/schema'
import {
  getRedisClient,
  CACHE_KEYS,
  CACHE_TTL,
  withRedisDeadline,
  registerUserRbacCacheKey,
} from '../cache/redis-client'
import {
  can as canUncached,
  rbac as rbacUncached,
  ensureUserId,
  getAuthDb,
} from './rbac'
import { recordCacheHit, recordCacheMiss } from '../cache/cache-stats'

if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

export const canCached = async (
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
): Promise<boolean> => {
  const redis = getRedisClient()
  const cacheKey = CACHE_KEYS.userPermission(userId, scope, permission)
  try {
    const cached = await withRedisDeadline(redis.get(cacheKey))
    if (cached !== null && cached !== undefined) {
      recordCacheHit('permissions')
      return cached === 'true'
    }
    recordCacheMiss('permissions')
  } catch {
    recordCacheMiss('permissions')
  }

  const hasPermission = await canUncached(userId, scope, permission)
  try {
    await withRedisDeadline(
      redis.setex(cacheKey, CACHE_TTL.MEDIUM, hasPermission.toString())
    )
    void registerUserRbacCacheKey(userId, cacheKey)
  } catch {
    // ignore slow/failed cache write
  }
  return hasPermission
}

export const rbacCached = (
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) => rbacUncached(userId, scope, permission)

export const getUserReadableColumnsCached = async (): Promise<string[]> => []
export const getUserWritableColumnsCached = async (): Promise<string[]> => []

export const getAllEntityIdsCached = async (): Promise<{
  organizationIds: string[]
  locationIds: string[]
  departmentIds: string[]
  groupIds: string[]
  hasGlobalAccess: boolean
}> => ({
  organizationIds: [],
  locationIds: [],
  departmentIds: [],
  groupIds: [],
  hasGlobalAccess: false,
})

export const hasGlobalAccessForScope = async (
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
): Promise<boolean> => {
  return rbacCached(userId, scope, permission).hasGlobalAccess()
}

export { ensureUserId, getAuthDb }
