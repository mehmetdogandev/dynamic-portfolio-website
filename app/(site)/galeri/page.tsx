import { WebsitePageScaffold } from '@/components/website/shared/website-page-scaffold'
import { WebsiteGalleryGroups } from '@/components/website/galeri/website-gallery-groups'
import { getPublicMediaGroups } from '@/lib/data/website-media'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'galeri')!

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Kurumsal medya',
    descriptionFallback: 'Etkinlik ve kurumsal yaşamdan görüntüler.',
    canonicalSegment: 'galeri',
  })
}

export default async function GaleriPage() {
  const groups = await getPublicMediaGroups()
  return (
    <WebsitePageScaffold item={item}>
      <WebsiteGalleryGroups groups={groups} />
    </WebsitePageScaffold>
  )
}
