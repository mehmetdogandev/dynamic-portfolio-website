import { sitePath } from '@/lib/website/site-nav'

export const HOME_STAT_DEFAULT_HREFS = {
  yearsExperience: `${sitePath('hakkimda')}#deneyimler`,
  experienceCount: `${sitePath('hakkimda')}#deneyimler`,
  companyCount: sitePath('referanslar'),
  studentsTaught: null,
} as const

export const HOME_STAT_SOURCE_LABELS = {
  MANUAL: 'Manuel değer',
  AUTO_EXPERIENCE_COUNT: 'Otomatik (deneyim sayısı)',
  AUTO_REFERENCE_COUNT: 'Otomatik (referans sayısı)',
} as const
