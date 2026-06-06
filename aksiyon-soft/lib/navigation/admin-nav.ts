import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  House,
  Images,
  Mail,
  BriefcaseBusiness,
  Shield,
  FolderTree,
  BookText,
  Tags,
  GalleryHorizontal,
  PanelTop,
  PanelBottom,
  LayoutGrid,
  Layers,
  Cpu,
  Users,
  Car,
  Wrench,
  HardHat,
  ClipboardList,
  Smartphone,
  KeyRound,
  Bug,
  Package,
} from 'lucide-react'
import { SCOPES } from '@/lib/db/schema'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

type ScopeValue = (typeof SCOPES)[keyof typeof SCOPES]

export type AdminNavItem = {
  title: string
  href: string
  icon: LucideIcon
  requiredPermission: ScopeValue | null
}

/** Ana sayfa (tek öğe) */
export const navigationItems: AdminNavItem[] = [
  {
    title: 'Ana Sayfa',
    href: ADMIN_PANEL_PATH,
    icon: House,
    requiredPermission: null,
  },
]

export const generalItems: AdminNavItem[] = [
  {
    title: 'Kullanıcılar',
    href: `${ADMIN_PANEL_PATH}/users`,
    icon: Users,
    requiredPermission: SCOPES.USER,
  },
  {
    title: 'Roller',
    href: `${ADMIN_PANEL_PATH}/roles`,
    icon: Shield,
    requiredPermission: SCOPES.ROLE,
  },
  {
    title: 'Rol Grupları',
    href: `${ADMIN_PANEL_PATH}/role-groups`,
    icon: Boxes,
    requiredPermission: SCOPES.ROLE_GROUP,
  },
  {
    title: 'Mail',
    href: `${ADMIN_PANEL_PATH}/mail`,
    icon: Mail,
    requiredPermission: SCOPES.MAIL,
  },
  {
    title: 'Email Logları',
    href: `${ADMIN_PANEL_PATH}/email-logs`,
    icon: FileText,
    requiredPermission: SCOPES.MAIL_LOG,
  },
  {
    title: 'Jobs',
    href: `${ADMIN_PANEL_PATH}/jobs`,
    icon: BriefcaseBusiness,
    requiredPermission: SCOPES.JOB,
  },
]

export const radioMobileItems: AdminNavItem[] = [
  {
    title: 'Android Release',
    href: `${ADMIN_PANEL_PATH}/radio-mobile/android-release`,
    icon: Package,
    requiredPermission: SCOPES.RADIO_MOBILE_ANDROID_RELEASE,
  },
  {
    title: 'Android Debug',
    href: `${ADMIN_PANEL_PATH}/radio-mobile/android-debug`,
    icon: Bug,
    requiredPermission: SCOPES.RADIO_MOBILE_ANDROID_DEBUG,
  },
  {
    title: 'iOS Release',
    href: `${ADMIN_PANEL_PATH}/radio-mobile/ios-release`,
    icon: Smartphone,
    requiredPermission: SCOPES.RADIO_MOBILE_IOS_RELEASE,
  },
  {
    title: 'iOS Debug',
    href: `${ADMIN_PANEL_PATH}/radio-mobile/ios-debug`,
    icon: Smartphone,
    requiredPermission: SCOPES.RADIO_MOBILE_IOS_DEBUG,
  },
  {
    title: 'API Anahtarları',
    href: `${ADMIN_PANEL_PATH}/radio-mobile/api-keys`,
    icon: KeyRound,
    requiredPermission: SCOPES.RADIO_MOBILE_API_KEY,
  },
]

export const japonOtoItems: AdminNavItem[] = [
  {
    title: 'İşlemler',
    href: `${ADMIN_PANEL_PATH}/japon-oto/operations`,
    icon: ClipboardList,
    requiredPermission: SCOPES.JAPON_OTO_OPERATIONS,
  },
  {
    title: 'Müşteriler',
    href: `${ADMIN_PANEL_PATH}/japon-oto/customers`,
    icon: Users,
    requiredPermission: SCOPES.JAPON_OTO_CUSTOMER,
  },
  {
    title: 'Araçlar',
    href: `${ADMIN_PANEL_PATH}/japon-oto/cars`,
    icon: Car,
    requiredPermission: SCOPES.JAPON_OTO_CAR,
  },
  {
    title: 'Servis',
    href: `${ADMIN_PANEL_PATH}/japon-oto/service`,
    icon: Wrench,
    requiredPermission: SCOPES.JAPON_OTO_SERVICE,
  },
  {
    title: 'Formen',
    href: `${ADMIN_PANEL_PATH}/japon-oto/formen`,
    icon: HardHat,
    requiredPermission: SCOPES.JAPON_OTO_FORMEN,
  },
]

const siteManagementReference: AdminNavItem = {
  title: 'Referanslar',
  href: `${ADMIN_PANEL_PATH}/reference`,
  icon: Handshake,
  requiredPermission: SCOPES.REFERENCE,
}

const siteManagementSlider: AdminNavItem = {
  title: 'Slider',
  href: `${ADMIN_PANEL_PATH}/slider`,
  icon: GalleryHorizontal,
  requiredPermission: SCOPES.SLIDER,
}

const siteManagementSiteSeo: AdminNavItem = {
  title: 'Site SEO',
  href: `${ADMIN_PANEL_PATH}/site-seo`,
  icon: Globe,
  requiredPermission: SCOPES.SITE_SEO,
}

const siteManagementHeader: AdminNavItem = {
  title: 'Header',
  href: `${ADMIN_PANEL_PATH}/header`,
  icon: PanelTop,
  requiredPermission: SCOPES.HEADER_NAV,
}

const siteManagementFooter: AdminNavItem = {
  title: 'Footer',
  href: `${ADMIN_PANEL_PATH}/footer`,
  icon: PanelBottom,
  requiredPermission: SCOPES.FOOTER_NAV,
}

const siteManagementAbout: AdminNavItem = {
  title: 'Hakkımızda',
  href: `${ADMIN_PANEL_PATH}/about`,
  icon: FileText,
  requiredPermission: SCOPES.ABOUT,
}

export type AdminNavSubgroup = {
  id: string
  label: string
  icon: LucideIcon
  items: AdminNavItem[]
}

/** Site yönetimi altında açılır-kapanır gruplar (birden fazla ilgili sayfa). */
export const siteManagementSubgroups: AdminNavSubgroup[] = [
  {
    id: 'media',
    label: 'Medya yönetimi',
    icon: Images,
    items: [
      {
        title: 'Medya Grupları',
        href: `${ADMIN_PANEL_PATH}/media-group`,
        icon: FolderTree,
        requiredPermission: SCOPES.MEDIA_GROUP,
      },
      {
        title: 'Medya',
        href: `${ADMIN_PANEL_PATH}/media`,
        icon: Images,
        requiredPermission: SCOPES.MEDIA,
      },
    ],
  },
  {
    id: 'blog',
    label: 'Blog yönetimi',
    icon: BookText,
    items: [
      {
        title: 'Blog Türleri',
        href: `${ADMIN_PANEL_PATH}/blog-type`,
        icon: Tags,
        requiredPermission: SCOPES.BLOG_TYPE,
      },
      {
        title: 'Blog',
        href: `${ADMIN_PANEL_PATH}/blog`,
        icon: BookText,
        requiredPermission: SCOPES.BLOG,
      },
    ],
  },
  {
    id: 'solution',
    label: 'Çözüm yönetimi',
    icon: LayoutGrid,
    items: [
      {
        title: 'Çözümler',
        href: `${ADMIN_PANEL_PATH}/solution`,
        icon: LayoutGrid,
        requiredPermission: SCOPES.SOLUTION,
      },
      {
        title: 'Çözüm grupları',
        href: `${ADMIN_PANEL_PATH}/solution/group`,
        icon: Layers,
        requiredPermission: SCOPES.SOLUTION_GROUP,
      },
      {
        title: 'Çözüm teknolojileri',
        href: `${ADMIN_PANEL_PATH}/solution/technology`,
        icon: Cpu,
        requiredPermission: SCOPES.SOLUTION_TECHNOLOGY,
      },
    ],
  },
]

/** Sidebar’da tek öğe ile alt grup sırası (Slider → Site SEO → Referanslar → …). */
export type SiteManagementNavBlock =
  | { type: 'item'; item: AdminNavItem }
  | { type: 'subgroup'; subgroup: AdminNavSubgroup }

export const siteManagementNavBlocks: SiteManagementNavBlock[] = [
  { type: 'item', item: siteManagementSlider },
  { type: 'item', item: siteManagementSiteSeo },
  { type: 'item', item: siteManagementHeader },
  { type: 'item', item: siteManagementFooter },
  { type: 'item', item: siteManagementAbout },
  { type: 'item', item: siteManagementReference },
  {
    type: 'subgroup',
    subgroup: siteManagementSubgroups.find((g) => g.id === 'media')!,
  },
  {
    type: 'subgroup',
    subgroup: siteManagementSubgroups.find((g) => g.id === 'blog')!,
  },
  {
    type: 'subgroup',
    subgroup: siteManagementSubgroups.find((g) => g.id === 'solution')!,
  },
]

/** Site yönetimi menüsünde arama ve aktif rota için düz liste (görünüm sırasıyla). */
export function getAllSiteManagementNavItems(): AdminNavItem[] {
  const mediaItems =
    siteManagementSubgroups.find((g) => g.id === 'media')?.items ?? []
  const blogItems =
    siteManagementSubgroups.find((g) => g.id === 'blog')?.items ?? []
  const solutionItems =
    siteManagementSubgroups.find((g) => g.id === 'solution')?.items ?? []
  return [
    siteManagementSlider,
    siteManagementSiteSeo,
    siteManagementHeader,
    siteManagementFooter,
    siteManagementAbout,
    siteManagementReference,
    ...mediaItems,
    ...blogItems,
    ...solutionItems,
  ]
}

/** Üst menü grupları (etiket + ikon) */
export const adminNavGroupMeta = {
  general: {
    id: 'general' as const,
    label: 'Panel yönetimi',
    icon: GitBranch,
  },
  siteManagement: {
    id: 'siteManagement' as const,
    label: 'Site yönetimi',
    icon: Globe,
  },
  japonOto: {
    id: 'japonOto' as const,
    label: 'Japon Oto yönetimi',
    icon: Car,
  },
  radioMobile: {
    id: 'radioMobile' as const,
    label: 'Radio Mobil Uygulamaları',
    icon: Smartphone,
  },
}

export function getAllAdminNavItems(): AdminNavItem[] {
  return [
    ...navigationItems,
    ...generalItems,
    ...getAllSiteManagementNavItems(),
    ...japonOtoItems,
    ...radioMobileItems,
  ]
}
