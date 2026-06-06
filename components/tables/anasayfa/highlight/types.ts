import type { HomeHighlightIconKey } from '@/lib/website/home-highlight-icons'

export type AdminHomeHighlightRow = {
  id: string
  title: string
  description: string
  iconKey: HomeHighlightIconKey | string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
