import 'server-only'

import { and, asc, eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { footerSocialLink, siteNavLink } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import {
  getEnvFooterSocialFallback,
  getSocialDisplayName,
  isFooterSocialKnownPlatform,
} from '@/lib/website/social-platforms'

export type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'

export type PublicNavLink = {
  label: string
  href: string
  openInNewTab: boolean
}

function fallbackNavLinks(): PublicNavLink[] {
  return WEBSITE_MAIN_NAV.map((item) => ({
    label: item.navLabel,
    href: item.href,
    openInNewTab: false,
  }))
}

async function getPublicNavByPlacement(
  placement: 'HEADER' | 'FOOTER'
): Promise<PublicNavLink[]> {
  const db = getDbConnection()
  const rows = await db
    .select({
      label: siteNavLink.label,
      href: siteNavLink.href,
      openInNewTab: siteNavLink.openInNewTab,
    })
    .from(siteNavLink)
    .where(
      and(
        eq(siteNavLink.placement, placement),
        eq(siteNavLink.isActive, true),
        excludeDeleted(siteNavLink)
      )
    )
    .orderBy(asc(siteNavLink.sortOrder), asc(siteNavLink.createdAt))

  if (rows.length === 0) {
    return fallbackNavLinks()
  }

  return rows.map((row) => ({
    label: row.label,
    href: row.href,
    openInNewTab: row.openInNewTab,
  }))
}

export async function getPublicHeaderNav(): Promise<PublicNavLink[]> {
  return getPublicNavByPlacement('HEADER')
}

export async function getPublicFooterNav(): Promise<PublicNavLink[]> {
  return getPublicNavByPlacement('FOOTER')
}

export async function getPublicFooterSocials(): Promise<
  PublicFooterSocialLink[]
> {
  const db = getDbConnection()
  const rows = await db
    .select({
      platform: footerSocialLink.platform,
      customLabel: footerSocialLink.customLabel,
      url: footerSocialLink.url,
      type: footerSocialLink.type,
      iconFileId: footerSocialLink.iconFileId,
    })
    .from(footerSocialLink)
    .where(
      and(eq(footerSocialLink.isActive, true), excludeDeleted(footerSocialLink))
    )
    .orderBy(asc(footerSocialLink.sortOrder), asc(footerSocialLink.createdAt))

  if (rows.length === 0) {
    return getEnvFooterSocialFallback().map((item) => ({
      kind: 'lucide' as const,
      platform: item.platform,
      url: item.url,
      label: item.label,
    }))
  }

  return rows
    .map((row): PublicFooterSocialLink | null => {
      const label = getSocialDisplayName(row.platform, row.customLabel)

      if (row.type === 'IMAGE' && row.iconFileId && row.platform === 'OTHER') {
        return {
          kind: 'image',
          platform: 'OTHER',
          url: row.url,
          label,
          imageUrl: `/api/files/${row.iconFileId}/view`,
        }
      }

      if (isFooterSocialKnownPlatform(row.platform)) {
        return {
          kind: 'lucide',
          platform: row.platform,
          url: row.url,
          label,
        }
      }

      return null
    })
    .filter((item): item is PublicFooterSocialLink => item !== null)
}
