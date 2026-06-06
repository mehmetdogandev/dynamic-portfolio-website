import { Client } from 'pg'

import { createDBURL } from '../database-utils'

/**
 * Drops legacy DB-listener / cross-server sync triggers and functions.
 * Keeps `unaccent` for search if needed.
 */
export async function seed() {
  const dbUrl = createDBURL()

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  console.log('✅ Connected to DB')

  try {
    await client.query('BEGIN')

    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent;')

    await client.query(
      `DROP FUNCTION IF EXISTS public.notify_table_change() CASCADE;`
    )
    await client.query(
      `DROP FUNCTION IF EXISTS public.reset_sync_metadata() CASCADE;`
    )
    console.log(
      '🧹 Dropped notify_table_change / reset_sync_metadata (and dependent triggers)'
    )

    await client.query('COMMIT')
    console.log('✅ Trigger cleanup completed')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error during trigger cleanup:', err)
    throw err
  } finally {
    await client.end()
  }
}
