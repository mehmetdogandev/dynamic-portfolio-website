/**
 * Avatar / bildirim kısaltması: ad ve soyadın ilk harfi (en fazla 2 karakter).
 * `firstName` DB’de genelde `name` kolonu, `lastName` ayrıdır.
 */
export function getUserDisplayInitials(
  firstName?: string | null,
  lastName?: string | null
): string {
  const first = firstName?.trim()
  const last = lastName?.trim()
  if (first && last) {
    return (first[0] + last[0]).toUpperCase()
  }
  const combined = [first, last]
    .filter((s): s is string => !!s?.length)
    .join(' ')
  if (!combined) return 'U'
  const tokens = combined.split(/\s+/).filter(Boolean)
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase()
  }
  return (tokens[0][0] ?? 'U').toUpperCase()
}
