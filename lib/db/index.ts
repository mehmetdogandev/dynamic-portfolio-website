/**
 * Database connection exports for single DB ERP system.
 */

import { getDbConnection } from './database-utils'

export {
  getDbConnection,
  closeDbConnection,
  closeAllConnections,
  createDBURL,
  db,
} from './database-utils'

export type DB = ReturnType<typeof getDbConnection>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TX = Parameters<DB['transaction']>[0] extends (tx: infer T) => any
  ? T
  : never

// Re-export schema for convenience
export * from './schema'
