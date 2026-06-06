import { NextRequest, NextResponse } from 'next/server'
import { getFileRecord, getFileFromS3 } from '@/lib/s3/utils'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    // Get file record
    const file = await getFileRecord(fileId)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file from S3
    const fileBuffer = await getFileFromS3(file.fileName, file.bucket)

    logger.info({ fileId, fileName: file.fileName }, 'File served for viewing')

    // Return file with appropriate headers for viewing (not downloading)
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to serve file for viewing')

    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
