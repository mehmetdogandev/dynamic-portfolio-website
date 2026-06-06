import {
  Home,
  Users,
  Shield,
  LucideIcon,
  Settings,
  Medal,
  Mail,
  FileText,
  BriefcaseBusiness,
} from 'lucide-react'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export interface BreadcrumbItem {
  label: string
  href: string
  icon?: LucideIcon
}

const ADMIN_PANEL_BASE = ADMIN_PANEL_PATH

function isAdminPanelPath(pathname: string): boolean {
  return (
    pathname === ADMIN_PANEL_BASE || pathname.startsWith(`${ADMIN_PANEL_BASE}/`)
  )
}

/** Strip /admin-panel prefix so breadcrumbMap keys (e.g. /users) still match. */
function toBreadcrumbLookupPath(pathname: string): string {
  if (pathname === ADMIN_PANEL_BASE || pathname === `${ADMIN_PANEL_BASE}/`) {
    return '/'
  }
  if (pathname.startsWith(`${ADMIN_PANEL_BASE}/`)) {
    const rest = pathname.slice(ADMIN_PANEL_BASE.length)
    return rest.length > 0 ? rest : '/'
  }
  return pathname
}

function prefixAdminPanelHrefs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items.map((item) => {
    const href = item.href
    if (href === '/') {
      return { ...item, href: ADMIN_PANEL_BASE }
    }
    if (href.startsWith(ADMIN_PANEL_BASE)) {
      return item
    }
    return {
      ...item,
      href: `${ADMIN_PANEL_BASE}${href.startsWith('/') ? '' : '/'}${href}`,
    }
  })
}

export const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
  ],
  '/users': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Kullanıcılar',
      href: '/users',
      icon: Users,
    },
  ],
  '/roles': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Roller',
      href: '/roles',
      icon: Shield,
    },
  ],
  '/role-groups': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Rol Grupları',
      href: '/role-groups',
      icon: Medal,
    },
  ],
  '/settings': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Hesabım',
      href: '/settings',
      icon: Settings,
    },
  ],
  '/mail': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Mail',
      href: '/mail',
      icon: Mail,
    },
  ],
  '/email-logs': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Email Loglari',
      href: '/email-logs',
      icon: FileText,
    },
  ],
  '/jobs': [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Arka Plan İşleri',
      href: '/jobs',
      icon: BriefcaseBusiness,
    },
  ],
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const forAdminPanel = isAdminPanelPath(pathname)
  const lookupPath = toBreadcrumbLookupPath(pathname)

  // Exact match öncelikle kontrol et
  if (breadcrumbMap[lookupPath]) {
    const items = breadcrumbMap[lookupPath]
    return forAdminPanel ? prefixAdminPanelHrefs(items) : items
  }

  // Dinamik rotalar için (örn: /users/123, /users/create)
  const segments = lookupPath.split('/').filter(Boolean)

  if (segments.length === 0) {
    const fallback = breadcrumbMap['/']
    return forAdminPanel ? prefixAdminPanelHrefs(fallback) : fallback
  }

  let basePath = `/${segments[0]}`
  let baseBreadcrumbs: BreadcrumbItem[] | undefined
  let startIndex = 1

  if (segments.length >= 2) {
    const twoSegmentPath = `/${segments[0]}/${segments[1]}`
    if (breadcrumbMap[twoSegmentPath]) {
      basePath = twoSegmentPath
      baseBreadcrumbs = breadcrumbMap[twoSegmentPath]
      startIndex = 2
    }
  }

  // Eğer iki segment'li path bulunamadıysa, tek segment'li path'i kullan
  if (!baseBreadcrumbs) {
    baseBreadcrumbs = breadcrumbMap[basePath] || [
      {
        label: 'Ana Sayfa',
        href: '/',
        icon: Home,
      },
    ]
  }

  // baseBreadcrumbs'ı kopyala (mutate etmemek için)
  let resultBreadcrumbs = [...baseBreadcrumbs]

  // Alt sayfa varsa işle (startIndex'ten itibaren)
  if (segments.length > startIndex) {
    const subSegments = segments.slice(startIndex)
    let currentPath = basePath

    subSegments.forEach((segment, _index) => {
      currentPath += `/${segment}`

      // Özel durumlar için etiket belirleme
      let label = segment

      // UUID formatını kontrol et (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      // ID gibi görünen segment'ler (sayı veya UUID)
      if (/^\d+$/.test(segment) || uuidRegex.test(segment)) {
        // Özel sayfa bazlı label'lar
      }
      // Özel sayfalar
      else if (segment === 'create') {
        label = 'Yeni Oluştur'
      } else if (segment === 'edit') {
        label = 'Düzenle'
      } else if (segment === 'view') {
        label = 'Görüntüle'
      } else if (segment === 'sectors') {
        label = 'Sektörler'
      } else {
        // İlk harfi büyük yap
        label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      // Duplicate kontrolü - aynı href'e sahip item varsa ekleme
      if (!resultBreadcrumbs.some((item) => item.href === currentPath)) {
        resultBreadcrumbs.push({
          label,
          href: currentPath,
        })
      }
    })
  }

  if (forAdminPanel) {
    resultBreadcrumbs = prefixAdminPanelHrefs(resultBreadcrumbs)
  }

  return resultBreadcrumbs
}
