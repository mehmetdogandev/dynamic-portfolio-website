export const VISIT_STATUS_ORDER = ['PLANNED', 'COMPLETED'] as const

export const TERMINAL_VISIT_STATUSES = [
  'COMPLETED',
  'CANCELLED',
  'POSTPONED',
] as const

export const VISIT_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  POSTPONED: 'Ertelendi',
}

export type VisitStatus =
  | (typeof VISIT_STATUS_ORDER)[number]
  | (typeof TERMINAL_VISIT_STATUSES)[number]

export type VisitDateStatus =
  | 'overdue'
  | 'pastDue'
  | 'future'
  | 'none'
  | 'unplanned'

/** Plansız ziyaret: planlanan başlangıç saati yok. */
export function isUnplanned(
  plannedStartDate: Date | string | null | undefined
): boolean {
  return plannedStartDate == null
}

/** Planlanan tarihe göre durum. Sadece PLANNED/POSTPONED için geçerlidir. */
export function getVisitDateStatus(
  plannedStartDate: Date | string | null | undefined,
  status: string
): VisitDateStatus {
  if (!plannedStartDate) {
    return 'unplanned'
  }
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return 'none'
  }
  if (status !== 'PLANNED' && status !== 'POSTPONED') {
    return 'none'
  }
  const planned =
    typeof plannedStartDate === 'string'
      ? new Date(plannedStartDate)
      : plannedStartDate
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const plannedDay = new Date(planned)
  plannedDay.setHours(0, 0, 0, 0)
  const daysSince = Math.floor(
    (now.getTime() - plannedDay.getTime()) / (24 * 60 * 60 * 1000)
  )
  if (daysSince > 5) return 'overdue'
  if (daysSince > 0) return 'pastDue'
  return 'future'
}
