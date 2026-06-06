import type { BlogContent } from '@/lib/blog/content'

export type AdminBlogRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: BlogContent
  categoryId: string | null
  categoryName: string | null
  fileId: string | null
  fileName: string | null
  isPublished: boolean
  isFeatured: boolean
  viewCount: number
  publishedAt: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  fileViewUrl: string | null
}
