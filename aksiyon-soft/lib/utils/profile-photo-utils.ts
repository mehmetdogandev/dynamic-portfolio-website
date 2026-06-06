// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
import { getSignedUploadUrl, getSignedDownloadUrl } from '@/lib/s3/utils'

/**
 * S3 configuration for profile photos
 */
const PROFILE_BUCKET =
  process.env.S3_BUCKET_NAME || process.env.S3_BUCKET || 'uploads'

/**
 * Allowed file types for profile photos
 */
export const PROFILE_PHOTO_ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
} as const

export type ProfilePhotoAllowedMimeType =
  keyof typeof PROFILE_PHOTO_ALLOWED_FILE_TYPES

/**
 * Validate if a MIME type is allowed for profile photos
 */
export function validateProfilePhotoType(
  mimeType: string
): mimeType is ProfilePhotoAllowedMimeType {
  return mimeType in PROFILE_PHOTO_ALLOWED_FILE_TYPES
}

/**
 * Get the file extension for a given MIME type
 */
export function getProfilePhotoExtension(
  mimeType: string,
  originalName: string
): string {
  const extension = originalName
    .substring(originalName.lastIndexOf('.'))
    .toLowerCase()

  if (validateProfilePhotoType(mimeType)) {
    const allowedExtensions = PROFILE_PHOTO_ALLOWED_FILE_TYPES[mimeType]
    if (allowedExtensions.includes(extension)) {
      return extension
    }
  }

  throw new Error(
    `Invalid file extension "${extension}" for MIME type "${mimeType}"`
  )
}

/**
 * Generate profile photo-specific file path with proper structure
 * Structure: profile/{userId}/{uuid}{extension}
 */
export function getProfilePhotoPath(userId: string, fileName: string): string {
  return `profile/${userId}/${fileName}`
}

/**
 * Generate a unique filename for profile photos
 */
export function generateProfilePhotoFileName(originalName: string): string {
  const uuid = crypto.randomUUID()
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  return `${uuid}${extension}`
}

/**
 * Generate signed upload URL for profile photo
 *
 * @param originalName - Original file name with extension
 * @param mimeType - MIME type of the file
 * @param userId - User ID
 * @param expirySeconds - URL expiry time in seconds (default: 1 hour)
 * @returns Object with signed URL and generated file name
 */
export async function generateProfilePhotoUploadUrl(
  originalName: string,
  mimeType: string,
  userId: string,
  expirySeconds: number = 3600,
  forceHttps?: boolean
): Promise<{
  uploadUrl: string
  fileName: string
  filePath: string
}> {
  // Validate file type
  if (!validateProfilePhotoType(mimeType)) {
    throw new Error(
      `File type "${mimeType}" is not allowed for profile photos. Allowed types: ${Object.keys(PROFILE_PHOTO_ALLOWED_FILE_TYPES).join(', ')}`
    )
  }

  // Validate extension matches MIME type
  getProfilePhotoExtension(mimeType, originalName)

  // Generate unique file name
  const fileName = generateProfilePhotoFileName(originalName)

  // Generate full path
  const filePath = getProfilePhotoPath(userId, fileName)

  // Generate signed upload URL
  const uploadUrl = await getSignedUploadUrl(filePath, mimeType, {
    bucket: PROFILE_BUCKET,
    expiry: expirySeconds,
    forceHttps,
  })

  return {
    uploadUrl,
    fileName,
    filePath,
  }
}

/**
 * Generate signed download URL for profile photo
 *
 * @param filePath - Full path to file in S3 (e.g., profile/{userId}/{fileName})
 * @param expirySeconds - URL expiry time in seconds (default: 1 hour)
 * @returns Signed download URL
 */
export async function generateProfilePhotoDownloadUrl(
  filePath: string,
  expirySeconds: number = 3600,
  forceHttps?: boolean
): Promise<string> {
  return await getSignedDownloadUrl(filePath, {
    bucket: PROFILE_BUCKET,
    expiry: expirySeconds,
    forceHttps,
  })
}

/**
 * Validate profile photo file size
 * Default max size: 5MB for profile photos
 */
export function validateProfilePhotoSize(size: number): void {
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (size > maxSize) {
    throw new Error(
      `File size (${(size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (5 MB)`
    )
  }
}

/**
 * Parse profile photo path to extract components
 */
export function parseProfilePhotoPath(filePath: string): {
  userId: string
  fileName: string
} | null {
  const match = filePath.match(/^profile\/([^/]+)\/([^/]+)$/)

  if (!match) {
    return null
  }

  return {
    userId: match[1],
    fileName: match[2],
  }
}
