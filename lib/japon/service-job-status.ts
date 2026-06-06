export type JaponJobStatus = 'none' | 'in_progress' | 'completed' | 'cancelled'

export type JaponJobStatusInput = {
  isCompleted: boolean
  isCancelled: boolean
  startedAt: Date | string | null
  servicesCount: number
}

export function getJaponJobStatus(job: JaponJobStatusInput): JaponJobStatus {
  if (job.isCompleted) return 'completed'
  if (job.isCancelled) return 'cancelled'
  if (job.servicesCount > 0 || job.startedAt != null) return 'in_progress'
  return 'none'
}

export function getJaponJobStatusLabel(status: JaponJobStatus): string {
  switch (status) {
    case 'none':
      return 'Servis yok'
    case 'in_progress':
      return 'Devam ediyor'
    case 'completed':
      return 'Tamamlandı'
    case 'cancelled':
      return 'Servis iptal'
  }
}

export function isJaponJobEditable(job: {
  isCompleted: boolean
  isCancelled: boolean
}): boolean {
  return !job.isCompleted && !job.isCancelled
}

export const PRICE_REGEX = /^\d+(\.\d{1,2})?$/

export function parsePartLineTotal(
  quantity: number,
  unitPrice: string | number
): number {
  const unit = typeof unitPrice === 'number' ? unitPrice : Number(unitPrice)
  if (!Number.isFinite(unit) || quantity < 1) return 0
  return unit * quantity
}

export function formatJaponMoney(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function sumPartRows(
  parts: ReadonlyArray<{ quantity: number; unitPrice: string | number }>
): number {
  return parts.reduce(
    (sum, part) => sum + parsePartLineTotal(part.quantity, part.unitPrice),
    0
  )
}
