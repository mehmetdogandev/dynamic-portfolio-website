import type { MetadataRoute } from 'next'
import { getPublicBlogPosts } from '@/lib/data/website-blog'
import { getPublicSolutions } from '@/lib/data/website-solutions'
import { getSiteOrigin } from '@/lib/seo/build-page-metadata'
import { WEBSITE_MAIN_NAV, sitePath } from '@/lib/website/site-nav'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin()
  if (!origin) return []

  const lastMod = new Date()
  const out: MetadataRoute.Sitemap = []
  const seen = new Set<string>()

  const addPath = (relativeFromRoot: string) => {
    const path = sitePath(relativeFromRoot)
    const url = `${origin}${path.startsWith('/') ? path : `/${path}`}`
    if (seen.has(url)) return
    seen.add(url)
    out.push({ url, lastModified: lastMod })
  }

  addPath('')
  for (const nav of WEBSITE_MAIN_NAV) {
    const path = nav.href.startsWith('/') ? nav.href : `/${nav.href}`
    const url = `${origin}${path}`
    if (seen.has(url)) continue
    seen.add(url)
    out.push({ url, lastModified: lastMod })
  }

  const [posts, solutions] = await Promise.all([
    getPublicBlogPosts(),
    getPublicSolutions(),
  ])

  for (const p of posts) {
    addPath(`blog/${p.slug}`)
  }
  for (const s of solutions) {
    addPath(`solution/${s.slug}`)
  }

  return out
}
