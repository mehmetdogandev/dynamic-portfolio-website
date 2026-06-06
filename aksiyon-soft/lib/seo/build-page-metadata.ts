import type { Metadata } from 'next'
import { WEBSITE_BASE } from '@/lib/website/site-nav'

/** Tam site kökü (protokol + host), sonunda `/` yok. */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return ''
  return raw.replace(/\/+$/, '')
}

/** `WEBSITE_BASE` + path ile kanonik pathname (ör. `/kurumsal/blog/x`). */
export function publicCanonicalPathname(pathSegment: string): string {
  const seg = pathSegment.replace(/^\//, '')
  if (!WEBSITE_BASE) return `/${seg}`
  return `${WEBSITE_BASE}/${seg}`.replace(/\/+/g, '/')
}

export function toAbsoluteUrl(origin: string, pathname: string): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (!origin) return p
  return `${origin}${p}`
}

/** Kamu ana sayfanın tam URL’si (`NEXT_PUBLIC_SITE_URL` + `WEBSITE_BASE`). */
export function publicSiteHomeUrl(): string {
  const origin = getSiteOrigin()
  if (!origin) return ''
  return toAbsoluteUrl(origin, publicCanonicalPathname(''))
}

/** `/api/files/.../view` gibi yolları site kökü ile mutlak URL yapar. */
export function absoluteFileViewUrl(
  origin: string,
  viewPath: string | null | undefined
): string | undefined {
  if (!origin || !viewPath?.startsWith('/')) return undefined
  return toAbsoluteUrl(origin, viewPath)
}

export type BuildPageMetadataInput = {
  /** `<title>` / OG title (şablon dışı kısa başlık) */
  title: string
  description: string
  /** Kanonik için site içi path: `publicCanonicalPathname('blog/slug')` */
  canonicalPathname: string
  /** Mutlak OG görsel URL; yoksa OG image set edilmez */
  ogImageAbsoluteUrl?: string | null
  /** false ise noindex,nofollow */
  robotsIndex?: boolean
  /** `metadataBase` / twitter:site için */
  twitterSite?: string | null
  /** Search Console doğrulama kodu (meta tag) */
  googleSiteVerification?: string | null
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const origin = getSiteOrigin()
  const canonical = origin
    ? toAbsoluteUrl(origin, input.canonicalPathname)
    : undefined
  const robotsIndex = input.robotsIndex !== false

  const meta: Metadata = {
    title: input.title,
    description: input.description,
    robots: robotsIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  }

  const g = input.googleSiteVerification?.trim()
  if (g) {
    meta.verification = { google: g }
  }

  if (canonical) {
    meta.alternates = { canonical }
  }

  if (origin && input.ogImageAbsoluteUrl) {
    meta.openGraph = {
      type: 'website',
      url: canonical,
      title: input.title,
      description: input.description,
      images: [{ url: input.ogImageAbsoluteUrl }],
    }
    meta.twitter = {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [input.ogImageAbsoluteUrl],
    }
    if (input.twitterSite?.trim()) {
      meta.twitter.site = input.twitterSite.trim()
    }
  } else if (origin) {
    meta.openGraph = {
      type: 'website',
      url: canonical,
      title: input.title,
      description: input.description,
    }
    meta.twitter = {
      card: 'summary',
      title: input.title,
      description: input.description,
    }
    if (input.twitterSite?.trim()) {
      meta.twitter.site = input.twitterSite.trim()
    }
  }

  return meta
}
