import type { BlogContent } from '@/lib/blog/content'

export type AdminProjectRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: BlogContent
  groupId: string | null
  groupName: string | null
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
  technologyIds: string[]
  technologyNames: string[]
}
