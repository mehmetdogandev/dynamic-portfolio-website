/**
 * Turkey timezone (UTC+3) için tarih yardımcıları.
 * Deadline/end_at değerleri Turkey 22:00 (gün sonu) = UTC 19:00 olarak saklanır.
 */

/** Turkey 22:00 (gün sonu) = UTC 19:00. Verilen tarihin yerel günü için UTC 19:00 döner. */
export function toTurkey22Utc(date: Date): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  return new Date(Date.UTC(y, m, d, 19, 0, 0, 0))
}
