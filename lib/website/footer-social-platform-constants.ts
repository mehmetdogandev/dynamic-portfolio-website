/** Bilinen platformlar (Select listesi; OTHER ayrı "Diğer..." olarak eklenir). */
export const FOOTER_SOCIAL_KNOWN_PLATFORMS = [
  'INSTAGRAM',
  'LINKEDIN',
  'YOUTUBE',
  'FACEBOOK',
  'X',
  'GITHUB',
  'WHATSAPP',
] as const

export type FooterSocialKnownPlatform =
  (typeof FOOTER_SOCIAL_KNOWN_PLATFORMS)[number]

/** DB `footer_social_platform` enum ile aynı değerler (şema buradan türetilir). */
export const FOOTER_SOCIAL_PLATFORMS = [
  ...FOOTER_SOCIAL_KNOWN_PLATFORMS,
  'OTHER',
] as const

export type FooterSocialPlatform = (typeof FOOTER_SOCIAL_PLATFORMS)[number]
