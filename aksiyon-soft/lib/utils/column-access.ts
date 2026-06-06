import { AuthUser } from '../auth'
import { SCOPES } from '../db/schema'
import { PgTable } from 'drizzle-orm/pg-core'
import type { PgColumn } from 'drizzle-orm/pg-core'

if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

export const getUserReadableColumns = async (
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES
): Promise<string[]> => []

export const getUserWritableColumns = async (
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES
): Promise<string[]> => []

export const createFilteredSelect = async <
  T extends PgTable,
  TColumns = {
    [K in keyof T as T[K] extends PgColumn ? K : never]?: T[K] | undefined
  },
>(
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES,
  availableColumns: string[],
  _hasGlobalAccess: boolean,
  table: T
): Promise<TColumns> => {
  const result: Record<string, PgColumn> = {}
  for (const col of availableColumns) {
    if (col in table) {
      result[col] = table[col as keyof T] as PgColumn
    }
  }
  return result as TColumns
}

export const canWriteToColumns = async (
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES,
  _columns: string[]
): Promise<boolean> => true
