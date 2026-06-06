import { count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { siteSeo } from '@/lib/db/schema'

/** referance/.../src/config/site.ts — org ve sosyal linkler */
export async function seed() {
  const [row] = await db.select({ n: count() }).from(siteSeo)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip site_seo seed: table is not empty')
    return
  }

  await db.insert(siteSeo).values({
    defaultMetaDescription:
      'Mehmet Doğan — Software Engineer. Yazılım mühendisliği, full-stack geliştirme, ERP, yapay zeka ve teknoloji odaklı projeler. mehmetdogandev.com',
    organizationName: 'Mehmet Doğan',
    sameAsJson: [
      'https://www.linkedin.com/in/mehmetdogandev',
      'https://github.com/mehmetdogandev',
      'https://medium.com/@mehmetdogan.dev',
      'https://mehmetdogandev.com',
    ],
    defaultOgImageFileId: null,
    twitterSite: null,
    googleSiteVerification: null,
  })
  console.log('  Seeded site_seo (singleton)')
}
