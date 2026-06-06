import { notFound } from 'next/navigation'
import { RadioMobilePublicPage } from '@/components/website/radio-mobile/radio-mobile-public-page'
import { isChannelPagePublic } from '@/lib/radio-mobile/channel-config'
import { getPublicPageMeta } from '@/lib/radio-mobile/public-page-meta'
import { listPublicBuilds } from '@/lib/radio-mobile/public-builds'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const meta = getPublicPageMeta('android_debug')

export async function generateMetadata() {
  return marketingPageMetadata({
    title: meta.metadataTitle,
    descriptionFallback: meta.metadataDescription,
    canonicalSegment: meta.canonicalSegment,
  })
}

export default async function RadioMobileAndroidDebuggingPage() {
  if (!(await isChannelPagePublic('android_debug'))) {
    notFound()
  }
  const builds = await listPublicBuilds('android_debug')
  return <RadioMobilePublicPage channel="android_debug" builds={builds} />
}
