import type { MetadataRoute } from 'next'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { getSiteOrigin } from '@/lib/seo/build-page-metadata'

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()
  const sitemapUrl = origin ? `${origin}/sitemap.xml` : undefined
  const adminPath = ADMIN_PANEL_PATH.startsWith('/')
    ? ADMIN_PANEL_PATH
    : `/${ADMIN_PANEL_PATH}`

  if (process.env.ROBOTS_DISALLOW_ALL === '1') {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap: sitemapUrl,
    }
  }

  if (!origin) {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: undefined,
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [adminPath, `${adminPath}/`],
      },
    ],
    sitemap: sitemapUrl,
  }
}
