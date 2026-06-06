import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { radioMobileBuild } from '@/lib/db/schema/radio-mobile'
import type { RadioMobileChannelValue } from './channels'
import { isChannelPagePublic } from './channel-config'

export type PublicBuildRow = {
  id: string
  versionName: string
  versionCode: number
  displayName: string
  sizeBytes: number
  isStable: boolean
  publishedAt: Date
  minSdk: number | null
  targetSdk: number | null
  reactNativeVersion: string | null
}

export async function listPublicBuilds(
  channel: RadioMobileChannelValue
): Promise<PublicBuildRow[]> {
  if (!(await isChannelPagePublic(channel))) {
    return []
  }
  const db = getDbConnection()
  return db
    .select({
      id: radioMobileBuild.id,
      versionName: radioMobileBuild.versionName,
      versionCode: radioMobileBuild.versionCode,
      displayName: radioMobileBuild.displayName,
      sizeBytes: radioMobileBuild.sizeBytes,
      isStable: radioMobileBuild.isStable,
      publishedAt: radioMobileBuild.publishedAt,
      minSdk: radioMobileBuild.minSdk,
      targetSdk: radioMobileBuild.targetSdk,
      reactNativeVersion: radioMobileBuild.reactNativeVersion,
    })
    .from(radioMobileBuild)
    .where(
      and(
        eq(radioMobileBuild.channel, channel),
        eq(radioMobileBuild.isPublished, true),
        eq(radioMobileBuild.isPublicOnSite, true),
        isNull(radioMobileBuild.deletedAt)
      )
    )
    .orderBy(desc(radioMobileBuild.versionCode))
}
