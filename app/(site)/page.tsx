import { HomeHeroSlider } from '@/components/website/home/home-hero-slider'
import { HomeStats } from '@/components/website/home/home-stats'
import { FeaturedProjects } from '@/components/website/home/featured-projects'
import { HomeHighlights } from '@/components/website/home/home-highlights'
import { BlogPreview } from '@/components/website/home/blog-preview'
import { HomeAboutTeaser } from '@/components/website/home/home-about-teaser'
import { CtaSection } from '@/components/website/home/cta-section'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { getPublishedAboutPreview } from '@/lib/data/website-about'
import { getPublicBlogPosts } from '@/lib/data/website-blog'
import { getPublicHomeHighlights } from '@/lib/data/website-home-highlights'
import { getPublishedHomeStatSet } from '@/lib/data/website-home-stats'
import { getPublicProjects } from '@/lib/data/website-projects'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'
import { buildOrganizationAndWebSiteJsonLd } from '@/lib/seo/json-ld'
import { publicSiteHomeUrl } from '@/lib/seo/build-page-metadata'
import { WebsiteJsonLdScript } from '@/components/website/seo/website-json-ld'

export async function generateMetadata() {
  return marketingPageMetadata({
    title: PORTFOLIO_CONFIG.name,
    descriptionFallback: PORTFOLIO_CONFIG.description,
    canonicalSegment: '',
  })
}

export default async function WebsiteHomePage() {
  const [
    projects,
    blogPosts,
    aboutPreview,
    siteSeo,
    homeStats,
    homeHighlights,
  ] = await Promise.all([
    getPublicProjects(),
    getPublicBlogPosts(),
    getPublishedAboutPreview(),
    getPublicSiteSeo(),
    getPublishedHomeStatSet(),
    getPublicHomeHighlights(),
  ])

  const fallbackHighlightIcons = ['code2', 'database', 'cpu', 'bot'] as const
  const stats =
    homeStats ??
    PORTFOLIO_CONFIG.stats.map((s) => ({
      value: s.value,
      label: s.label,
      href: s.href,
    }))
  const highlights =
    homeHighlights.length > 0
      ? homeHighlights
      : PORTFOLIO_CONFIG.highlights.map((h, index) => ({
          title: h.title,
          description: h.desc,
          iconKey: fallbackHighlightIcons[index] ?? 'code2',
        }))

  const siteUrl = publicSiteHomeUrl()
  const orgJson =
    siteUrl && siteSeo?.organizationName?.trim()
      ? buildOrganizationAndWebSiteJsonLd({
          siteUrl,
          organizationName: siteSeo.organizationName.trim(),
          description: siteSeo.defaultMetaDescription,
          sameAs: siteSeo.sameAs,
        })
      : null

  return (
    <>
      {orgJson ? <WebsiteJsonLdScript json={orgJson} /> : null}
      <HomeHeroSlider />
      <RevealOnScroll variant="scaleIn" delay={0.03}>
        <HomeStats stats={stats} />
      </RevealOnScroll>
      <RevealOnScroll variant="slideLeft" delay={0.05}>
        <FeaturedProjects projects={projects} />
      </RevealOnScroll>
      <RevealOnScroll variant="slideLeft" delay={0.05}>
        <HomeHighlights highlights={highlights} />
      </RevealOnScroll>
      <RevealOnScroll variant="fadeUp" delay={0.05}>
        <BlogPreview posts={blogPosts} />
      </RevealOnScroll>
      {aboutPreview ? (
        <RevealOnScroll variant="slideLeft" delay={0.06}>
          <HomeAboutTeaser lead={aboutPreview.title} />
        </RevealOnScroll>
      ) : null}
      <RevealOnScroll variant="scaleIn" delay={0.1}>
        <CtaSection />
      </RevealOnScroll>
    </>
  )
}
