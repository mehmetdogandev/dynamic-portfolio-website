import 'dotenv/config'
import { rewriteComposeInternalHostsForHostShell } from './rewrite-compose-internal-hosts-for-host-shell'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { drizzleLogger } from '../logger'

rewriteComposeInternalHostsForHostShell()

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Use global cache to persist connection pools across hot reloads in Next.js
// This prevents pool recreation on every module reload
declare global {
  var __aksiyonsoftConnectionPools:
    | Map<string, ReturnType<typeof createDbConnection>>
    | undefined
  var __aksiyonsoftPoolInstances: Map<string, Pool> | undefined
}

const DEFAULT_DB_NAME = process.env.POSTGRES_DB || 'aksiyonsoft'

// Single database connection pool.
const connectionPools =
  (
    globalThis as typeof globalThis & {
      __aksiyonsoftConnectionPools?: Map<
        string,
        ReturnType<typeof createDbConnection>
      >
    }
  ).__aksiyonsoftConnectionPools ||
  ((
    globalThis as typeof globalThis & {
      __aksiyonsoftConnectionPools: Map<
        string,
        ReturnType<typeof createDbConnection>
      >
    }
  ).__aksiyonsoftConnectionPools = new Map<
    string,
    ReturnType<typeof createDbConnection>
  >())

// Track pool instances for cleanup
const poolInstances =
  (
    globalThis as typeof globalThis & {
      __aksiyonsoftPoolInstances?: Map<string, Pool>
    }
  ).__aksiyonsoftPoolInstances ||
  ((
    globalThis as typeof globalThis & {
      __aksiyonsoftPoolInstances: Map<string, Pool>
    }
  ).__aksiyonsoftPoolInstances = new Map<string, Pool>())

/**
 * Single-tenant database connection manager.
 */
export function getDbConnection() {
  const dbName = DEFAULT_DB_NAME

  // Return existing pool if available (most common case)
  if (connectionPools.has(dbName)) {
    // Only log when explicitly enabled (to avoid log spam in development)
    if (process.env.DB_LOG_POOL_CREATION === 'true') {
      drizzleLogger.info(
        { dbName, totalPools: connectionPools.size, pid: process.pid },
        'Using cached database connection pool (no new pool created)'
      )
    } else {
      drizzleLogger.debug(
        { dbName, totalPools: connectionPools.size, pid: process.pid },
        'Using cached database connection pool'
      )
    }
    return connectionPools.get(dbName)!
  }

  // Check if we're creating too many pools
  const currentPoolCount = connectionPools.size
  const maxPools = Number(process.env.DB_MAX_POOLS ?? '10')

  if (currentPoolCount >= maxPools) {
    drizzleLogger.warn(
      {
        currentPoolCount,
        maxPools,
        existingPools: Array.from(connectionPools.keys()),
      },
      'Maximum pool count reached for single DB pool'
    )
  }

  const db = createDbConnection()

  // Check again in case another concurrent call already created and cached the pool
  if (connectionPools.has(dbName)) {
    // Another call created it first, use the cached one instead
    if (process.env.DB_LOG_POOL_CREATION === 'true') {
      drizzleLogger.debug(
        { dbName, pid: process.pid },
        'Pool was created concurrently by another call, using cached version'
      )
    }
    return connectionPools.get(dbName)!
  }

  connectionPools.set(dbName, db)

  // Only log when explicitly enabled (to reduce log spam in development)
  if (process.env.DB_LOG_POOL_CREATION === 'true') {
    drizzleLogger.info(
      {
        dbName,
        totalPools: connectionPools.size,
        pid: process.pid,
      },
      'Database connection pool created and cached'
    )
  } else {
    drizzleLogger.debug(
      { dbName, totalPools: connectionPools.size, pid: process.pid },
      'Database connection pool created and cached'
    )
  }

  return db
}

export type AppDatabase = ReturnType<typeof getDbConnection>
export type DbTransaction = Parameters<
  Parameters<AppDatabase['transaction']>[0]
>[0]
/** Pool client veya transaction — aynı Drizzle yüzeyi. */
export type DatabaseOrTransaction = AppDatabase | DbTransaction

export function createDbConnection() {
  const dbName = DEFAULT_DB_NAME
  const dbUrl = process.env.DATABASE_URL!

  // Only log when explicitly enabled (to reduce log spam in development)
  if (process.env.DB_LOG_POOL_CREATION === 'true') {
    drizzleLogger.info(
      { dbName, pid: process.pid },
      'Initializing database connection pool'
    )
  }

  // Development mode: Use smaller pools to reduce memory usage
  // Production mode: Calculate optimal pool size based on available years and max connections
  const isDevelopment = process.env.NODE_ENV === 'development'

  let finalPoolMax: number

  if (isDevelopment) {
    finalPoolMax = Number(process.env.DB_POOL_MAX_PER_YEAR ?? '2')
    finalPoolMax = Math.min(finalPoolMax, 3) // Cap at 3 for development
  } else {
    const maxConnections = Number(process.env.POSTGRES_MAX_CONNECTIONS ?? '100')
    const reservedConnections = Number(
      process.env.DB_RESERVED_CONNECTIONS ?? '20'
    ) // For admin, monitoring, etc.
    const availableConnections = maxConnections - reservedConnections

    const poolFactor = Number(process.env.DB_POOL_CONNECTION_FACTOR ?? '1.5')
    const maxPool = Math.max(
      1, // Minimum 1 connection
      Math.floor(availableConnections / poolFactor)
    )

    // Allow override via environment variable
    const poolMax = Number(
      process.env.DB_POOL_MAX_PER_YEAR ?? maxPool.toString()
    )

    finalPoolMax = Math.min(poolMax, 20)
  }

  // Only log when explicitly enabled (to reduce log spam in development)
  if (process.env.DB_LOG_POOL_CREATION === 'true') {
    drizzleLogger.info(
      {
        dbName,
        poolMax: finalPoolMax,
        pid: process.pid,
      },
      'Configuring single database connection pool parameters'
    )
  } else {
    drizzleLogger.debug(
      { dbName, poolMax: finalPoolMax, pid: process.pid },
      'Configuring connection pool parameters'
    )
  }

  // Append query timeout to connection string if not already present
  const urlWithTimeout = dbUrl.includes('?')
    ? `${dbUrl}&statement_timeout=30000`
    : `${dbUrl}?statement_timeout=30000`

  // Development: Faster idle timeout to free connections quickly
  // Production: Longer timeout for better connection reuse
  const idleTimeout = isDevelopment
    ? Number(process.env.DB_POOL_IDLE_TIMEOUT ?? '3000') // 3 seconds in dev
    : 10000 // 10 seconds in production

  const pool = new Pool({
    connectionString: urlWithTimeout,
    max: finalPoolMax,
    min: 0, // Don't keep idle connections
    idleTimeoutMillis: idleTimeout,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true, // Allow Node.js to exit when pool is idle
  })

  // Store pool instance for cleanup
  poolInstances.set(dbName, pool)

  // Log pool events (only errors in development to reduce log spam)
  pool.on('error', (err) => {
    drizzleLogger.error({ err, dbName }, 'Database pool error')
  })

  // Only log connection events in production or when explicitly enabled
  if (!isDevelopment || process.env.DB_LOG_POOL_EVENTS === 'true') {
    pool.on('connect', () => {
      drizzleLogger.debug(
        {
          dbName,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
        },
        'Database connection acquired'
      )
    })

    pool.on('remove', () => {
      drizzleLogger.debug(
        {
          dbName,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
        },
        'Database connection removed'
      )
    })
  }

  // Disable query logging in development by default (major performance impact).
  // Set DB_ENABLE_QUERY_LOGGING=true in .env temporarily to capture full SQL + params (e.g. support_ticket insert debugging), then turn off.
  const enableQueryLogging = process.env.DB_ENABLE_QUERY_LOGGING === 'true'

  const db = drizzle(pool, {
    schema,
    logger: enableQueryLogging
      ? {
          logQuery(query: string, params: unknown[]) {
            drizzleLogger.info({ query, params, dbName }, 'SQL Query')
          },
        }
      : false, // Disabled by default for performance
  })

  return db
}

export function createDBURL() {
  return process.env.DATABASE_URL!
}

export async function closeDbConnection() {
  const dbName = DEFAULT_DB_NAME
  const pool = poolInstances.get(dbName)

  if (pool) {
    try {
      await pool.end()
      drizzleLogger.info({ dbName }, 'Database pool closed')
    } catch (error) {
      drizzleLogger.error({ error, dbName }, 'Error closing database pool')
    } finally {
      poolInstances.delete(dbName)
      connectionPools.delete(dbName)
    }
  }
}

/**
 * Close all database connections.
 * Useful for cleanup after seeding or testing.
 */
export async function closeAllConnections() {
  if (connectionPools.has(DEFAULT_DB_NAME)) {
    await closeDbConnection()
  }
}

/**
 * Default database connection for backwards compatibility.
 *
 * This connection is created once at module load time and reused.
 */
export const db = getDbConnection()
