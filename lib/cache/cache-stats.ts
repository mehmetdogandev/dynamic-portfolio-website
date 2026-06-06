/**
 * RBAC Cache Monitoring and Statistics
 *
 * Optional Redis counters (CACHE_METRICS_ENABLED). Uses cacheLogger — not Drizzle ORM telemetry.
 */

if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

import { cacheLogger } from '../logger'
import { getRedisClient, withRedisDeadline } from './redis-client'

const METRICS_ENABLED = process.env.CACHE_METRICS_ENABLED !== 'false'

const CIRCUIT_FAIL_THRESHOLD = 5
const CIRCUIT_OPEN_MS = 60_000
let consecutiveMetricFailures = 0
let circuitOpenUntil = 0
let circuitWarned = false

function metricsCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil
}

function recordMetricFailure(): void {
  consecutiveMetricFailures += 1
  if (consecutiveMetricFailures >= CIRCUIT_FAIL_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS
    consecutiveMetricFailures = 0
    if (!circuitWarned) {
      circuitWarned = true
      cacheLogger.warn(
        {},
        'Redis cache metrics circuit open (60s); set CACHE_METRICS_ENABLED=false to disable'
      )
    }
  }
}

function recordMetricSuccess(): void {
  consecutiveMetricFailures = 0
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
}

interface CacheMetrics {
  permissions: CacheStats
  entities: CacheStats
  columns: CacheStats
  userMapping: CacheStats
  availableYears: CacheStats
  hierarchy: CacheStats
  entityLists: CacheStats
  entityDetails: CacheStats
  dropdownLists: CacheStats
  overall: CacheStats
}

const METRICS_KEYS = {
  permissions_hits: 'cache:metrics:permissions:hits',
  permissions_misses: 'cache:metrics:permissions:misses',
  entities_hits: 'cache:metrics:entities:hits',
  entities_misses: 'cache:metrics:entities:misses',
  columns_hits: 'cache:metrics:columns:hits',
  columns_misses: 'cache:metrics:columns:misses',
  user_mapping_hits: 'cache:metrics:user-mapping:hits',
  user_mapping_misses: 'cache:metrics:user-mapping:misses',
  available_years_hits: 'cache:metrics:available-years:hits',
  available_years_misses: 'cache:metrics:available-years:misses',
  hierarchy_hits: 'cache:metrics:hierarchy:hits',
  hierarchy_misses: 'cache:metrics:hierarchy:misses',
  entity_lists_hits: 'cache:metrics:entity-lists:hits',
  entity_lists_misses: 'cache:metrics:entity-lists:misses',
  entity_details_hits: 'cache:metrics:entity-details:hits',
  entity_details_misses: 'cache:metrics:entity-details:misses',
  dropdown_lists_hits: 'cache:metrics:dropdown-lists:hits',
  dropdown_lists_misses: 'cache:metrics:dropdown-lists:misses',
}

async function incrementMetric(key: string): Promise<void> {
  if (!METRICS_ENABLED || metricsCircuitOpen()) return
  try {
    const redis = getRedisClient()
    await withRedisDeadline(redis.incr(key))
    recordMetricSuccess()
  } catch (error) {
    recordMetricFailure()
    cacheLogger.debug(
      { key, err: error instanceof Error ? error.message : String(error) },
      'Redis cache metric increment failed'
    )
  }
}

async function getMetric(key: string): Promise<number> {
  if (!METRICS_ENABLED) return 0
  try {
    const redis = getRedisClient()
    const value = await withRedisDeadline(redis.get(key))
    return value ? parseInt(value, 10) : 0
  } catch (error) {
    cacheLogger.debug(
      { key, err: error instanceof Error ? error.message : String(error) },
      'Redis cache metric read failed'
    )
    return 0
  }
}

export function recordCacheHit(
  type:
    | 'permissions'
    | 'entities'
    | 'columns'
    | 'user-mapping'
    | 'available-years'
    | 'hierarchy'
    | 'entity-lists'
    | 'entity-details'
    | 'dropdown-lists'
): void {
  if (!METRICS_ENABLED) return
  const key = `cache:metrics:${type}:hits`
  void incrementMetric(key)
}

export function recordCacheMiss(
  type:
    | 'permissions'
    | 'entities'
    | 'columns'
    | 'user-mapping'
    | 'available-years'
    | 'hierarchy'
    | 'entity-lists'
    | 'entity-details'
    | 'dropdown-lists'
): void {
  if (!METRICS_ENABLED) return
  const key = `cache:metrics:${type}:misses`
  void incrementMetric(key)
}

function calculateStats(hits: number, misses: number): CacheStats {
  const total = hits + misses
  return {
    hits,
    misses,
    hitRate: total > 0 ? (hits / total) * 100 : 0,
    totalRequests: total,
  }
}

export async function getCacheMetrics(): Promise<CacheMetrics> {
  const [
    permissionsHits,
    permissionsMisses,
    entitiesHits,
    entitiesMisses,
    columnsHits,
    columnsMisses,
    userMappingHits,
    userMappingMisses,
    availableYearsHits,
    availableYearsMisses,
    hierarchyHits,
    hierarchyMisses,
    entityListsHits,
    entityListsMisses,
    entityDetailsHits,
    entityDetailsMisses,
    dropdownListsHits,
    dropdownListsMisses,
  ] = await Promise.all([
    getMetric(METRICS_KEYS.permissions_hits),
    getMetric(METRICS_KEYS.permissions_misses),
    getMetric(METRICS_KEYS.entities_hits),
    getMetric(METRICS_KEYS.entities_misses),
    getMetric(METRICS_KEYS.columns_hits),
    getMetric(METRICS_KEYS.columns_misses),
    getMetric(METRICS_KEYS.user_mapping_hits),
    getMetric(METRICS_KEYS.user_mapping_misses),
    getMetric(METRICS_KEYS.available_years_hits),
    getMetric(METRICS_KEYS.available_years_misses),
    getMetric(METRICS_KEYS.hierarchy_hits),
    getMetric(METRICS_KEYS.hierarchy_misses),
    getMetric(METRICS_KEYS.entity_lists_hits),
    getMetric(METRICS_KEYS.entity_lists_misses),
    getMetric(METRICS_KEYS.entity_details_hits),
    getMetric(METRICS_KEYS.entity_details_misses),
    getMetric(METRICS_KEYS.dropdown_lists_hits),
    getMetric(METRICS_KEYS.dropdown_lists_misses),
  ])

  const permissionsStats = calculateStats(permissionsHits, permissionsMisses)
  const entitiesStats = calculateStats(entitiesHits, entitiesMisses)
  const columnsStats = calculateStats(columnsHits, columnsMisses)
  const userMappingStats = calculateStats(userMappingHits, userMappingMisses)
  const availableYearsStats = calculateStats(
    availableYearsHits,
    availableYearsMisses
  )
  const hierarchyStats = calculateStats(hierarchyHits, hierarchyMisses)
  const entityListsStats = calculateStats(entityListsHits, entityListsMisses)
  const entityDetailsStats = calculateStats(
    entityDetailsHits,
    entityDetailsMisses
  )
  const dropdownListsStats = calculateStats(
    dropdownListsHits,
    dropdownListsMisses
  )

  const totalHits =
    permissionsHits +
    entitiesHits +
    columnsHits +
    userMappingHits +
    availableYearsHits +
    hierarchyHits +
    entityListsHits +
    entityDetailsHits +
    dropdownListsHits
  const totalMisses =
    permissionsMisses +
    entitiesMisses +
    columnsMisses +
    userMappingMisses +
    availableYearsMisses +
    hierarchyMisses +
    entityListsMisses +
    entityDetailsMisses +
    dropdownListsMisses
  const overallStats = calculateStats(totalHits, totalMisses)

  return {
    permissions: permissionsStats,
    entities: entitiesStats,
    columns: columnsStats,
    userMapping: userMappingStats,
    availableYears: availableYearsStats,
    hierarchy: hierarchyStats,
    entityLists: entityListsStats,
    entityDetails: entityDetailsStats,
    dropdownLists: dropdownListsStats,
    overall: overallStats,
  }
}

export async function resetCacheStats(): Promise<void> {
  if (!METRICS_ENABLED) return
  try {
    const redis = getRedisClient()
    await Promise.all([
      redis.del(METRICS_KEYS.permissions_hits),
      redis.del(METRICS_KEYS.permissions_misses),
      redis.del(METRICS_KEYS.entities_hits),
      redis.del(METRICS_KEYS.entities_misses),
      redis.del(METRICS_KEYS.columns_hits),
      redis.del(METRICS_KEYS.columns_misses),
      redis.del(METRICS_KEYS.user_mapping_hits),
      redis.del(METRICS_KEYS.user_mapping_misses),
      redis.del(METRICS_KEYS.available_years_hits),
      redis.del(METRICS_KEYS.available_years_misses),
      redis.del(METRICS_KEYS.hierarchy_hits),
      redis.del(METRICS_KEYS.hierarchy_misses),
      redis.del(METRICS_KEYS.entity_lists_hits),
      redis.del(METRICS_KEYS.entity_lists_misses),
      redis.del(METRICS_KEYS.entity_details_hits),
      redis.del(METRICS_KEYS.entity_details_misses),
      redis.del(METRICS_KEYS.dropdown_lists_hits),
      redis.del(METRICS_KEYS.dropdown_lists_misses),
    ])
  } catch (error) {
    cacheLogger.warn(
      { err: error instanceof Error ? error.message : String(error) },
      'Failed to reset cache stats'
    )
  }
}

export function formatCacheMetrics(metrics: CacheMetrics): string {
  return `
Cache Metrics:
--------------
Overall: ${metrics.overall.hits} hits, ${metrics.overall.misses} misses (${metrics.overall.hitRate.toFixed(2)}% hit rate)

Permissions: ${metrics.permissions.hits} hits, ${metrics.permissions.misses} misses (${metrics.permissions.hitRate.toFixed(2)}% hit rate)
Entities: ${metrics.entities.hits} hits, ${metrics.entities.misses} misses (${metrics.entities.hitRate.toFixed(2)}% hit rate)
Columns: ${metrics.columns.hits} hits, ${metrics.columns.misses} misses (${metrics.columns.hitRate.toFixed(2)}% hit rate)
User Mapping: ${metrics.userMapping.hits} hits, ${metrics.userMapping.misses} misses (${metrics.userMapping.hitRate.toFixed(2)}% hit rate)
Available Years: ${metrics.availableYears.hits} hits, ${metrics.availableYears.misses} misses (${metrics.availableYears.hitRate.toFixed(2)}% hit rate)
Hierarchy: ${metrics.hierarchy.hits} hits, ${metrics.hierarchy.misses} misses (${metrics.hierarchy.hitRate.toFixed(2)}% hit rate)
Entity Lists: ${metrics.entityLists.hits} hits, ${metrics.entityLists.misses} misses (${metrics.entityLists.hitRate.toFixed(2)}% hit rate)
Entity Details: ${metrics.entityDetails.hits} hits, ${metrics.entityDetails.misses} misses (${metrics.entityDetails.hitRate.toFixed(2)}% hit rate)
Dropdown Lists: ${metrics.dropdownLists.hits} hits, ${metrics.dropdownLists.misses} misses (${metrics.dropdownLists.hitRate.toFixed(2)}% hit rate)
  `.trim()
}
