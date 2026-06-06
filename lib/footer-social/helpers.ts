import { and, eq, ne, sql } from 'drizzle-orm'
import { footerSocialLink } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { Context } from '@/lib/trpc'
import {
  getSocialDisplayName,
  type FooterSocialPlatform,
} from '@/lib/website/social-platforms'

type FooterSocialDb = Pick<Context['db'], 'update' | 'select'>

export function normalizeCustomLabel(
  platform: FooterSocialPlatform,
  customLabel: string | null | undefined
): string | null {
  if (platform !== 'OTHER') return null
  return customLabel?.trim() || null
}

export function siblingMatchCondition(
  platform: FooterSocialPlatform,
  customLabel: string | null
) {
  const labelKey = sql`coalesce(${footerSocialLink.customLabel}, '')`
  const targetKey = customLabel ?? ''
  return and(
    eq(footerSocialLink.platform, platform),
    sql`${labelKey} = ${targetKey}`
  )
}

export async function deactivateActiveSiblings(
  db: FooterSocialDb,
  params: {
    platform: FooterSocialPlatform
    customLabel: string | null
    excludeId?: string
  }
): Promise<void> {
  const conditions = [
    siblingMatchCondition(params.platform, params.customLabel),
    eq(footerSocialLink.isActive, true),
    excludeDeleted(footerSocialLink),
  ]
  if (params.excludeId) {
    conditions.push(ne(footerSocialLink.id, params.excludeId))
  }

  await db
    .update(footerSocialLink)
    .set({ isActive: false })
    .where(and(...conditions))
}

export async function findActiveSibling(
  db: FooterSocialDb,
  params: {
    platform: FooterSocialPlatform
    customLabel: string | null
    excludeId?: string
  }
): Promise<{ id: string; displayName: string } | null> {
  const conditions = [
    siblingMatchCondition(params.platform, params.customLabel),
    eq(footerSocialLink.isActive, true),
    excludeDeleted(footerSocialLink),
  ]
  if (params.excludeId) {
    conditions.push(ne(footerSocialLink.id, params.excludeId))
  }

  const row = await db
    .select({
      id: footerSocialLink.id,
      platform: footerSocialLink.platform,
      customLabel: footerSocialLink.customLabel,
    })
    .from(footerSocialLink)
    .where(and(...conditions))
    .limit(1)
    .then((rows) => rows[0])

  if (!row) return null

  return {
    id: row.id,
    displayName: getSocialDisplayName(row.platform, row.customLabel),
  }
}

export { getSocialDisplayName }
