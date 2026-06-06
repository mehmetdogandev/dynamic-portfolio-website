import 'server-only'

import type { BlogContent } from '@/lib/blog/content'
import { trpc } from '@/lib/trpc/server'
import type { WebsiteSolution } from '@/lib/website/types'

export async function getPublicSolutions(): Promise<WebsiteSolution[]> {
  const rows = await trpc.solution.listPublic()
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

export async function getFeaturedSolutionTeaser(): Promise<WebsiteSolution | null> {
  const all = await getPublicSolutions()
  return all.find((solution) => solution.isFeatured) ?? all[0] ?? null
}
