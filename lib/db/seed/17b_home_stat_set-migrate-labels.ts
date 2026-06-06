import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { homeStatSet } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import { HOME_STAT_DEFAULT_HREFS } from '@/lib/website/home-stat-config'

/**
 * Mevcut veritabanlarında yayındaki istatistik setinin etiket, href ve
 * otomatik sayaç modlarını günceller (şema migrasyonu sonrası).
 */
export async function seed() {
  const published = await db
    .select({ id: homeStatSet.id })
    .from(homeStatSet)
    .where(
      and(eq(homeStatSet.status, 'PUBLISHED'), excludeDeleted(homeStatSet))
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!published) {
    console.log('Skip home_stat_set migrate: no published set')
    return
  }

  await db
    .update(homeStatSet)
    .set({
      yearsExperienceLabel: 'Yıl Deneyim',
      yearsExperienceHref: HOME_STAT_DEFAULT_HREFS.yearsExperience,
      experienceCountLabel: 'Farklı Deneyim',
      experienceCountHref: HOME_STAT_DEFAULT_HREFS.experienceCount,
      experienceCountSource: 'AUTO_EXPERIENCE_COUNT',
      companyCountLabel: 'Şirkette Çalışma',
      companyCountHref: HOME_STAT_DEFAULT_HREFS.companyCount,
      companyCountSource: 'AUTO_REFERENCE_COUNT',
      studentsTaughtHref: null,
    })
    .where(eq(homeStatSet.id, published.id))

  console.log('  Migrated published home_stat_set labels/hrefs/sources')
}
