import { NextRequest, NextResponse } from 'next/server'
import { getFileRecord, getSignedDownloadUrl } from '@/lib/s3/utils'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const body = await request.json()
    const { expiry = 3600 } = body

    // Get file record
    const file = await getFileRecord(fileId)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate signed download URL
    const downloadUrl = await getSignedDownloadUrl(file.fileName, {
      bucket: file.bucket,
      expiry,
    })

    logger.info(
      { fileId, fileName: file.fileName, expiry },
      'Download URL generated successfully'
    )

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: file.originalName,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to generate download URL')

    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
