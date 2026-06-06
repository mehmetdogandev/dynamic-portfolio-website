const contactByIp = new Map<string, { n: number; day: string }>()
const visitKeys = new Set<string>()

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/** At most N contact submissions per IP per calendar day (UTC). */
export function checkWebsiteContactRateLimit(
  ip: string,
  maxPerDay: number
): boolean {
  const day = todayUtc()
  const key = ip && ip.length > 0 ? ip : 'unknown'
  const cur = contactByIp.get(key)
  if (!cur || cur.day !== day) {
    contactByIp.set(key, { n: 1, day })
    return true
  }
  if (cur.n >= maxPerDay) return false
  cur.n += 1
  return true
}

/** One visit notification e-mail per IP per UTC day. */
export function shouldSendVisitNotification(ip: string): boolean {
  const key = `${ip && ip.length > 0 ? ip : 'unknown'}:${todayUtc()}`
  if (visitKeys.has(key)) return false
  visitKeys.add(key)
  return true
}
