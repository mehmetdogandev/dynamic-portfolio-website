import { getFooterSocialPlatformIcon } from '@/lib/website/social-platforms'
import type { FooterSocialKnownPlatform } from '@/lib/website/social-platforms'

const ICONS = {
  INSTAGRAM: getFooterSocialPlatformIcon('INSTAGRAM'),
  LINKEDIN: getFooterSocialPlatformIcon('LINKEDIN'),
  YOUTUBE: getFooterSocialPlatformIcon('YOUTUBE'),
  FACEBOOK: getFooterSocialPlatformIcon('FACEBOOK'),
  X: getFooterSocialPlatformIcon('X'),
  GITHUB: getFooterSocialPlatformIcon('GITHUB'),
  WHATSAPP: getFooterSocialPlatformIcon('WHATSAPP'),
} as const

export function FooterSocialPlatformIcon({
  platform,
  className,
}: {
  platform: FooterSocialKnownPlatform
  className?: string
}) {
  const Icon = ICONS[platform]
  return <Icon className={className} />
}
