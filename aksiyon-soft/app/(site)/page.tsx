import { WebsiteHero } from '@/components/website/home/website-hero'
import { WebsiteHomeServices } from '@/components/website/home/website-home-services'
import { WebsiteHomeTeasers } from '@/components/website/home/website-home-teasers'
import { WebsiteHomeContactCta } from '@/components/website/home/website-home-contact-cta'
import { getPublicHomeHeroData } from '@/lib/data/website-hero-slides'
import { getPublicReferences } from '@/lib/data/website-references'
import { getPublicMediaPreview } from '@/lib/data/website-media'
import { getPublicBlogPosts } from '@/lib/data/website-blog'
import { getFeaturedSolutionTeaser } from '@/lib/data/website-solutions'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'
import { buildOrganizationAndWebSiteJsonLd } from '@/lib/seo/json-ld'
import { publicSiteHomeUrl } from '@/lib/seo/build-page-metadata'
import { WebsiteJsonLdScript } from '@/components/website/seo/website-json-ld'

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Kurumsal yazılım',
    descriptionFallback:
      'Firmalara özel yazılım geliştirme, kurumsal uygulamalar ve sürdürülebilir dijital çözümler.',
    canonicalSegment: '',
  })
}

export default async function WebsiteHomePage() {
  const [
    references,
    galleryPreview,
    hero,
    blogPosts,
    solutionPreview,
    siteSeo,
  ] = await Promise.all([
    getPublicReferences(),
    getPublicMediaPreview(),
    getPublicHomeHeroData(),
    getPublicBlogPosts(),
    getFeaturedSolutionTeaser(),
    getPublicSiteSeo(),
  ])
  const referencePreview = references[0] ?? null
  const blogPreview = blogPosts[0] ?? null
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
      {hero.slides.length > 0 ? (
        <WebsiteHero
          slides={hero.slides}
          type={hero.type}
          autoplayInterval={hero.autoplayInterval}
        />
      ) : null}
      <WebsiteHomeServices />
      <WebsiteHomeTeasers
        referencePreview={referencePreview}
        galleryPreview={galleryPreview}
        blogPreview={blogPreview}
        solutionPreview={solutionPreview}
      />
      <WebsiteHomeContactCta />
    </>
  )
}
