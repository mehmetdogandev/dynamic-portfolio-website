import { eq, ilike, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { PgSelect, PgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * Standard UUID primary key field for database tables.
 *
 * Provides a consistent primary key implementation across all database tables:
 * - Uses UUID for better distribution and security than auto-incrementing integers
 * - Automatically generates random UUIDs for new records
 * - Ensures non-null constraint for data integrity
 *
 * @example
 * ```typescript
 * export const users = pgTable("users", {
 *   id, // Uses this standard UUID primary key
 *   name: text("name").notNull(),
 *   // ... other fields
 * })
 * ```
 */
export const id = uuid('id').primaryKey().defaultRandom().notNull()

/**
 * Standard timestamp fields for audit trail functionality.
 *
 * Provides consistent created/updated/deleted timestamp tracking across all database tables:
 * - `createdAt`: Automatically set to current timestamp on record creation
 * - `updatedAt`: Automatically updated to current timestamp on any record modification
 * - `deletedAt`: Timestamp of when the record was soft-deleted (nullable)
 * - Both createdAt and updatedAt are required (non-null) to ensure complete audit trail
 * - deletedAt enables soft delete functionality (null = not deleted, timestamp = deleted)
 * - Uses PostgreSQL's native timestamp type for optimal performance
 *
 * The `$onUpdate` hook ensures `updatedAt` is automatically maintained without
 * requiring manual intervention in application code.
 *
 * @example
 * ```typescript
 * export const posts = pgTable("posts", {
 *   id,
 *   title: text("title").notNull(),
 *   ...timestamps, // Adds createdAt, updatedAt, and deletedAt fields
 * })
 *
 * // Query for not deleted records
 * const query = await db.select().from(posts).where(isNull(posts.deletedAt)).limit(10);
 * ```
 */
export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
}

export { auditMeta } from './schema/audit-meta'

/**
 * Helper function to create SQL condition for excluding deleted records.
 * Use this in WHERE clauses to filter out soft-deleted records from queries.
 *
 * @param table - The table object from drizzle schema with deletedAt field
 * @returns SQL condition that excludes deleted records
 *
 * @example
 * ```typescript
 * const result = await db
 *   .select()
 *   .from(posts)
 *   .where(and(
 *     excludeDeleted(posts),
 *     eq(posts.status, "published")
 *   ))
 * ```
 */
export function excludeDeleted<T extends PgTable>(
  table: T & { deletedAt: PgColumn }
): SQL {
  return sql`${table.deletedAt} IS NULL`
}

/**
 * Query builder helper function that filters out deleted records.
 * Use this with dynamic queries to automatically exclude soft-deleted records.
 *
 * @param qb - The query builder instance (must be dynamic query)
 * @param table - The table object with deletedAt field
 * @returns Query builder with where clause excluding deleted records
 *
 * @example
 * ```typescript
 * const query = db.select().from(users).$dynamic();
 * const results = await notDeleted(query, users);
 * ```
 */
export function notDeleted<T extends PgSelect, Schema extends PgTable>(
  qb: T,
  table: Schema & { deletedAt: PgColumn }
): T {
  return qb.where(excludeDeleted(table))
}

/**
 * Creates a case-insensitive and Turkish-English character insensitive search condition.
 *
 * This function normalizes both the column and search text to handle:
 * - Case-insensitive search (via lower())
 * - Whitespace removal (spaces, tabs, newlines, etc.)
 * - Turkish character normalization (İ→i, ş→s, ğ→g, ü→u, ö→o, ç→c)
 *
 * The search pattern uses LIKE with wildcards for partial matching.
 * Both the column value and search text are normalized for comparison.
 *
 * If search text contains multiple words (separated by spaces), each word is searched separately
 * and combined with AND, so "mehmet do" will match columns containing both "mehmet" AND "do".
 *
 * Note: For searching across multiple columns, use `createMultiColumnSearch` instead.
 *
 * @param column - The database column to search in
 * @param searchText - The search text (will be normalized automatically)
 * @returns SQL condition for case-insensitive, locale-insensitive search
 *
 * @example
 * ```typescript
 * // Basic usage
 * if (search) {
 *   conditions.push(createLocaleInsensitiveSearch(user.name, search));
 * }
 *
 * // Multiple columns
 * if (search) {
 *   const searchConditions = [];
 *   searchConditions.push(createLocaleInsensitiveSearch(user.name, search));
 *   searchConditions.push(createLocaleInsensitiveSearch(user.email, search));
 *   conditions.push(or(...searchConditions)!);
 * }
 * ```
 */
export function createLocaleInsensitiveSearch(
  column: PgColumn,
  searchText: string
): SQL {
  if (!searchText) {
    return sql`FALSE`
  }

  // Split search text by whitespace to handle multiple words
  const words = searchText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (words.length === 0) {
    return sql`FALSE`
  }

  // Normalize each word: lowercase, remove whitespace, and replace Turkish characters
  const normalizeWord = (word: string): string => {
    return word.toLowerCase().replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => {
      const charMap: Record<string, string> = {
        ç: 'c',
        ğ: 'g',
        ı: 'i',
        ö: 'o',
        ş: 's',
        ü: 'u',
        Ç: 'c',
        Ğ: 'g',
        İ: 'i',
        I: 'i',
        Ö: 'o',
        Ş: 's',
        Ü: 'u',
      }
      return charMap[char] || char
    })
  }

  // Create search conditions for each word
  const wordConditions = words.map((word) => {
    const normalizedWord = normalizeWord(word)
    const escapedWord = normalizedWord.replace(/[%_\\]/g, '\\$&')

    // Normalize column using nested replace for Turkish characters and whitespace removal
    return sql`
      lower(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                regexp_replace(${column}, '\\s+', '', 'g'),
                                'İ', 'i'
                              ),
                              'ı', 'i'
                            ),
                            'Ş', 's'
                          ),
                          'ş', 's'
                        ),
                        'Ğ', 'g'
                      ),
                      'ğ', 'g'
                    ),
                    'Ü', 'u'
                  ),
                  'ü', 'u'
                ),
                'Ö', 'o'
              ),
              'ö', 'o'
            ),
            'Ç', 'c'
          ),
          'ç', 'c'
        )
      ) LIKE ${`%${escapedWord}%`} ESCAPE '\\'
    `
  })

  // Combine all word conditions with AND (all words must match)
  if (wordConditions.length === 1) {
    return wordConditions[0]!
  }

  return sql`(${sql.join(wordConditions, sql` AND `)})`
}

/**
 * Creates a multi-word search condition across multiple columns.
 *
 * This function handles searches like "mehmet dogan" where:
 * - Each word must be found in at least one of the provided columns (OR within columns)
 * - All words must be found (AND between words)
 *
 * Example: "mehmet dogan" will match records where:
 * - "mehmet" is found in name OR lastName OR email OR username
 * - AND "dogan" is found in name OR lastName OR email OR username
 *
 * @param columns - Array of columns to search in
 * @param searchText - The search text (will be split into words)
 * @returns SQL condition for multi-word, multi-column search
 *
 * @example
 * ```typescript
 * if (search) {
 *   const searchColumns = [];
 *   if (filteredSelect.name) searchColumns.push(user.name);
 *   if (filteredSelect.lastName) searchColumns.push(user.lastName);
 *   if (filteredSelect.email) searchColumns.push(user.email);
 *   if (searchColumns.length > 0) {
 *     conditions.push(createMultiColumnSearch(searchColumns, search));
 *   }
 * }
 * ```
 */
export type ApplyColumnFiltersOptions = {
  /** Keys matched with `eq` (UUID, enum, exact select values). Default is `ilike`. */
  exactKeys?: readonly string[]
}

/**
 * Applies per-column filters from admin DataTable column filter row.
 */
export function applyColumnFilters(
  conditions: SQL[],
  columnFilters: Record<string, string> | undefined,
  columnMap: Record<string, PgColumn>,
  options?: ApplyColumnFiltersOptions
): void {
  if (!columnFilters) return

  const exactKeys = new Set(options?.exactKeys ?? [])

  for (const [key, rawValue] of Object.entries(columnFilters)) {
    const value = rawValue?.trim()
    if (!value) continue

    const column = columnMap[key]
    if (!column) continue

    if (exactKeys.has(key)) {
      conditions.push(eq(column, value))
      continue
    }

    const escaped = value.replace(/[%_\\]/g, '\\$&')
    conditions.push(ilike(column, `%${escaped}%`))
  }
}

export function createMultiColumnSearch(
  columns: PgColumn[],
  searchText: string
): SQL {
  if (!searchText || columns.length === 0) {
    return sql`FALSE`
  }

  // Split search text by whitespace to handle multiple words
  const words = searchText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (words.length === 0) {
    return sql`FALSE`
  }

  // Normalize each word: lowercase and replace Turkish characters
  const normalizeWord = (word: string): string => {
    return word.toLowerCase().replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => {
      const charMap: Record<string, string> = {
        ç: 'c',
        ğ: 'g',
        ı: 'i',
        ö: 'o',
        ş: 's',
        ü: 'u',
        Ç: 'c',
        Ğ: 'g',
        İ: 'i',
        I: 'i',
        Ö: 'o',
        Ş: 's',
        Ü: 'u',
      }
      return charMap[char] || char
    })
  }

  // For each word, create a condition that searches across all columns (OR)
  const wordConditions = words.map((word) => {
    const normalizedWord = normalizeWord(word)
    const escapedWord = normalizedWord.replace(/[%_\\]/g, '\\$&')

    // Create search condition for this word across all columns
    const columnConditions = columns.map((column) => {
      return sql`
        lower(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  regexp_replace(${column}, '\\s+', '', 'g'),
                                  'İ', 'i'
                                ),
                                'ı', 'i'
                              ),
                              'Ş', 's'
                            ),
                            'ş', 's'
                          ),
                          'Ğ', 'g'
                        ),
                        'ğ', 'g'
                      ),
                      'Ü', 'u'
                    ),
                    'ü', 'u'
                  ),
                  'Ö', 'o'
                ),
                'ö', 'o'
              ),
              'Ç', 'c'
            ),
            'ç', 'c'
          )
        ) LIKE ${`%${escapedWord}%`} ESCAPE '\\'
      `
    })

    // Combine column conditions with OR (word can be in any column)
    if (columnConditions.length === 1) {
      return columnConditions[0]!
    }
    return sql`(${sql.join(columnConditions, sql` OR `)})`
  })

  // Combine word conditions with AND (all words must be found)
  if (wordConditions.length === 1) {
    return wordConditions[0]!
  }

  return sql`(${sql.join(wordConditions, sql` AND `)})`
}
