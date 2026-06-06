import 'server-only'

import { and, count, eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { aboutExperience, homeStatSet, reference } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'

export type WebsiteHomeStat = {
  value: string
  label: string
  href?: string | null
}

export async function getPublishedHomeStatSet(): Promise<
  WebsiteHomeStat[] | null
> {
  const db = getDbConnection()

  const row = await db
    .select({
      yearsExperienceValue: homeStatSet.yearsExperienceValue,
      yearsExperienceLabel: homeStatSet.yearsExperienceLabel,
      yearsExperienceHref: homeStatSet.yearsExperienceHref,
      experienceCountValue: homeStatSet.experienceCountValue,
      experienceCountLabel: homeStatSet.experienceCountLabel,
      experienceCountHref: homeStatSet.experienceCountHref,
      experienceCountSource: homeStatSet.experienceCountSource,
      companyCountValue: homeStatSet.companyCountValue,
      companyCountLabel: homeStatSet.companyCountLabel,
      companyCountHref: homeStatSet.companyCountHref,
      companyCountSource: homeStatSet.companyCountSource,
      studentsTaughtValue: homeStatSet.studentsTaughtValue,
      studentsTaughtLabel: homeStatSet.studentsTaughtLabel,
      studentsTaughtHref: homeStatSet.studentsTaughtHref,
    })
    .from(homeStatSet)
    .where(
      and(eq(homeStatSet.status, 'PUBLISHED'), excludeDeleted(homeStatSet))
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!row) return null

  const [experienceCountResult, referenceCountResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(aboutExperience)
      .where(excludeDeleted(aboutExperience)),
    db
      .select({ count: count() })
      .from(reference)
      .where(excludeDeleted(reference)),
  ])

  const experienceCount = experienceCountResult[0]?.count ?? 0
  const referenceCount = referenceCountResult[0]?.count ?? 0

  const experienceValue =
    row.experienceCountSource === 'AUTO_EXPERIENCE_COUNT'
      ? String(experienceCount)
      : row.experienceCountValue

  const companyValue =
    row.companyCountSource === 'AUTO_REFERENCE_COUNT'
      ? String(referenceCount)
      : row.companyCountValue

  return [
    {
      value: row.yearsExperienceValue,
      label: row.yearsExperienceLabel,
      href: row.yearsExperienceHref,
    },
    {
      value: experienceValue,
      label: row.experienceCountLabel,
      href: row.experienceCountHref,
    },
    {
      value: companyValue,
      label: row.companyCountLabel,
      href: row.companyCountHref,
    },
    {
      value: row.studentsTaughtValue,
      label: row.studentsTaughtLabel,
      href: row.studentsTaughtHref,
    },
  ]
}
