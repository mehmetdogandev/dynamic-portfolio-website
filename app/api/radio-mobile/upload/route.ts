import { NextRequest, NextResponse } from 'next/server'
import { parseChannel } from '@/lib/radio-mobile/channels'
import {
  verifyApiKeyForChannel,
  extractApiKeyFromRequest,
} from '@/lib/radio-mobile/api-key-auth'
import { getNextVersionForChannel } from '@/lib/radio-mobile/version'
import { uploadFile } from '@/lib/s3/utils'
import { getDbConnection } from '@/lib/db'
import { radioMobileBuild } from '@/lib/db/schema/radio-mobile'

export async function POST(request: NextRequest) {
  try {
    const apiKey = extractApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const formData = await request.formData()
    const channel = parseChannel(String(formData.get('channel') ?? ''))
    if (!channel) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const auth = await verifyApiKeyForChannel(apiKey, channel)
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'APK file required' }, { status: 400 })
    }

    const major = Number.parseInt(
      String(formData.get('versionMajor') ?? ''),
      10
    )
    if (!Number.isInteger(major) || major < 0) {
      return NextResponse.json(
        { error: 'Invalid versionMajor' },
        { status: 400 }
      )
    }

    const version = await getNextVersionForChannel(channel, major)
    const { versionMajor, versionPatch, versionName, versionCode } = version

    const isStable =
      String(formData.get('isStable') ?? '').toLowerCase() === 'true'
    const isPublicOnSite =
      String(formData.get('isPublicOnSite') ?? '').toLowerCase() === 'true'
    const displayName =
      String(formData.get('displayName') ?? '').trim() ||
      `radio-${versionName}-${channel}.apk`

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'application/vnd.android.package-archive'
    const prefix = `radio-mobile/${channel}/${versionMajor}`

    const uploaded = await uploadFile(buffer, displayName, mimeType, {
      prefix,
      isPublic: true,
      uploadedBy: `api-key:${auth.keyId}`,
    })

    const db = getDbConnection()
    const [build] = await db
      .insert(radioMobileBuild)
      .values({
        channel,
        versionMajor,
        versionPatch,
        versionName,
        versionCode,
        displayName,
        fileId: uploaded.id,
        sizeBytes: buffer.length,
        isPublished: true,
        isStable,
        isPublicOnSite,
        reactNativeVersion:
          String(formData.get('reactNativeVersion') ?? '') || null,
        minSdk: formData.get('minSdk')
          ? Number.parseInt(String(formData.get('minSdk')), 10)
          : null,
        targetSdk: formData.get('targetSdk')
          ? Number.parseInt(String(formData.get('targetSdk')), 10)
          : null,
        buildToolchain: String(formData.get('buildToolchain') ?? '') || null,
        notes: String(formData.get('notes') ?? '') || null,
      })
      .returning()

    return NextResponse.json({
      ok: true,
      buildId: build.id,
      versionName: build.versionName,
      versionCode: build.versionCode,
      fileId: uploaded.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
