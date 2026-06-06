import { Readable } from 'node:stream'
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { radioMobileBuild } from '@/lib/db/schema/radio-mobile'
import { file as fileTable } from '@/lib/db/schema'
import { s3Client } from '@/lib/s3/index'
import { isChannelPagePublic } from '@/lib/radio-mobile/channel-config'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'

/** Büyük APK (~70MB+) indirmeleri için */
export const maxDuration = 600

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params
    const db = getDbConnection()
    const [build] = await db
      .select()
      .from(radioMobileBuild)
      .where(
        and(
          eq(radioMobileBuild.id, buildId),
          isNull(radioMobileBuild.deletedAt),
          eq(radioMobileBuild.isPublished, true),
          eq(radioMobileBuild.isPublicOnSite, true)
        )
      )
      .limit(1)

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    const pagePublic = await isChannelPagePublic(
      build.channel as RadioMobileChannelValue
    )
    if (!pagePublic) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    const [fileRow] = await db
      .select()
      .from(fileTable)
      .where(eq(fileTable.id, build.fileId))
      .limit(1)

    if (!fileRow) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const bucket = fileRow.bucket
    const stat = await s3Client.statObject(bucket, fileRow.fileName)
    const objectStream = await s3Client.getObject(bucket, fileRow.fileName)
    const webStream = Readable.toWeb(objectStream as Readable)

    const downloadName =
      build.displayName?.trim() ||
      fileRow.originalName?.trim() ||
      `radio-${build.versionName}.apk`

    return new NextResponse(webStream as ReadableStream, {
      headers: {
        'Content-Type':
          fileRow.mimeType || 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Content-Length': String(stat.size),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
