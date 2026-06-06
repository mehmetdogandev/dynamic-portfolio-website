import { db, radioMobileChannelConfig } from '@/lib/db/'
import {
  PUBLIC_PATH_BY_CHANNEL,
  RADIO_MOBILE_CHANNELS,
} from '@/lib/radio-mobile/channels'

export async function seed() {
  for (const channel of RADIO_MOBILE_CHANNELS) {
    await db
      .insert(radioMobileChannelConfig)
      .values({
        channel,
        isPublicPage: false,
        publicUrlPath: PUBLIC_PATH_BY_CHANNEL[channel],
      })
      .onConflictDoNothing()
  }
  console.log('✓ Radio mobile channel config rows ensured')
}
