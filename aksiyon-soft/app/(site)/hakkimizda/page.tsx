import { notFound } from 'next/navigation'
import { WebsiteAboutPage } from '@/components/website/about/website-about-page'
import { getPublishedAboutPage } from '@/lib/data/website-about'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'hakkimizda')!

export async function generateMetadata() {
  const about = await getPublishedAboutPage()
  return marketingPageMetadata({
    title: about?.seoTitle?.trim() || about?.title || 'Hakkımızda',
    descriptionFallback:
      about?.seoDescription?.trim() ||
      'Aksiyon Soft kurumsal kimliği, değerlerimiz ve çalışma ilkelerimiz.',
    canonicalSegment: 'hakkimizda',
  })
}

export default async function HakkimizdaPage() {
  const about = await getPublishedAboutPage()
  if (!about || !about.robotsIndex) notFound()

  return (
    <WebsiteAboutPage
      navItem={item}
      pageTitle={about.title}
      html={about.content.html}
      updatedAtIso={about.updatedAt.toISOString()}
    />
  )
}
