import type { FooterSocialPlatform } from '@/lib/website/social-platforms'

export type AdminFooterSocialRow = {
  id: string
  platform: FooterSocialPlatform
  customLabel: string | null
  url: string
  type: 'ICON' | 'IMAGE'
  iconFileId: string | null
  sortOrder: number
  isActive: boolean
  displayName: string
  iconPreviewUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export const FOOTER_SOCIAL_OTHER_SELECT_VALUE = '__OTHER__' as const

export type FooterSocialPlatformSelectValue =
  | typeof FOOTER_SOCIAL_OTHER_SELECT_VALUE
  | Exclude<FooterSocialPlatform, 'OTHER'>
