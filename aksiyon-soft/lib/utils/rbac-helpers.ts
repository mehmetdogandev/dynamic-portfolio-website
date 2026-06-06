import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * Common error messages for consistency across routers.
 */
export const RBAC_ERRORS = {
  NO_ACCESS: (entity: string) => `${entity} verilerine erişim yetkiniz yok`,
  NOT_FOUND: (entity: string) =>
    `${entity} bulunamadı veya erişim yetkiniz yok`,
  NO_CREATE_ACCESS: (entity: string) => `${entity} oluşturma yetkiniz yok`,
  NO_UPDATE_ACCESS: (entity: string) => `${entity} güncelleme yetkiniz yok`,
  NO_DELETE_ACCESS: (entity: string) => `${entity} silme yetkiniz yok`,
  CREATION_FAILED: (entity: string) => `${entity} oluşturulurken hata oluştu`,
  UPDATE_FAILED: (entity: string) => `${entity} güncellenirken hata oluştu`,
  DELETION_FAILED: (entity: string) => `${entity} silinirken hata oluştu`,
} as const

export type ColumnDefinition = Record<string, PgColumn>
