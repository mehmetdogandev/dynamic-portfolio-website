import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'

export type RadioMobileRouterKey =
  | 'androidRelease'
  | 'androidDebug'
  | 'iosRelease'
  | 'iosDebug'

export const CHANNEL_TO_ROUTER: Record<
  RadioMobileChannelValue,
  RadioMobileRouterKey
> = {
  android_release: 'androidRelease',
  android_debug: 'androidDebug',
  ios_release: 'iosRelease',
  ios_debug: 'iosDebug',
}

export type BuildRow = {
  id: string
  versionName: string
  versionCode: number
  displayName: string
  sizeBytes: number
  isStable: boolean
  isPublicOnSite: boolean
  publishedAt: Date
  minSdk: number | null
  targetSdk: number | null
  reactNativeVersion: string | null
  notes?: string | null
}
