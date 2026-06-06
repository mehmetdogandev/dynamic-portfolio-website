import { WebsiteSolutionGrid } from '@/components/website/solution/website-solution-grid'
import { WebsitePageScaffold } from '@/components/website/shared/website-page-scaffold'
import { getPublicSolutions } from '@/lib/data/website-solutions'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'solution')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Çözümlerimiz',
    descriptionFallback: 'Seçili kurumsal çözümler ve teknoloji yığınları.',
    canonicalSegment: 'solution',
  })
}

export default async function SolutionPage() {
  const solutions = await getPublicSolutions()
  return (
    <WebsitePageScaffold item={item}>
      <WebsiteSolutionGrid solutions={solutions} />
    </WebsitePageScaffold>
  )
}
