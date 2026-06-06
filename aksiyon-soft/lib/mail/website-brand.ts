/** Public site base URL for logo and links in transactional HTML. */
export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

/** Brand colors: align with globals oklch + hex fallbacks for e-mail clients. */
export const WEBSITE_EMAIL_COLORS = {
  primaryHex: '#3d4a5c',
  primaryBgOk: 'oklch(0.3226 0.0203 257.27)',
  foregroundHex: '#2a3140',
  cardHex: '#ffffff',
  pageBgHex: '#faf9f7',
  secondaryHex: '#ebe4d8',
  accentHex: '#dfe8e2',
  mutedHex: '#5c6678',
  borderHex: '#e2e5ea',
} as const

export function websiteLogoUrl(): string {
  return `${getPublicAppUrl()}/logo.png`
}
