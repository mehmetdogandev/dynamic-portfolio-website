import { NextRequest, NextResponse } from 'next/server'
import { deleteFile, getFileRecord } from '@/lib/s3/utils'
import { logger } from '@/lib/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    // Get file record first
    const fileRecord = await getFileRecord(fileId)
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await deleteFile(fileRecord.fileName, fileRecord.bucket)

    logger.info(
      { fileId, fileName: fileRecord.fileName },
      'File deleted successfully'
    )

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to delete file')

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
