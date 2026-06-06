import type { FooterSocialPlatformSelectValue } from './types'
import { FOOTER_SOCIAL_OTHER_SELECT_VALUE } from './types'

export function buildFooterSocialPayload(params: {
  platformSelect: FooterSocialPlatformSelectValue
  customLabel: string
  url: string
  iconFileId: string | null
  isActive: boolean
}) {
  const url = params.url.trim()
  if (!url) {
    return { error: 'URL gerekli' as const }
  }

  if (params.platformSelect === FOOTER_SOCIAL_OTHER_SELECT_VALUE) {
    const customLabel = params.customLabel.trim()
    if (!customLabel) {
      return { error: 'Platform adı gerekli' as const }
    }
    if (!params.iconFileId) {
      return { error: 'Platform ikonu (.ico) gerekli' as const }
    }
    return {
      payload: {
        platform: 'OTHER' as const,
        type: 'IMAGE' as const,
        customLabel,
        iconFileId: params.iconFileId,
        url,
        isActive: params.isActive,
      },
    }
  }

  return {
    payload: {
      platform: params.platformSelect,
      type: 'ICON' as const,
      customLabel: null,
      iconFileId: null,
      url,
      isActive: params.isActive,
    },
  }
}
