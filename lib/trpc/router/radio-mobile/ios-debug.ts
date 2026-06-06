import { SCOPES } from '@/lib/db/schema'
import { createRadioMobileChannelRouter } from './shared/create-channel-router'

export const iosDebugRouter = createRadioMobileChannelRouter(
  'ios_debug',
  SCOPES.RADIO_MOBILE_IOS_DEBUG
)
