import { GallerySlider } from '@/components/website/galeri/gallery-slider'
import { SectionTitle } from '@/components/website/ui/section-title'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { getPublicMediaGroups } from '@/lib/data/website-media'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'galeri')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: item.title,
    descriptionFallback:
      item.subtitle ??
      'Konferanslar, projeler ve topluluk etkinliklerinden görüntüler.',
    canonicalSegment: 'galeri',
  })
}

export default async function GaleriPage() {
  const groups = await getPublicMediaGroups()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <RevealOnScroll variant="fadeUp">
        <SectionTitle
          title={item.title}
          subtitle={item.subtitle}
          className="mb-12"
        />
      </RevealOnScroll>

      <div className="space-y-12">
        {groups.map((group, i) => (
          <RevealOnScroll
            key={group.id}
            variant={i % 2 === 0 ? 'slideLeft' : 'fadeUp'}
            delay={0.05 + i * 0.06}
          >
            <GallerySlider group={group} />
          </RevealOnScroll>
        ))}
      </div>
    </div>
  )
}
