import 'server-only'

import type { BlogContent } from '@/lib/blog/content'
import { trpc } from '@/lib/trpc/server'
import type { WebsiteProject } from '@/lib/website/types'

export async function getPublicProjects(): Promise<WebsiteProject[]> {
  const rows = await trpc.project.listPublic()
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.excerpt,
    content: row.content as BlogContent,
    imageSrc: row.imageSrc ?? '/logo.jpeg',
    tags: row.tags,
    sector: row.sector,
    isFeatured: row.isFeatured,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    robotsIndex: row.robotsIndex,
    coverImageAlt: row.coverImageAlt,
  }))
}

export async function getFeaturedProjectTeaser(): Promise<WebsiteProject | null> {
  const all = await getPublicProjects()
  return all.find((project) => project.isFeatured) ?? all[0] ?? null
}
