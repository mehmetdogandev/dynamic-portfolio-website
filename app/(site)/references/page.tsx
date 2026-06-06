import { WebsitePageScaffold } from '@/components/website/shared/website-page-scaffold'
import { WebsiteReferenceFlipGrid } from '@/components/website/references/website-reference-flip-grid'
import { getPublicReferences } from '@/lib/data/website-references'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'references')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Referanslarımız',
    descriptionFallback: 'Aksiyon Soft ile yürütülen kurumsal iş ortaklıkları.',
    canonicalSegment: 'references',
  })
}

export default async function ReferencesPage() {
  const references = await getPublicReferences()
  return (
    <WebsitePageScaffold item={item}>
      <WebsiteReferenceFlipGrid references={references} />
    </WebsitePageScaffold>
  )
}
