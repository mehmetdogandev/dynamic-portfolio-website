import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/utils/auth'
import { headers } from 'next/headers'
import { FOOTER_SOCIAL_ICON_UPLOAD_CONFIG, uploadFile } from '@/lib/s3/utils'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const requestHeaders = await headers()
    const session = await getSession(requestHeaders)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string | null
    const filePath = formData.get('filePath') as string | null
    const prefix = formData.get('prefix') as string | null
    const bucket = formData.get('bucket') as string | null
    const altText = formData.get('altText') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const originalName = fileName || file.name
    const lowerName = originalName.toLowerCase()

    if (prefix === 'footer-social-icon') {
      if (!lowerName.endsWith('.ico')) {
        return NextResponse.json(
          { error: 'Yalnızca .ico dosyaları yüklenebilir' },
          { status: 400 }
        )
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const uploadConfig =
      prefix === 'footer-social-icon'
        ? {
            ...FOOTER_SOCIAL_ICON_UPLOAD_CONFIG,
            uploadedBy: session.user.id,
            altText: altText?.trim() || null,
          }
        : {
            prefix: prefix || undefined,
            bucket: bucket || undefined,
            uploadedBy: session.user.id,
            customFileName: filePath || undefined,
            altText: altText?.trim() || null,
          }

    // Upload file to S3
    const uploadResult = await uploadFile(
      fileBuffer,
      originalName,
      file.type || 'image/x-icon',
      uploadConfig
    )

    logger.info(
      { fileId: uploadResult.id, fileName: uploadResult.fileName },
      'File uploaded successfully via API'
    )

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      url: uploadResult.url,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to upload file via API')

    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
