import { eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import {
  radioMobileChannelConfig,
  type RadioMobileChannel,
} from '@/lib/db/schema/radio-mobile'
import { PUBLIC_PATH_BY_CHANNEL } from './channels'
import type { RadioMobileChannelValue } from './channels'

export async function getChannelPageConfig(channel: RadioMobileChannelValue) {
  const db = getDbConnection()
  const [row] = await db
    .select()
    .from(radioMobileChannelConfig)
    .where(eq(radioMobileChannelConfig.channel, channel))
    .limit(1)

  if (row) {
    return {
      channel: row.channel as RadioMobileChannel,
      isPublicPage: row.isPublicPage,
      publicUrlPath: row.publicUrlPath,
    }
  }

  return {
    channel,
    isPublicPage: false,
    publicUrlPath: PUBLIC_PATH_BY_CHANNEL[channel],
  }
}

export async function isChannelPagePublic(
  channel: RadioMobileChannelValue
): Promise<boolean> {
  const config = await getChannelPageConfig(channel)
  return config.isPublicPage
}
