import type { RadioMobileChannel } from '@/lib/db/schema/radio-mobile'
import { SCOPES } from '@/lib/db/schema'

export const RADIO_MOBILE_CHANNELS = [
  'android_release',
  'android_debug',
  'ios_release',
  'ios_debug',
] as const satisfies readonly RadioMobileChannel[]

export type RadioMobileChannelValue = (typeof RADIO_MOBILE_CHANNELS)[number]

export const CHANNEL_SCOPE: Record<
  RadioMobileChannelValue,
  keyof typeof SCOPES
> = {
  android_release: 'RADIO_MOBILE_ANDROID_RELEASE',
  android_debug: 'RADIO_MOBILE_ANDROID_DEBUG',
  ios_release: 'RADIO_MOBILE_IOS_RELEASE',
  ios_debug: 'RADIO_MOBILE_IOS_DEBUG',
}

export const CHANNEL_LABELS: Record<RadioMobileChannelValue, string> = {
  android_release: 'Android Release',
  android_debug: 'Android Debug',
  ios_release: 'iOS Release',
  ios_debug: 'iOS Debug',
}

export const PUBLIC_PATH_BY_CHANNEL: Record<RadioMobileChannelValue, string> = {
  android_release: '/radio-mobile/android/release',
  android_debug: '/radio-mobile/android/debugging',
  ios_release: '/radio-mobile/ios/release',
  ios_debug: '/radio-mobile/ios/debugging',
}

export function parseChannel(
  raw: string | null
): RadioMobileChannelValue | null {
  if (!raw) return null
  return RADIO_MOBILE_CHANNELS.includes(raw as RadioMobileChannelValue)
    ? (raw as RadioMobileChannelValue)
    : null
}

export function versionNameFromParts(major: number, patch: number): string {
  return `${major}.${patch}`
}

export function versionCodeFromParts(major: number, patch: number): number {
  return major * 1000 + patch
}
