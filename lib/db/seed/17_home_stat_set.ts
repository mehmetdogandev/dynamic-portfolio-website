import { count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { homeStatSet } from '@/lib/db/schema'

export async function seed() {
  const [row] = await db.select({ n: count() }).from(homeStatSet)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip home_stat_set seed: table is not empty')
    return
  }

  const now = new Date()

  await db.insert(homeStatSet).values({
    name: 'Varsayılan ana sayfa istatistikleri',
    status: 'PUBLISHED',
    stat1Value: '3+',
    stat1Label: 'Yıl Deneyim',
    stat2Value: '12+',
    stat2Label: 'Tamamlanan Proje',
    stat3Value: '7',
    stat3Label: 'Şirkette Çalışma',
    stat4Value: '40+',
    stat4Label: 'Eğitim Verilen Öğrenci',
    publishedAt: now,
  })

  await db.insert(homeStatSet).values({
    name: 'Taslak örnek set',
    status: 'DRAFT',
    stat1Value: '5+',
    stat1Label: 'Yıl Deneyim',
    stat2Value: '20+',
    stat2Label: 'Tamamlanan Proje',
    stat3Value: '10',
    stat3Label: 'Şirkette Çalışma',
    stat4Value: '50+',
    stat4Label: 'Eğitim Verilen Öğrenci',
  })

  console.log('  Seeded home_stat_set (1 published + 1 draft)')
}
