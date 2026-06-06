import type { HomeStatSetStatus } from '@/lib/trpc/router/home-stat-set'

export type AdminHomeStatSetRow = {
  id: string
  name: string
  status: HomeStatSetStatus
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  stat3Value: string
  stat3Label: string
  stat4Value: string
  stat4Label: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
