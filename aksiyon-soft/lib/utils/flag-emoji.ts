/** ISO 3166-1 alpha-2 → bayrak emoji (yaklaşık) */
export function countryCodeToFlagEmoji(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase()
  if (cc.length !== 2) return '🌐'
  const base = 0x1f1e6
  const a = cc.codePointAt(0)! - 65
  const b = cc.codePointAt(1)! - 65
  if (a < 0 || a > 25 || b < 0 || b > 25) return '🌐'
  return String.fromCodePoint(base + a, base + b)
}
