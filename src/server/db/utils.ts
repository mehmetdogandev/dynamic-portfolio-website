import { uuid,timestamp,text } from "drizzle-orm/pg-core";
import { user } from "./schemas/schema";
import type { PgTable, PgColumn, PgSelect } from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";


export const id= uuid("id").primaryKey().defaultRandom().notNull();


export const thisProjectTimestamps = {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
    deletedAt: timestamp("deleted_at").defaultNow().notNull(),
}


export const thisProjectAuditMeta= {
    createdBy: text("created_by").references(() => user.id, {
        onDelete: "set null",
      }),
      lastUpdatedBy: text("last_updated_by").references(() => user.id, {
        onDelete: "set null",
      }),
      deletedBy: text("deleted_by").references(() => user.id, {
        onDelete: "set null",
      }),
};


/**
 * Soft delete edilmemiş (aktif) kayıtları hedefleyen SQL koşulu üretir.
 * deletedAt alanı NULL olan kayıtlar döner.
 *
 * Kullanım:
 * where(onlyNotDeleted(table))
 */
export function onlyNotDeleted<T extends PgTable>(
  table: T & { deletedAt: PgColumn }
): SQL {
  return sql`${table.deletedAt} IS NULL`;
}

/**
 * Dinamik query builder'a soft delete filtresi ekler.
 * deletedAt NULL olmayan (silinmiş) kayıtları otomatik olarak eler.
 *
 * Kullanım:
 * qb = withNotDeleted(qb, table)
 */
export function withNotDeleted<T extends PgSelect, Schema extends PgTable>(
  qb: T,
  table: Schema & { deletedAt: PgColumn }
): T {
  return qb.where(onlyNotDeleted(table));
}

/**
 * Büyük/küçük harf, Türkçe–ASCII farkları ve whitespace'i yok sayan
 * normalize edilmiş LIKE arama koşulu üretir.
 *
 * Tek kolon aramaları için idealdir.
 *
 * Kullanım:
 * where(normalizedLike(users.name, search))
 */
export function normalizedLike(
  column: PgColumn,
  searchText: string
): SQL {
  if (!searchText) {
    return sql`FALSE`;
  }

  const words = searchText.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return sql`FALSE`;
  }

  const normalizeWord = (word: string): string =>
    word
      .toLowerCase()
      .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => {
        const map: Record<string, string> = {
          ç: "c",
          ğ: "g",
          ı: "i",
          ö: "o",
          ş: "s",
          ü: "u",
          Ç: "c",
          Ğ: "g",
          İ: "i",
          I: "i",
          Ö: "o",
          Ş: "s",
          Ü: "u",
        };
        return map[char] ?? char;
      });

  const conditions = words.map((word) => {
    const normalized = normalizeWord(word);
    const escaped = normalized.replace(/[%_\\]/g, "\\$&");

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
      ) LIKE ${`%${escaped}%`} ESCAPE '\\'
    `;
  });

  return conditions.length === 1
    ? conditions[0]!
    : sql`(${sql.join(conditions, sql` AND `)})`;
}

/**
 * Birden fazla kolonda, çok kelimeli ve normalize edilmiş
 * global arama koşulu üretir.
 *
 * Kullanım:
 * where(globalSearch([users.name, users.email], search))
 */
export function globalSearch(
  columns: PgColumn[],
  searchText: string
): SQL {
  if (!searchText || columns.length === 0) {
    return sql`FALSE`;
  }

  const words = searchText.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return sql`FALSE`;
  }

  const normalizeWord = (word: string): string =>
    word
      .toLowerCase()
      .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => {
        const map: Record<string, string> = {
          ç: "c",
          ğ: "g",
          ı: "i",
          ö: "o",
          ş: "s",
          ü: "u",
          Ç: "c",
          Ğ: "g",
          İ: "i",
          I: "i",
          Ö: "o",
          Ş: "s",
          Ü: "u",
        };
        return map[char] ?? char;
      });

  const wordConditions = words.map((word) => {
    const normalized = normalizeWord(word);
    const escaped = normalized.replace(/[%_\\]/g, "\\$&");

    const columnConditions = columns.map((column) => sql`
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
      ) LIKE ${`%${escaped}%`} ESCAPE '\\'
    `);

    return columnConditions.length === 1
      ? columnConditions[0]!
      : sql`(${sql.join(columnConditions, sql` OR `)})`;
  });

  return wordConditions.length === 1
    ? wordConditions[0]!
    : sql`(${sql.join(wordConditions, sql` AND `)})`;
}
