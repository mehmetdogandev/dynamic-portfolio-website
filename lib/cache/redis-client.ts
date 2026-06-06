/**
 * Redis Client Configuration for RBAC Caching
 *
 * Invalidation is bounded (REDIS_INVALIDATION_TIMEOUT_MS), uses UNLINK where possible,
 * and prefers key indexes over full SCAN for per-user RBAC keys.
 */

import Redis from 'ioredis'
import { cacheLogger } from '../logger'

if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

let redisClient: Redis | null = null

const parsedRedisCommandMs = Number(
  process.env.REDIS_COMMAND_TIMEOUT_MS ?? '220'
)
export const REDIS_COMMAND_TIMEOUT_MS =
  Number.isFinite(parsedRedisCommandMs) && parsedRedisCommandMs > 0
    ? parsedRedisCommandMs
    : 220

const parsedInvalidationMs = Number(
  process.env.REDIS_INVALIDATION_TIMEOUT_MS ?? '8000'
)
export const REDIS_INVALIDATION_TIMEOUT_MS =
  Number.isFinite(parsedInvalidationMs) && parsedInvalidationMs > 0
    ? parsedInvalidationMs
    : 8000

const parsedRedisDb = Number.parseInt(process.env.REDIS_DB ?? '0', 10)
const REDIS_DB =
  Number.isFinite(parsedRedisDb) && parsedRedisDb >= 0 ? parsedRedisDb : 0

/**
 * Bound how long we wait on Redis; on timeout or failure callers should fall back to DB / uncached paths.
 */
export function withRedisDeadline<T>(
  promise: Promise<T>,
  ms: number = REDIS_COMMAND_TIMEOUT_MS
): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return promise
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('REDIS_DEADLINE'))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/** SET of rbac:user:${userId}:* cache keys (excludes this set key from membership). */
export function rbacUserKeyIndex(userId: string): string {
  return `rbac:index:user:${userId}`
}

export async function registerUserRbacCacheKey(
  userId: string,
  key: string
): Promise<void> {
  const prefix = `rbac:user:${userId}:`
  if (!key.startsWith(prefix)) return
  const indexKey = rbacUserKeyIndex(userId)
  if (key === indexKey) return
  try {
    const redis = getRedisClient()
    await withRedisDeadline(redis.sadd(indexKey, key))
  } catch {
    // ignore — cache still works; invalidation may rely on TTL for unindexed keys
  }
}

async function batchUnlink(redis: Redis, keys: string[]): Promise<void> {
  if (keys.length === 0) return
  for (let i = 0; i < keys.length; i += 500) {
    const batch = keys.slice(i, i + 500)
    await redis.unlink(...batch)
  }
}

/**
 * Run invalidation work with a hard deadline; logs at warn on timeout/failure.
 */
export async function runRedisInvalidation<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T | undefined> {
  const logMs = process.env.REDIS_LOG_INVALIDATION_MS === 'true'
  const t0 = logMs ? performance.now() : 0
  try {
    const result = await withRedisDeadline(fn(), REDIS_INVALIDATION_TIMEOUT_MS)
    if (logMs) {
      cacheLogger.info(
        { label, ms: Math.round(performance.now() - t0) },
        'Redis invalidation completed'
      )
    }
    return result
  } catch (e) {
    cacheLogger.warn(
      { label, err: e instanceof Error ? e.message : String(e) },
      'Redis invalidation skipped or timed out'
    )
    return undefined
  }
}

/**
 * After SQL commit: await invalidation, or fire-and-forget when REDIS_INVALIDATION_ASYNC=true.
 */
export async function afterMutationInvalidate(
  fn: () => Promise<void>
): Promise<void> {
  if (process.env.REDIS_INVALIDATION_ASYNC === 'true') {
    setImmediate(() => {
      void fn().catch((e) =>
        cacheLogger.debug(
          { err: e instanceof Error ? e.message : String(e) },
          'async Redis invalidation failed'
        )
      )
    })
    return
  }
  await fn()
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
      throw new Error(
        'REDIS_HOST and REDIS_PORT must be set in environment variables'
      )
    }
    const isDevelopment = process.env.NODE_ENV === 'development'

    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_PASSWORD,
      db: REDIS_DB,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: isDevelopment,
      ...(isDevelopment && {
        connectTimeout: 5000,
        keepAlive: 30000,
      }),
    })

    redisClient.on('connect', () => {})
    redisClient.on('ready', () => {})
    redisClient.on('error', (_err: Error) => {})
    redisClient.on('close', () => {})
    redisClient.on('reconnecting', () => {})
  }

  return redisClient
}

export const CACHE_KEYS = {
  userPermission: (userId: string, scope: string, permission: string) =>
    `rbac:user:${userId}:can:${scope}:${permission}`,

  userRoles: (userId: string) => `rbac:user:${userId}:roles`,

  userEntities: (userId: string, scope: string, permission: string) =>
    `rbac:user:${userId}:entities:${scope}:${permission}`,

  globalAccess: (userId: string, scope: string, permission: string) =>
    `rbac:user:${userId}:global:${scope}:${permission}`,

  columnPermissions: (userId: string, scope: string, type: 'read' | 'write') =>
    `rbac:user:${userId}:columns:${scope}:${type}`,

  navigationPermissions: (userId: string) => `rbac:user:${userId}:nav`,

  userMapping: (userId: string) => `rbac:user:${userId}:mapping`,

  /** Logical generation for entity list caches under this scope (O(1) invalidation). */
  entityListGeneration: (scope: string) => `cache:entity:gen:${scope}`,

  availableYears: () => `cache:available-years`,

  hierarchyTree: (userId: string) => `cache:hierarchy:user:${userId}:tree`,

  hierarchyMembers: (type: string, id: string) =>
    `cache:hierarchy:${type}:${id}:members`,

  organizationalChart: (type: string, id: string) =>
    `cache:hierarchy:${type}:${id}:chart`,

  entityList: (
    userId: string,
    scope: string,
    params: Record<string, unknown>
  ) => `cache:entity:user:${userId}:${scope}:list:${hashParams(params)}`,

  entityById: (scope: string, id: string) => `cache:entity:${scope}:id:${id}`,

  entitySelect: (userId: string, scope: string) =>
    `cache:entity:user:${userId}:${scope}:select`,

  entityAll: (
    userId: string,
    scope: string,
    params?: Record<string, unknown>
  ) =>
    `cache:entity:user:${userId}:${scope}:all:${params ? hashParams(params) : 'default'}`,

  columnDefinitions: () => `cache:column-definitions`,

  columnNames: (scope: string) => `cache:column-names:${scope}`,

  allColumnNames: () => `cache:all-column-names`,

  userAssignments: (userId: string) => `cache:user:${userId}:assignments`,

  userRoleGroups: (userId: string) => `cache:user:${userId}:role-groups`,

  roleList: (params: Record<string, unknown>) =>
    `cache:role:list:${hashParams(params)}`,

  roleById: (id: string) => `cache:role:id:${id}`,

  userList: (params: Record<string, unknown>) =>
    `cache:user:list:${hashParams(params)}`,

  userById: (id: string) => `cache:user:id:${id}`,
}

function hashParams(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key]
        return acc
      },
      {} as Record<string, unknown>
    )

  return Buffer.from(JSON.stringify(sorted)).toString('base64').substring(0, 16)
}

export const CACHE_TTL = {
  SHORT: 60 * 5,
  MEDIUM: 60 * 15,
  LONG: 60 * 60,
  VERY_LONG: 60 * 60 * 24,
} as const

/**
 * Invalidate RBAC permission caches for a user (not user-mapping).
 * Uses key index (SADD on write) + UNLINK; falls back to bounded SCAN for legacy keys.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await runRedisInvalidation('invalidateUserCache', async () => {
    const redis = getRedisClient()
    const indexKey = rbacUserKeyIndex(userId)
    const indexed = await redis.smembers(indexKey)
    const extraKeys = [
      CACHE_KEYS.userRoleGroups(userId),
      CACHE_KEYS.userAssignments(userId),
    ]
    const fromIndex = [...new Set([...indexed, ...extraKeys])]
    if (fromIndex.length > 0) {
      await batchUnlink(redis, fromIndex)
    }
    await redis.unlink(indexKey).catch(() => {})
    // Legacy keys without index entry expire via TTL; avoiding full-keyspace SCAN here.
  })
}

export async function invalidateUserMappingCache(
  userId: string
): Promise<void> {
  await runRedisInvalidation('invalidateUserMappingCache', async () => {
    const redis = getRedisClient()
    await redis.unlink(CACHE_KEYS.userMapping(userId))
  })
}

export async function invalidateAvailableYearsCache(): Promise<void> {
  await runRedisInvalidation('invalidateAvailableYearsCache', async () => {
    const redis = getRedisClient()
    await redis.unlink(CACHE_KEYS.availableYears())
  })
}

export async function invalidateAllRBACCache(): Promise<void> {
  await runRedisInvalidation('invalidateAllRBACCache', async () => {
    const redis = getRedisClient()
    const keysToDelete: string[] = []
    const stream = redis.scanStream({
      match: 'rbac:*',
      count: 200,
    })
    stream.on('data', (keys: string[]) => {
      keysToDelete.push(...keys)
    })
    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })
    const unique = [...new Set(keysToDelete)]
    if (unique.length > 0) {
      await batchUnlink(redis, unique)
    }
  })
}

export async function invalidateEntityCache(
  scope: string,
  entityId: string
): Promise<void> {
  await runRedisInvalidation(`invalidateEntityCache:${scope}`, async () => {
    const redis = getRedisClient()
    await redis.unlink(CACHE_KEYS.entityById(scope, entityId))
    cacheLogger.info(
      { scope, entityId },
      `Cache invalidated for ${scope} entity ${entityId}`
    )
  })
}

/**
 * Bump logical generation for this scope (O(1)). Future list caches should embed generation in keys.
 * Legacy SCAN removed — no entity list keys were written elsewhere in the codebase at refactor time.
 */
export async function invalidateEntityListCache(scope: string): Promise<void> {
  await runRedisInvalidation(`invalidateEntityListCache:${scope}`, async () => {
    const redis = getRedisClient()
    await redis.incr(CACHE_KEYS.entityListGeneration(scope))
    cacheLogger.info(
      { scope },
      `Entity list generation bumped for scope ${scope}`
    )
  })
}

export async function invalidateHierarchyCache(userId: string): Promise<void> {
  await runRedisInvalidation('invalidateHierarchyCache', async () => {
    const redis = getRedisClient()
    const keysToDelete: string[] = [CACHE_KEYS.hierarchyTree(userId)]
    const stream = redis.scanStream({
      match: `cache:hierarchy:user:${userId}:*`,
      count: 100,
    })
    stream.on('data', (keys: string[]) => {
      keysToDelete.push(...keys)
    })
    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })
    const unique = [...new Set(keysToDelete)]
    if (unique.length > 0) {
      await batchUnlink(redis, unique)
      cacheLogger.info(
        { userId, count: unique.length },
        'Hierarchy cache invalidated'
      )
    }
  })
}

export async function invalidateRelatedCaches(
  scope: string,
  entityId: string
): Promise<void> {
  await Promise.all([
    invalidateEntityCache(scope, entityId),
    invalidateEntityListCache(scope),
  ])
}

export async function invalidateUserAssignmentsCache(
  userId: string
): Promise<void> {
  await runRedisInvalidation('invalidateUserAssignmentsCache', async () => {
    const redis = getRedisClient()
    await redis.unlink(CACHE_KEYS.userAssignments(userId))
    cacheLogger.info({ userId }, 'User assignments cache invalidated')
  })
}

export async function invalidateAllUsersWithScope(
  scope: string
): Promise<void> {
  await runRedisInvalidation(
    `invalidateAllUsersWithScope:${scope}`,
    async () => {
      const redis = getRedisClient()
      const keysToDelete: string[] = []
      const stream = redis.scanStream({
        match: `rbac:user:*:can:${scope}:*`,
        count: 200,
      })
      stream.on('data', (keys: string[]) => {
        keysToDelete.push(...keys)
      })
      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve())
        stream.on('error', reject)
      })
      if (keysToDelete.length > 0) {
        await batchUnlink(redis, [...new Set(keysToDelete)])
        cacheLogger.info(
          { scope, count: keysToDelete.length },
          `Invalidated all user caches for scope ${scope}`
        )
      }
    }
  )
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
      redisClient = null
    } catch (_error) {}
  }
}
