import 'server-only'

import type { Metadata } from 'next'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'
import {
  absoluteFileViewUrl,
  buildPageMetadata,
  getSiteOrigin,
  publicCanonicalPathname,
} from '@/lib/seo/build-page-metadata'

/** Statik ve liste sayfaları için varsayılan site SEO ile `Metadata` üretir. */
export async function marketingPageMetadata(input: {
  title: string
  descriptionFallback: string
  /** Örn. `hakkimizda`, `blog`, `blog/yazi-slug` */
  canonicalSegment: string
  /** Kapak veya sayfa görseli `/api/files/...` yolu; yoksa site varsayılan OG */
  ogImagePath?: string | null
}): Promise<Metadata> {
  const site = await getPublicSiteSeo()
  const origin = getSiteOrigin()
  const description =
    site?.defaultMetaDescription?.trim() || input.descriptionFallback
  const ogPath = input.ogImagePath ?? site?.defaultOgImageViewUrl ?? null
  return buildPageMetadata({
    title: input.title,
    description,
    canonicalPathname: publicCanonicalPathname(input.canonicalSegment),
    ogImageAbsoluteUrl: ogPath ? absoluteFileViewUrl(origin, ogPath) : null,
    twitterSite: site?.twitterSite ?? null,
    googleSiteVerification: site?.googleSiteVerification,
  })
}
