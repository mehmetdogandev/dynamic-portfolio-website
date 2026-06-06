import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDbConnection } from '../db/database-utils'
import * as schema from '../db/schema'

/**
 * Drizzle adapter for Better Auth.
 *
 * Creates year-specific auth adapters that connect to the appropriate
 *
 * @returns Drizzle adapter
 */
export function createAuthAdapter() {
  const db = getDbConnection()

  return drizzleAdapter(db, {
    provider: 'pg' as const,
    schema,
  })
}
