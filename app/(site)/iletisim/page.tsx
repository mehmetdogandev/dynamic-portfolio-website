import { WebsitePageScaffold } from '@/components/website/shared/website-page-scaffold'
import { WebsiteContactSection } from '@/components/website/iletisim/website-contact-section'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'iletisim')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'İletişim',
    descriptionFallback: 'Aksiyon Soft ile iletişim formu ve kanallar.',
    canonicalSegment: 'iletisim',
  })
}

export default function IletisimPage() {
  return (
    <WebsitePageScaffold item={item}>
      <WebsiteContactSection />
    </WebsitePageScaffold>
  )
}
