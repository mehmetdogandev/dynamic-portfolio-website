import { getTableColumns } from 'drizzle-orm'
import { type PgTable } from 'drizzle-orm/pg-core'

/**
 * Safely extracts column names from a Drizzle table.
 * This utility provides a type-safe way to get column names for dynamic operations
 * like sorting, filtering, and validation.
 *
 * @param table - The Drizzle table to extract columns from
 * @returns Array of column names as strings
 *
 * @example
 * ```typescript
 * import { user } from '@/lib/db/schema';
 * import { getTableColumnNames } from '@/lib/utils/table-utils';
 *
 * const columnNames = getTableColumnNames(user);
 * // Returns: ['id', 'name', 'email', 'createdAt', 'updatedAt', etc.]
 * ```
 */
export function getTableColumnNames<T extends PgTable>(table: T): string[] {
  try {
    const columns = getTableColumns(table)
    return Object.keys(columns)
  } catch (_error) {
    return []
  }
}

/**
 * Creates a type-safe column validator function for a given table.
 * This is useful for validating sort columns, filter fields, etc.
 *
 * @param table - The Drizzle table to create validator for
 * @returns A validator function that checks if a string is a valid column name
 *
 * @example
 * ```typescript
 * import { user } from '@/lib/db/schema';
 * import { createColumnValidator } from '@/lib/utils/table-utils';
 *
 * const isValidUserColumn = createColumnValidator(user);
 *
 * // Usage in sorting logic
 * const sortColumn = isValidUserColumn(sortBy) ? user[sortBy] : user.createdAt;
 * ```
 */
export function createColumnValidator<T extends PgTable>(table: T) {
  const columnNames = getTableColumnNames(table)

  return function isValidColumn(
    columnName: string
  ): columnName is string & keyof T['_']['columns'] {
    return columnNames.includes(columnName)
  }
}

/**
 * Gets column names with their types for advanced use cases.
 *
 * @param table - The Drizzle table to analyze
 * @returns Object with column names as keys and column definitions as values
 */
export function getTableColumnsWithTypes<T extends PgTable>(table: T) {
  try {
    return getTableColumns(table)
  } catch (_error) {
    return {} as ReturnType<typeof getTableColumns<T>>
  }
}

/**
 * Generates column definitions for UI purposes based on table schema.
 * Includes automatic type detection and Turkish labels.
 *
 * @param table - The Drizzle table to generate definitions for
 * @param entityName - Name of the entity for labeling (e.g., 'Kullanıcı', 'Rol')
 * @param additionalFields - Extra computed/relation fields to include
 * @returns Array of column definitions with key, label, and type
 */
export function generateColumnDefinitions<T extends PgTable>(
  table: T,
  entityName: string,
  additionalFields: Array<{ key: string; label: string; type: string }> = []
) {
  const columns = getTableColumnsWithTypes(table)
  const definitions = []

  // Map database columns to UI definitions
  for (const [columnName, column] of Object.entries(columns)) {
    let type = 'text' // default
    let label = columnName

    // Auto-detect type based on column type and name patterns
    const columnType = column.dataType
    if (columnName === 'id' || columnName.endsWith('Id')) {
      type = 'uuid'
    } else if (columnType === 'boolean') {
      type = 'boolean'
    } else if (
      columnType === 'date' ||
      columnName.includes('At') ||
      columnName.includes('Date')
    ) {
      type = 'date'
    } else if (columnType === 'json' || columnType === 'array') {
      type = 'array'
    } else if (columnName.includes('email')) {
      type = 'email'
    } else if (columnName.includes('image') || columnName.includes('avatar')) {
      type = 'url'
    } else if (columnName === 'scope') {
      type = 'enum'
    }

    // Generate Turkish labels based on common patterns
    if (columnName === 'id') {
      label = `${entityName} ID`
    } else if (columnName === 'name') {
      label = `${entityName} Adı`
    } else if (columnName === 'email') {
      label = 'E-posta'
    } else if (columnName === 'createdAt') {
      label = 'Oluşturma Tarihi'
    } else if (columnName === 'updatedAt') {
      label = 'Güncelleme Tarihi'
    } else if (columnName === 'managerId') {
      label = 'Yönetici ID'
    } else if (columnName === 'lastName') {
      label = 'Soyad'
    } else if (columnName === 'username') {
      label = 'Kullanıcı Adı'
    } else if (columnName === 'displayUsername') {
      label = 'Görünen Kullanıcı Adı'
    } else if (columnName === 'emailVerified') {
      label = 'E-posta Doğrulandı'
    } else if (columnName === 'image') {
      label = 'Profil Resmi'
    } else if (columnName === 'scope') {
      label = 'Kapsam'
    } else if (columnName === 'permissions') {
      label = 'İzinler'
    } else if (columnName === 'hasGlobalAccess') {
      label = 'Global Erişim'
    } else if (columnName.startsWith('visible') && columnName.endsWith('Ids')) {
      const entityType = columnName.replace('visible', '').replace('Ids', '')
      label = `Görünür ${entityType} IDleri`
    } else if (columnName === 'address') {
      label = 'Adres'
    } else if (columnName === 'city') {
      label = 'Şehir'
    } else if (columnName === 'country') {
      label = 'Ülke'
    } else if (columnName === 'description') {
      label = 'Açıklama'
    } else if (columnName === 'title') {
      label = 'Başlık'
    }

    definitions.push({
      key: columnName,
      label,
      type,
    })
  }

  // Add additional computed/relation fields
  definitions.push(...additionalFields)

  return definitions
}
