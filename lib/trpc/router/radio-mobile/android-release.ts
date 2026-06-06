import { SCOPES } from '@/lib/db/schema'
import { createRadioMobileChannelRouter } from './shared/create-channel-router'

export const androidReleaseRouter = createRadioMobileChannelRouter(
  'android_release',
  SCOPES.RADIO_MOBILE_ANDROID_RELEASE
)
