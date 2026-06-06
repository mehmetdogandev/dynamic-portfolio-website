import 'server-only'
import { asc } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import {
  aboutExperience,
  aboutExpertise,
  aboutInterest,
  aboutPageProfile,
  aboutTechnology,
} from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { BlogContent } from '@/lib/blog/content'
import type { WebsiteAboutPreview } from '@/lib/website/types'

function htmlToSummary(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > 240 ? `${text.slice(0, 237)}...` : text
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraphHtml(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return `<p>${escapeHtml(trimmed)}</p>`
}

function composeProfileHtml(profile: {
  intro: string
  introPart2: string | null
  introPart3: string | null
  introPart4: string | null
}): string {
  return [
    paragraphHtml(profile.intro),
    paragraphHtml(profile.introPart2),
    paragraphHtml(profile.introPart3),
    paragraphHtml(profile.introPart4),
  ]
    .filter(Boolean)
    .join('')
}

export async function getPublishedAboutPreview(): Promise<WebsiteAboutPreview | null> {
  const db = getDbConnection()
  const row = await db
    .select({
      lead: aboutPageProfile.lead,
      intro: aboutPageProfile.intro,
      introPart2: aboutPageProfile.introPart2,
      introPart3: aboutPageProfile.introPart3,
      introPart4: aboutPageProfile.introPart4,
    })
    .from(aboutPageProfile)
    .where(excludeDeleted(aboutPageProfile))
    .limit(1)
    .then((items) => items[0] ?? null)

  if (!row) return null

  const html = composeProfileHtml(row)
  return {
    title: row.lead,
    summary: htmlToSummary(html),
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

export type WebsitePublishedAboutBundle = {
  profile: {
    lead: string
    intro: string
    introPart2: string | null
    introPart3: string | null
    introPart4: string | null
    seoTitle: string | null
    seoDescription: string | null
    robotsIndex: boolean
    updatedAt: Date
  }
  experiences: Array<{
    id: string
    title: string
    company: string
    location: string | null
    startDate: string
    endDate: string | null
    description: string | null
    fileId: string | null
  }>
  expertise: Array<{
    id: string
    title: string
    description: string
    keywords: string[]
  }>
  technologies: Array<{
    id: string
    category: string
    name: string
  }>
  interests: Array<{
    id: string
    label: string
  }>
}

export async function getPublishedAboutPage(): Promise<WebsitePublishedAbout | null> {
  const bundle = await getPublishedAboutBundle()
  if (!bundle) return null

  const html = composeProfileHtml(bundle.profile)
  return {
    title: bundle.profile.lead,
    slug: 'hakkimda',
    content: {
      type: 'doc',
      version: 1,
      html,
      imageFileIds: [],
      videoFileIds: [],
    },
    seoTitle: bundle.profile.seoTitle,
    seoDescription: bundle.profile.seoDescription,
    robotsIndex: bundle.profile.robotsIndex,
    updatedAt: bundle.profile.updatedAt,
  }
}

export async function getPublishedAboutBundle(): Promise<WebsitePublishedAboutBundle | null> {
  const db = getDbConnection()

  const profile = await db
    .select({
      lead: aboutPageProfile.lead,
      intro: aboutPageProfile.intro,
      introPart2: aboutPageProfile.introPart2,
      introPart3: aboutPageProfile.introPart3,
      introPart4: aboutPageProfile.introPart4,
      seoTitle: aboutPageProfile.seoTitle,
      seoDescription: aboutPageProfile.seoDescription,
      robotsIndex: aboutPageProfile.robotsIndex,
      updatedAt: aboutPageProfile.updatedAt,
    })
    .from(aboutPageProfile)
    .where(excludeDeleted(aboutPageProfile))
    .limit(1)
    .then((items) => items[0] ?? null)

  if (!profile) return null

  const [experiences, expertise, technologies, interests] = await Promise.all([
    db
      .select({
        id: aboutExperience.id,
        title: aboutExperience.title,
        company: aboutExperience.company,
        location: aboutExperience.location,
        startDate: aboutExperience.startDate,
        endDate: aboutExperience.endDate,
        description: aboutExperience.description,
        fileId: aboutExperience.fileId,
      })
      .from(aboutExperience)
      .where(excludeDeleted(aboutExperience))
      .orderBy(asc(aboutExperience.sortOrder)),
    db
      .select({
        id: aboutExpertise.id,
        title: aboutExpertise.title,
        description: aboutExpertise.description,
        keywords: aboutExpertise.keywords,
      })
      .from(aboutExpertise)
      .where(excludeDeleted(aboutExpertise))
      .orderBy(asc(aboutExpertise.sortOrder)),
    db
      .select({
        id: aboutTechnology.id,
        category: aboutTechnology.category,
        name: aboutTechnology.name,
      })
      .from(aboutTechnology)
      .where(excludeDeleted(aboutTechnology))
      .orderBy(asc(aboutTechnology.sortOrder)),
    db
      .select({
        id: aboutInterest.id,
        label: aboutInterest.label,
      })
      .from(aboutInterest)
      .where(excludeDeleted(aboutInterest))
      .orderBy(asc(aboutInterest.sortOrder)),
  ])

  return {
    profile,
    experiences,
    expertise: expertise.map((row) => ({
      ...row,
      keywords: row.keywords ?? [],
    })),
    technologies,
    interests,
  }
}
