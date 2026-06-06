import {
  AtSign,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  FOOTER_SOCIAL_KNOWN_PLATFORMS,
  FOOTER_SOCIAL_PLATFORMS,
  type FooterSocialKnownPlatform,
  type FooterSocialPlatform,
} from '@/lib/website/footer-social-platform-constants'

export {
  FOOTER_SOCIAL_KNOWN_PLATFORMS,
  FOOTER_SOCIAL_PLATFORMS,
  type FooterSocialKnownPlatform,
  type FooterSocialPlatform,
}

export const FOOTER_SOCIAL_PLATFORM_LABELS: Record<
  FooterSocialKnownPlatform,
  string
> = {
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
  X: 'X',
  GITHUB: 'GitHub',
  WHATSAPP: 'WhatsApp',
}

export const FOOTER_SOCIAL_PLATFORM_ICONS: Record<
  FooterSocialKnownPlatform,
  LucideIcon
> = {
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  X: AtSign,
  GITHUB: Github,
  WHATSAPP: MessageCircle,
}

export function isFooterSocialKnownPlatform(
  platform: FooterSocialPlatform
): platform is FooterSocialKnownPlatform {
  return platform !== 'OTHER'
}

export function getFooterSocialPlatformIcon(
  platform: FooterSocialKnownPlatform
): LucideIcon {
  return FOOTER_SOCIAL_PLATFORM_ICONS[platform]
}

export function getFooterSocialPlatformLabel(
  platform: FooterSocialKnownPlatform
): string {
  return FOOTER_SOCIAL_PLATFORM_LABELS[platform]
}

/** UI / uyarı metinleri için görünen platform adı. */
export function getSocialDisplayName(
  platform: FooterSocialPlatform,
  customLabel: string | null | undefined
): string {
  if (platform === 'OTHER') {
    return customLabel?.trim() || 'Özel platform'
  }
  return FOOTER_SOCIAL_PLATFORM_LABELS[platform]
}

const ENV_PLATFORM_MAP: ReadonlyArray<{
  platform: FooterSocialKnownPlatform
  envKey: string
}> = [
  { platform: 'LINKEDIN', envKey: 'NEXT_PUBLIC_WEBSITE_SOCIAL_LINKEDIN' },
  { platform: 'GITHUB', envKey: 'NEXT_PUBLIC_WEBSITE_SOCIAL_GITHUB' },
  { platform: 'X', envKey: 'NEXT_PUBLIC_WEBSITE_SOCIAL_X' },
  { platform: 'WHATSAPP', envKey: 'NEXT_PUBLIC_WEBSITE_SOCIAL_WHATSAPP' },
]

export function getEnvFooterSocialFallback(): Array<{
  platform: FooterSocialKnownPlatform
  url: string
  label: string
}> {
  const out: Array<{
    platform: FooterSocialKnownPlatform
    url: string
    label: string
  }> = []
  for (const { platform, envKey } of ENV_PLATFORM_MAP) {
    const url = process.env[envKey]?.trim()
    if (url) {
      out.push({
        platform,
        url,
        label: FOOTER_SOCIAL_PLATFORM_LABELS[platform],
      })
    }
  }
  return out
}
