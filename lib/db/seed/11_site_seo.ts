import { count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { siteSeo } from '@/lib/db/schema'

export async function seed() {
  const [row] = await db.select({ n: count() }).from(siteSeo)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip site_seo seed: table is not empty')
    return
  }

  await db.insert(siteSeo).values({
    defaultMetaDescription:
      'Aksiyon Soft: özel kurumsal yazılım, API ve veri entegrasyonu, operasyon panelleri ve güvenli teslimat. Orta ve büyük ölçekli işletmeler için dijital dönüşüm ortağınız.',
    organizationName: 'Aksiyon Soft',
    sameAsJson: [
      'https://www.linkedin.com/company/aksiyon-soft',
      'https://github.com/aksiyon-soft',
    ],
    defaultOgImageFileId: null,
    twitterSite: '@aksiyonsoft',
    googleSiteVerification: null,
  })
  console.log('  Seeded site_seo (singleton)')
}
