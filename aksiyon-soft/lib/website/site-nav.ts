/**
 * Public marketing base path from env (e.g. empty = site at `/`, or `/kurumsal`).
 * Must not use the same segment as `ADMIN_PANEL_URL`.
 */
function normalizeWebsiteBase(): string {
  const raw = (process.env.NEXT_PUBLIC_WEBSITE_BASE ?? '').trim()
  if (raw === '') return ''
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash.replace(/\/+$/, '') || ''
}

export const WEBSITE_BASE = normalizeWebsiteBase()

/** One path segment or nested path, no query. Produces a single leading slash when base is empty. */
export function sitePath(relative: string): string {
  const p = relative.replace(/^\//, '')
  if (!p) {
    if (WEBSITE_BASE === '') return '/'
    return WEBSITE_BASE
  }
  if (WEBSITE_BASE === '') {
    return `/${p}`
  }
  return `${WEBSITE_BASE}/${p}`
}

/** Base for public marketing (no admin). */
export type WebsiteNavId =
  | 'hakkimizda'
  | 'solution'
  | 'blog'
  | 'references'
  | 'galeri'
  | 'iletisim'

export interface WebsiteNavItem {
  id: WebsiteNavId
  /** Full path */
  href: string
  /** Short label for header / mobile */
  navLabel: string
  /** H1 and breadcrumb */
  title: string
  subtitle?: string
}

export const WEBSITE_MAIN_NAV: WebsiteNavItem[] = [
  {
    id: 'hakkimizda',
    href: sitePath('hakkimizda'),
    navLabel: 'Hakkımızda',
    title: 'Hakkımızda',
    subtitle: 'Aksiyon Soft olarak',
  },
  {
    id: 'solution',
    href: sitePath('solution'),
    navLabel: 'Çözümler',
    title: 'Çözümlerimiz',
    subtitle: 'Kurumsal yazılım ve operasyon çözüm örnekleri',
  },
  {
    id: 'blog',
    href: sitePath('blog'),
    navLabel: 'Blog',
    title: 'Bilgi merkezi',
    subtitle: 'Kurumsal yazılım, güvenlik ve mühendislik notları',
  },
  {
    id: 'references',
    href: sitePath('references'),
    navLabel: 'Referanslar',
    title: 'Müşterilerimiz',
    subtitle: 'Güvendiğimiz iş ortaklıkları',
  },
  {
    id: 'galeri',
    href: sitePath('galeri'),
    navLabel: 'Medya',
    title: 'Kurumsal medya',
    subtitle: 'Etkinlikler ve görseller',
  },
  {
    id: 'iletisim',
    href: sitePath('iletisim'),
    navLabel: 'İletişim',
    title: 'İletişim',
    subtitle: 'Bize ulaşın',
  },
]

export function isWebsiteHome(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (WEBSITE_BASE === '') {
    return pathname === '/' || pathname === ''
  }
  return pathname === WEBSITE_BASE || pathname === `${WEBSITE_BASE}/`
}

export function getNavItemByPathname(
  pathname: string
): WebsiteNavItem | undefined {
  return WEBSITE_MAIN_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}
