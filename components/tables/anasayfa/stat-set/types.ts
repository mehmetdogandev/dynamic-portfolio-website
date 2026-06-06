import type {
  HomeStatSetStatus,
  HomeStatValueSource,
} from '@/lib/trpc/router/home-stat-set'

export type AdminHomeStatSetRow = {
  id: string
  name: string
  status: HomeStatSetStatus
  yearsExperienceValue: string
  yearsExperienceLabel: string
  yearsExperienceHref: string | null
  experienceCountValue: string
  experienceCountLabel: string
  experienceCountHref: string | null
  experienceCountSource: HomeStatValueSource
  companyCountValue: string
  companyCountLabel: string
  companyCountHref: string | null
  companyCountSource: HomeStatValueSource
  studentsTaughtValue: string
  studentsTaughtLabel: string
  studentsTaughtHref: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
