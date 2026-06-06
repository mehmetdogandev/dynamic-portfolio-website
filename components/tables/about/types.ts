import type { BlogContent } from '@/lib/blog/content'

export type AdminAboutRow = {
  id: string
  title: string
  slug: string
  content: BlogContent
  isPublished: boolean
  publishedAt: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  seoTitle: string | null
  seoDescription: string | null
  robotsIndex: boolean
}
