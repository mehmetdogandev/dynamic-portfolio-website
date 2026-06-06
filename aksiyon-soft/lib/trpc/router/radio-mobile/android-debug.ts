import { SCOPES } from '@/lib/db/schema'
import { createRadioMobileChannelRouter } from './shared/create-channel-router'

export const androidDebugRouter = createRadioMobileChannelRouter(
  'android_debug',
  SCOPES.RADIO_MOBILE_ANDROID_DEBUG
)
