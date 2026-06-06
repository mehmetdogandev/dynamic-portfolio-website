import { WebsiteReferenceFlipGrid } from '@/components/website/references/website-reference-flip-grid'
import { SectionTitle } from '@/components/website/ui/section-title'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { getPublicReferences } from '@/lib/data/website-references'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'referanslar')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: item.title,
    descriptionFallback: item.subtitle ?? 'İş birlikleri ve referanslarım.',
    canonicalSegment: 'referanslar',
  })
}

export default async function ReferanslarPage() {
  const references = await getPublicReferences()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <RevealOnScroll variant="fadeUp">
        <SectionTitle
          title={item.title}
          subtitle={item.subtitle}
          className="mb-10"
        />
      </RevealOnScroll>
      <RevealOnScroll variant="slideUp" delay={0.08}>
        <WebsiteReferenceFlipGrid references={references} />
      </RevealOnScroll>
    </div>
  )
}
