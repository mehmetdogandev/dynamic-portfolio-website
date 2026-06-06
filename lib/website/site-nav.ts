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
  | 'anasayfa'
  | 'hakkimda'
  | 'projeler'
  | 'blog'
  | 'referanslar'
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
    id: 'anasayfa',
    href: sitePath(''),
    navLabel: 'Anasayfa',
    title: 'Anasayfa',
    subtitle: 'Mehmet Doğan — Software Engineer',
  },
  {
    id: 'hakkimda',
    href: sitePath('hakkimda'),
    navLabel: 'Hakkımda',
    title: 'Hakkımda',
    subtitle: 'Yazılım mühendisliği ve deneyimlerim',
  },
  {
    id: 'projeler',
    href: sitePath('projeler'),
    navLabel: 'Projeler',
    title: 'Projeler',
    subtitle: 'Geliştirdiğim yazılım projeleri',
  },
  {
    id: 'blog',
    href: sitePath('blog'),
    navLabel: 'Blog',
    title: 'Bilgi merkezi',
    subtitle: 'Yazılım, kariyer ve teknoloji notları',
  },
  {
    id: 'referanslar',
    href: sitePath('referanslar'),
    navLabel: 'Referanslar',
    title: 'Referanslar',
    subtitle: 'İş birlikleri ve referanslarım',
  },
  {
    id: 'galeri',
    href: sitePath('galeri'),
    navLabel: 'Galeri',
    title: 'Galeri',
    subtitle: 'Konferanslar, projeler ve etkinliklerden görüntüler',
  },
  {
    id: 'iletisim',
    href: sitePath('iletisim'),
    navLabel: 'İletişim',
    title: 'İletişim',
    subtitle: 'Benimle iletişime geçin',
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
