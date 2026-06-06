import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { radioMobileBuild } from '@/lib/db/schema/radio-mobile'
import type { RadioMobileChannelValue } from './channels'
import { versionCodeFromParts, versionNameFromParts } from './channels'

export type NextVersionResult = {
  versionMajor: number
  versionPatch: number
  versionName: string
  versionCode: number
}

export async function getNextVersionForChannel(
  channel: RadioMobileChannelValue,
  major: number
): Promise<NextVersionResult> {
  const db = getDbConnection()
  const [latest] = await db
    .select({
      versionPatch: radioMobileBuild.versionPatch,
    })
    .from(radioMobileBuild)
    .where(
      and(
        eq(radioMobileBuild.channel, channel),
        eq(radioMobileBuild.versionMajor, major),
        isNull(radioMobileBuild.deletedAt)
      )
    )
    .orderBy(desc(radioMobileBuild.versionPatch))
    .limit(1)

  const patch = latest ? latest.versionPatch + 1 : 0
  return {
    versionMajor: major,
    versionPatch: patch,
    versionName: versionNameFromParts(major, patch),
    versionCode: versionCodeFromParts(major, patch),
  }
}
