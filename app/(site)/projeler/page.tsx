import { WebsiteProjectGrid } from '@/components/website/projeler/website-project-grid'
import { SectionTitle } from '@/components/website/ui/section-title'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { getPublicProjects } from '@/lib/data/website-projects'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'projeler')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Projeler',
    descriptionFallback:
      'Geliştirdiğim yazılım projeleri, teknoloji yığınları ve çalışma örnekleri.',
    canonicalSegment: 'projeler',
  })
}

export default async function ProjelerPage() {
  const projects = await getPublicProjects()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <RevealOnScroll variant="fadeUp">
        <SectionTitle
          title={item.title}
          subtitle="Geliştirdiğim yazılım projeleri"
          className="mb-12"
        />
      </RevealOnScroll>

      <RevealOnScroll variant="slideLeft" delay={0.06}>
        <WebsiteProjectGrid projects={projects} />
      </RevealOnScroll>
    </div>
  )
}
