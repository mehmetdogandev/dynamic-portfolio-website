import { SCOPES } from '@/lib/db/schema'
import { createRadioMobileChannelRouter } from './shared/create-channel-router'

export const iosReleaseRouter = createRadioMobileChannelRouter(
  'ios_release',
  SCOPES.RADIO_MOBILE_IOS_RELEASE
)
