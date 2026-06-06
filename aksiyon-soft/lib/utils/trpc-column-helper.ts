import { TRPCError } from '@trpc/server'
import { AuthUser } from '../auth'
import { SCOPES } from '../db/schema'
import {
  createFilteredSelect,
  getUserReadableColumns,
  canWriteToColumns,
} from './column-access'
// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
import { PgTable } from 'drizzle-orm/pg-core/table'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * tRPC helper for creating column-filtered procedures
 * This helper ensures users only see and can modify columns they have permission for
 */
export const createColumnFilteredHelper = (
  scope: keyof typeof SCOPES,
  availableColumns: string[]
) => {
  return {
    /**
     * Creates a filtered select object for the current user
     * Only includes columns the user has read access to
     * Returns a Partial type since not all columns may be accessible based on permissions
     */
    getFilteredSelect: <
      T extends PgTable,
      TColumns = {
        [K in keyof T as T[K] extends PgColumn ? K : never]?: T[K] | undefined
      },
    >(
      userId: AuthUser['id'],
      hasGlobalAccess: boolean,
      table: T
    ): Promise<TColumns> => {
      return createFilteredSelect(
        userId,
        scope,
        availableColumns,
        hasGlobalAccess,
        table
      )
    },

    /**
     * Gets all readable column names for the current user
     */
    getReadableColumns: async (userId: AuthUser['id']): Promise<string[]> => {
      return getUserReadableColumns(userId, scope)
    },

    validateReadAccess: async (
      userId: AuthUser['id'],
      columns: string[],
      hasGlobalAccess: boolean
    ): Promise<void> => {
      if (hasGlobalAccess) return // Skip checks if user has global access
      const readableColumns = await getUserReadableColumns(userId, scope)
      const unauthorizedColumns = columns.filter(
        (col) => !readableColumns.includes(col)
      )
      if (unauthorizedColumns.length > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Bu alanları görüntüleme yetkiniz yok: ${unauthorizedColumns.join(
            ', '
          )}`,
        })
      }
    },
    /**
     * Validates if user can write to specific columns
     * Throws TRPCError if user lacks permission
     */
    validateWriteAccess: async (
      userId: AuthUser['id'],
      columns: string[],
      hasGlobalAccess: boolean
    ): Promise<void> => {
      if (hasGlobalAccess) return // Skip checks if user has global access
      const canWrite = await canWriteToColumns(userId, scope, columns)
      if (!canWrite) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Bu alanları değiştirmek için yetkiniz yok: ${columns.join(', ')}`,
        })
      }
    },

    /**
     * Filters input data to only include columns user can write to
     * Returns filtered data and list of removed fields
     */
    filterInputData: async <T extends Record<string, unknown>>(
      userId: AuthUser['id'],
      inputData: T,
      hasGlobalAccess: boolean
    ): Promise<{
      filteredData: T
      removedFields: string[]
    }> => {
      if (hasGlobalAccess) {
        return { filteredData: inputData, removedFields: [] }
      }
      const writableColumns = await getUserWritableColumns(userId, scope)
      const filteredData: Record<string, unknown> = {}
      const removedFields: string[] = []

      for (const [key, value] of Object.entries(inputData)) {
        if (writableColumns.includes(key)) {
          filteredData[key] = value
        } else {
          removedFields.push(key)
        }
      }

      return { filteredData: filteredData as T, removedFields }
    },

    filterOutputDataArray: async (
      userId: AuthUser['id'],
      inputDataArray: Record<string, unknown>[],
      hasGlobalAccess: boolean
    ): Promise<Record<string, unknown>[]> => {
      if (hasGlobalAccess) {
        return inputDataArray
      }
      const writableColumns = await getUserReadableColumns(userId, scope)
      const removedFields: string[] = []
      const filteredDataArray: Record<string, unknown>[] = inputDataArray.map(
        (inputData) => {
          const filteredData: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(inputData)) {
            if (writableColumns.includes(key)) {
              filteredData[key] = value
            } else {
              if (!removedFields.includes(key)) {
                removedFields.push(key)
              }
            }
          }
          return filteredData
        }
      )

      if (removedFields.length > 0) {
        console.warn(
          `The following fields were removed due to lack of write permissions: ${removedFields.join(', ')}`
        )
      }

      return filteredDataArray
    },
  }
}

// Import the getUserWritableColumns function
async function getUserWritableColumns(
  userId: AuthUser['id'],
  scope: keyof typeof SCOPES
): Promise<string[]> {
  const { getUserWritableColumns } = await import('./column-access')
  return getUserWritableColumns(userId, scope)
}
