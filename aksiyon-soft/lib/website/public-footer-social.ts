import type { FooterSocialKnownPlatform } from '@/lib/website/footer-social-platform-constants'

/** Server → client geçirilebilir footer sosyal link (Lucide bileşeni yok). */
export type PublicFooterSocialLink =
  | {
      kind: 'lucide'
      platform: FooterSocialKnownPlatform
      url: string
      label: string
    }
  | {
      kind: 'image'
      platform: 'OTHER'
      url: string
      label: string
      imageUrl: string
    }
