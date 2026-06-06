import 'server-only'

import { eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { file, siteSeo } from '@/lib/db/schema'

export type PublicSiteSeo = {
  defaultMetaDescription: string | null
  defaultOgImageViewUrl: string | null
  organizationName: string | null
  sameAs: string[]
  twitterSite: string | null
  googleSiteVerification: string | null
}

export async function getPublicSiteSeo(): Promise<PublicSiteSeo | null> {
  const db = getDbConnection()
  const [row] = await db
    .select({
      defaultMetaDescription: siteSeo.defaultMetaDescription,
      defaultOgImageFileId: siteSeo.defaultOgImageFileId,
      organizationName: siteSeo.organizationName,
      sameAsJson: siteSeo.sameAsJson,
      twitterSite: siteSeo.twitterSite,
      googleSiteVerification: siteSeo.googleSiteVerification,
    })
    .from(siteSeo)
    .limit(1)

  if (!row) return null

  let defaultOgImageViewUrl: string | null = null
  if (row.defaultOgImageFileId) {
    const [f] = await db
      .select({ id: file.id })
      .from(file)
      .where(eq(file.id, row.defaultOgImageFileId))
      .limit(1)
    if (f) {
      defaultOgImageViewUrl = `/api/files/${f.id}/view`
    }
  }

  const sameAs = Array.isArray(row.sameAsJson)
    ? row.sameAsJson.filter((u): u is string => typeof u === 'string')
    : []

  return {
    defaultMetaDescription: row.defaultMetaDescription,
    defaultOgImageViewUrl,
    organizationName: row.organizationName,
    sameAs,
    twitterSite: row.twitterSite,
    googleSiteVerification: row.googleSiteVerification,
  }
}
