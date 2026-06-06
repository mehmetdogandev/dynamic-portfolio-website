/**
 * Şifre sıfırlama `redirectTo` ve e-posta bağlantıları için uygulama kökü (origin).
 */
export function getPasswordResetAppOrigin(headers: Headers): string {
  const env = process.env.BETTER_AUTH_URL || process.env.AUTH_URL
  if (env?.trim()) return env.replace(/\/$/, '')
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  const proto = headers.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}
