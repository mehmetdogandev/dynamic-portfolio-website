import 'server-only'
import { and, eq } from 'drizzle-orm'
import { normalizeBlogContent } from '@/lib/blog/content'
import { getDbConnection } from '@/lib/db'
import { about } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { WebsiteAboutPreview } from '@/lib/website/types'
import type { BlogContent } from '@/lib/blog/content'

function htmlToSummary(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > 240 ? `${text.slice(0, 237)}...` : text
}

export async function getPublishedAboutPreview(): Promise<WebsiteAboutPreview | null> {
  const db = getDbConnection()
  const row = await db
    .select({
      title: about.title,
      content: about.content,
    })
    .from(about)
    .where(and(excludeDeleted(about), eq(about.isPublished, true)))
    .limit(1)
    .then((items) => items[0] ?? null)

  if (!row) return null
  const normalized = normalizeBlogContent(row.content, {
    stripEditorChrome: true,
  })
  return {
    title: row.title,
    summary: htmlToSummary(normalized.html),
  }
}

export type WebsitePublishedAbout = {
  title: string
  slug: string
  content: BlogContent
  seoTitle: string | null
  seoDescription: string | null
  robotsIndex: boolean
  updatedAt: Date
}

export async function getPublishedAboutPage(): Promise<WebsitePublishedAbout | null> {
  const db = getDbConnection()
  const row = await db
    .select({
      title: about.title,
      slug: about.slug,
      content: about.content,
      seoTitle: about.seoTitle,
      seoDescription: about.seoDescription,
      robotsIndex: about.robotsIndex,
      updatedAt: about.updatedAt,
    })
    .from(about)
    .where(and(excludeDeleted(about), eq(about.isPublished, true)))
    .limit(1)
    .then((items) => items[0] ?? null)

  if (!row) return null

  return {
    ...row,
    content: normalizeBlogContent(row.content, { stripEditorChrome: true }),
  }
}
