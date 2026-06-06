import { and, isNull, max, sql } from 'drizzle-orm'
import { japonCustomer } from '@/lib/db/schema'

type CustomerNoAllocatorDb = {
  select: typeof import('@/lib/db').db.select
}

const CUSTOMER_NO_TIMEZONE = 'Europe/Istanbul'
const CUSTOMER_NO_PREFIX = 'CT'
const SEQUENCE_LENGTH = 4

/** MMDDYY date segment in Europe/Istanbul (e.g. 28 May 2026 -> 052826). */
export function getCustomerNoDateSegment(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CUSTOMER_NO_TIMEZONE,
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  }).formatToParts(date)

  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  const year = parts.find((p) => p.type === 'year')?.value ?? '00'
  return `${month}${day}${year}`
}

/** Full format: CT.MMDDYY.0001 */
export function formatCustomerNo(
  dateSegment: string,
  sequence: number
): string {
  const seq = String(sequence).padStart(SEQUENCE_LENGTH, '0')
  return `${CUSTOMER_NO_PREFIX}.${dateSegment}.${seq}`
}

/**
 * Allocates the next customer number for the given date (Istanbul TZ day bucket).
 */
export async function allocateCustomerNoAt(
  tx: CustomerNoAllocatorDb,
  at: Date = new Date()
): Promise<string> {
  const dateSegment = getCustomerNoDateSegment(at)
  const likePattern = `${CUSTOMER_NO_PREFIX}.${dateSegment}.%`

  const row = await tx
    .select({ maxNo: max(japonCustomer.customerNo) })
    .from(japonCustomer)
    .where(
      and(
        isNull(japonCustomer.deletedAt),
        sql`${japonCustomer.customerNo} LIKE ${likePattern}`
      )
    )
    .limit(1)
    .then((rows) => rows[0])

  let nextSequence = 1
  const expectedPrefix = `${CUSTOMER_NO_PREFIX}.${dateSegment}.`
  if (row?.maxNo && row.maxNo.startsWith(expectedPrefix)) {
    const suffix = row.maxNo.slice(expectedPrefix.length)
    const parsed = Number.parseInt(suffix, 10)
    if (!Number.isNaN(parsed)) {
      nextSequence = parsed + 1
    }
  }

  if (nextSequence > 10 ** SEQUENCE_LENGTH - 1) {
    throw new Error('Günlük müşteri numarası limitine ulaşıldı')
  }

  return formatCustomerNo(dateSegment, nextSequence)
}

/** Allocates the next customer number for today (Istanbul TZ). */
export async function allocateCustomerNo(
  tx: CustomerNoAllocatorDb
): Promise<string> {
  return allocateCustomerNoAt(tx, new Date())
}
