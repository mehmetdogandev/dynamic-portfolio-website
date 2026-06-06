import {
  getChannelByPublicPath,
  getPublicPageMeta,
} from '@/lib/radio-mobile/public-page-meta'
import {
  isWebsiteHome,
  WEBSITE_BASE,
  getNavItemByPathname,
} from '@/lib/website/site-nav'

export type SiteBreadcrumbItem = {
  label: string
  href?: string
}

function normalizePathname(pathname: string): string {
  let p = pathname.split('?')[0]?.split('#')[0] ?? pathname
  if (WEBSITE_BASE && p.startsWith(WEBSITE_BASE)) {
    p = p.slice(WEBSITE_BASE.length) || '/'
  }
  if (!p.startsWith('/')) p = `/${p}`
  return p.replace(/\/+$/, '') || '/'
}

function homeHref(): string {
  return WEBSITE_BASE === '' ? '/' : WEBSITE_BASE
}

export function getSiteBreadcrumbItems(
  pathname: string | null | undefined
): SiteBreadcrumbItem[] | null {
  if (!pathname || isWebsiteHome(pathname)) return null

  const normalized = normalizePathname(pathname)
  const home: SiteBreadcrumbItem = { label: 'Ana sayfa', href: homeHref() }

  const channel = getChannelByPublicPath(normalized)
  if (channel) {
    const meta = getPublicPageMeta(channel)
    return [
      home,
      { label: meta.breadcrumbPlatform },
      { label: meta.breadcrumbChannel },
    ]
  }

  const fullPath = WEBSITE_BASE ? `${WEBSITE_BASE}${normalized}` : normalized
  const navItem = getNavItemByPathname(fullPath)
  if (!navItem) {
    return [home, { label: 'Sayfa' }]
  }

  return [home, { label: navItem.navLabel }]
}
