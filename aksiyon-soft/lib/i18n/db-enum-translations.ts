/**
 * Turkish UI labels for PostgreSQL enums / RBAC constants mirrored in the app schema.
 * Single source of truth for scope and permission display strings (seed, admin UI, profile).
 */
import { PERMISSIONS, SCOPES } from '@/lib/db/schema/rbac'

export const SCOPE_TRANSLATIONS: Record<keyof typeof SCOPES, string> = {
  USER: 'Kullanıcı',
  ROLE: 'Rol',
  ROLE_GROUP: 'Ünvan / Rol Grubu',
  MAIL: 'E-posta',
  MAIL_LOG: 'E-posta günlüğü',
  JOB: 'Arka plan işi',
  REFERENCE: 'Referans',
  MEDIA: 'Medya',
  MEDIA_GROUP: 'Medya grubu',
  BLOG: 'Blog',
  BLOG_TYPE: 'Blog türü',
  SLIDER: 'Slider',
  SOLUTION: 'Çözüm',
  SOLUTION_GROUP: 'Çözüm grubu',
  SOLUTION_TECHNOLOGY: 'Çözüm teknolojisi',
  SITE_SEO: 'Site SEO',
  HEADER_NAV: 'Header menü',
  FOOTER_NAV: 'Footer menü',
  ABOUT: 'Hakkımızda',
  JAPON_CUSTOMER: 'Japon Oto müşterisi',
  JAPON_SERVICE: 'Japon Oto servisi',
  JAPON_FORMEN: 'Japon Oto formeni',
  JAPON_OTO_OPERATIONS: 'Japon Oto işlemleri',
  JAPON_OTO_CUSTOMER: 'Japon Oto müşterileri',
  JAPON_OTO_CAR: 'Japon Oto araçları',
  JAPON_OTO_SERVICE: 'Japon Oto servis kataloğu',
  JAPON_OTO_FORMEN: 'Japon Oto formen',
  RADIO_MOBILE_ANDROID_RELEASE: 'Radio Mobil Android Release',
  RADIO_MOBILE_ANDROID_DEBUG: 'Radio Mobil Android Debug',
  RADIO_MOBILE_IOS_RELEASE: 'Radio Mobil iOS Release',
  RADIO_MOBILE_IOS_DEBUG: 'Radio Mobil iOS Debug',
  RADIO_MOBILE_API_KEY: 'Radio Mobil API anahtarı',
}

export const PERMISSION_TRANSLATIONS: Record<keyof typeof PERMISSIONS, string> =
  {
    CREATE: 'Oluştur',
    READ: 'Görüntüle',
    ACCESS: 'Erişim',
    UPDATE: 'Düzenle',
    DELETE: 'Sil',
    EXPORT: 'Dışa Aktar',
    IMPORT: 'İçe Aktar',
    APPROVE: 'Onayla',
    REJECT: 'Reddet',
    ARCHIVE: 'Arşivle',
  }

/** Human-readable label for a persisted `scope` enum value; unknown values pass through. */
export function translateScope(scope: string): string {
  if (scope in SCOPE_TRANSLATIONS) {
    return SCOPE_TRANSLATIONS[scope as keyof typeof SCOPE_TRANSLATIONS]
  }
  return scope
}

/** Human-readable label for a persisted `permission` enum value; unknown values pass through. */
export function translatePermission(permission: string): string {
  if (permission in PERMISSION_TRANSLATIONS) {
    return PERMISSION_TRANSLATIONS[
      permission as keyof typeof PERMISSION_TRANSLATIONS
    ]
  }
  return permission
}
