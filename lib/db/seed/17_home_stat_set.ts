import { count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { homeStatSet } from '@/lib/db/schema'
import { HOME_STAT_DEFAULT_HREFS } from '@/lib/website/home-stat-config'

const PUBLISHED_SET = {
  name: 'Varsayılan ana sayfa istatistikleri',
  status: 'PUBLISHED' as const,
  yearsExperienceValue: '3+',
  yearsExperienceLabel: 'Yıl Deneyim',
  yearsExperienceHref: HOME_STAT_DEFAULT_HREFS.yearsExperience,
  experienceCountValue: '0',
  experienceCountLabel: 'Farklı Deneyim',
  experienceCountHref: HOME_STAT_DEFAULT_HREFS.experienceCount,
  experienceCountSource: 'AUTO_EXPERIENCE_COUNT' as const,
  companyCountValue: '0',
  companyCountLabel: 'Şirkette Çalışma',
  companyCountHref: HOME_STAT_DEFAULT_HREFS.companyCount,
  companyCountSource: 'AUTO_REFERENCE_COUNT' as const,
  studentsTaughtValue: '40+',
  studentsTaughtLabel: 'Eğitim Verilen Öğrenci',
  studentsTaughtHref: null,
}

export async function seed() {
  const [row] = await db.select({ n: count() }).from(homeStatSet)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip home_stat_set seed: table is not empty')
    return
  }

  const now = new Date()

  await db.insert(homeStatSet).values({
    ...PUBLISHED_SET,
    publishedAt: now,
  })

  await db.insert(homeStatSet).values({
    name: 'Taslak örnek set',
    status: 'DRAFT',
    yearsExperienceValue: '5+',
    yearsExperienceLabel: 'Yıl Deneyim',
    yearsExperienceHref: HOME_STAT_DEFAULT_HREFS.yearsExperience,
    experienceCountValue: '15',
    experienceCountLabel: 'Farklı Deneyim',
    experienceCountHref: HOME_STAT_DEFAULT_HREFS.experienceCount,
    experienceCountSource: 'MANUAL',
    companyCountValue: '10',
    companyCountLabel: 'Şirkette Çalışma',
    companyCountHref: HOME_STAT_DEFAULT_HREFS.companyCount,
    companyCountSource: 'MANUAL',
    studentsTaughtValue: '50+',
    studentsTaughtLabel: 'Eğitim Verilen Öğrenci',
    studentsTaughtHref: null,
  })

  console.log('  Seeded home_stat_set (1 published + 1 draft)')
}
