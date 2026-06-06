export type AdminSiteNavRow = {
  id: string
  label: string
  href: string
  sortOrder: number
  isActive: boolean
  openInNewTab: boolean
  createdAt: Date
  updatedAt: Date
}

export type SiteNavVariant = 'header' | 'footer'
