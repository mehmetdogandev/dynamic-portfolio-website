// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === "undefined" && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
}
import { s3Client } from "./index";
import { file as fileTable } from "@/lib/db/schemas";
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Configuration for S3 operations
 */
const S3_BUCKET = process.env.S3_BUCKET_NAME ?? "uploads";
const S3_REGION = process.env.S3_REGION ?? "us-east-1";

/** Default year for file table (schema requires it; no partitioning) */
function getDefaultYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Supported file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  "image/jpeg": ".jpg,.jpeg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/tiff": ".tiff,.tif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/mpeg": ".mpeg",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/x-ms-wmv": ".wmv",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/3gpp": ".3gp",
  "audio/3gpp2": ".3g2",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "text/html": ".html",
  "text/css": ".css",
  "text/javascript": ".js",
  "text/xml": ".xml",
  "text/markdown": ".md",
  "text/vcard": ".vcf",
  "text/vcalendar": ".vcs",
  "text/calendar": ".ics",
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

export interface UploadConfig {
  maxSize?: number;
  allowedTypes?: AllowedMimeType[];
  bucket?: string;
  prefix?: string;
}

export interface UploadResult {
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  bucket: string;
  url: string;
  etag: string;
  id: string;
  fileId: string;
}

export interface UploadFileOptions extends UploadConfig {
  uploadedBy?: string;
  organizationId?: string;
  isPublic?: boolean;
}

export interface SignedUrlOptions {
  expiry?: number;
  bucket?: string;
  headers?: Record<string, string>;
  maxSize?: number;
  forceHttps?: boolean;
}

function generateFileName(originalName: string, prefix?: string): string {
  const uuid = crypto.randomUUID();
  const extension = originalName.substring(originalName.lastIndexOf("."));
  return prefix ? `${prefix}/${uuid}${extension}` : `${uuid}${extension}`;
}

function isAllowedMimeType(
  mimeType: string,
  config: UploadConfig = {}
): mimeType is AllowedMimeType {
  const allowedTypes =
    config.allowedTypes ?? (Object.keys(ALLOWED_FILE_TYPES) as AllowedMimeType[]);
  return allowedTypes.includes(mimeType as AllowedMimeType);
}

function validateFile(
  file: Buffer | Uint8Array,
  mimeType: string,
  originalName: string,
  config: UploadConfig = {}
): void {
  const maxSize = config.maxSize ?? 100 * 1024 * 1024;
  if (file.length > maxSize) {
    throw new Error(
      `File size (${file.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`
    );
  }
  if (!isAllowedMimeType(mimeType, config)) {
    throw new Error(`File type "${mimeType}" is not allowed.`);
  }
  const extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
  const expectedExtensions = ALLOWED_FILE_TYPES[mimeType as AllowedMimeType];
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    throw new Error(
      `File extension "${extension}" does not match MIME type "${mimeType}"`
    );
  }
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  config: UploadFileOptions & { customFileName?: string } = {}
): Promise<UploadResult> {
  try {
    validateFile(file, mimeType, originalName, config);
    const bucket = config.bucket ?? S3_BUCKET;
    const fileName =
      config.customFileName ?? generateFileName(originalName, config.prefix);
    const year = getDefaultYear();

    const bucketExists = await s3Client.bucketExists(bucket);
    if (!bucketExists) {
      await s3Client.makeBucket(bucket, S3_REGION);
    }

    const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    const uploadResult = await s3Client.putObject(
      bucket,
      fileName,
      fileBuffer,
      fileBuffer.length,
      {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
      }
    );

    const [fileRecord] = await db
      .insert(fileTable)
      .values({
        fileName,
        originalName,
        mimeType,
        size: fileBuffer.length,
        bucket,
        url: "",
        etag: uploadResult.etag ?? "",
        prefix: config.prefix ?? null,
        uploadedBy: config.uploadedBy ?? null,
        organizationId: config.organizationId ?? null,
        isPublic: config.isPublic ?? false,
        year,
      })
      .returning({ id: fileTable.id });

    if (!fileRecord) throw new Error("File record was not created");
    const url = `api/files/${fileRecord.id}/view`;
    await db.update(fileTable).set({ url }).where(eq(fileTable.id, fileRecord.id));

    return {
      fileName,
      originalName,
      size: fileBuffer.length,
      mimeType,
      bucket,
      url,
      etag: uploadResult.etag ?? "",
      id: fileRecord.id,
      fileId: fileRecord.id,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        fileName: originalName,
        mimeType,
        bucket: config.bucket ?? S3_BUCKET,
      },
      "Failed to upload file"
    );
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function uploadFiles(
  files: Array<{ file: Buffer | Uint8Array; originalName: string; mimeType: string }>,
  config: UploadFileOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(({ file, originalName, mimeType }) =>
    uploadFile(file, originalName, mimeType, config)
  );
  return Promise.all(uploadPromises);
}

export async function getFile(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<Buffer> {
  try {
    const stream = await s3Client.getObject(bucket, fileName);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  } catch (error) {
    throw new Error(
      `Failed to get file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getFiles(
  fileNames: string[],
  bucket: string = S3_BUCKET
): Promise<Array<{ fileName: string; data: Buffer }>> {
  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      data: await getFile(fileName, bucket),
    }))
  );
}

export async function deleteFile(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<void> {
  try {
    await s3Client.removeObject(bucket, fileName);
    await db
      .delete(fileTable)
      .where(and(eq(fileTable.fileName, fileName), eq(fileTable.bucket, bucket)));
  } catch (error) {
    throw new Error(
      `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function deleteFiles(
  fileNames: string[],
  bucket: string = S3_BUCKET
): Promise<void> {
  try {
    await s3Client.removeObjects(bucket, fileNames);
    await db
      .delete(fileTable)
      .where(
        and(
          inArray(fileTable.fileName, fileNames),
          eq(fileTable.bucket, bucket)
        )
      );
  } catch (error) {
    throw new Error(
      `Failed to delete files: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function makeProtocolRelative(url: string): string {
  if (url.startsWith("//")) return url;
  return url.replace(/^https?:\/\//, "//");
}

export async function getSignedDownloadUrl(
  fileName: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  const bucket = options.bucket ?? S3_BUCKET;
  const expiry = options.expiry ?? 3600;
  const url = await s3Client.presignedGetObject(bucket, fileName, expiry);
  return makeProtocolRelative(url);
}

export async function getSignedUploadUrl(
  fileName: string,
  _mimeType: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  const bucket = options.bucket ?? S3_BUCKET;
  const expiry = options.expiry ?? 3600;
  const url = await s3Client.presignedPutObject(bucket, fileName, expiry);
  return makeProtocolRelative(url);
}

export async function getSignedUrls(
  fileNames: string[],
  type: "download" | "upload" = "download",
  mimeType?: string,
  options: SignedUrlOptions = {}
): Promise<Array<{ fileName: string; url: string }>> {
  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      url:
        type === "upload" && mimeType
          ? await getSignedUploadUrl(fileName, mimeType, options)
          : await getSignedDownloadUrl(fileName, options),
    }))
  );
}

export async function fileExists(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<boolean> {
  try {
    await s3Client.statObject(bucket, fileName);
    return true;
  } catch {
    return false;
  }
}

export async function getFileMetadata(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<{
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
}> {
  const stat = await s3Client.statObject(bucket, fileName);
  return {
    size: stat.size,
    lastModified: stat.lastModified,
    etag: stat.etag ?? "",
    contentType: stat.metaData?.["content-type"] ?? "application/octet-stream",
  };
}

export async function listFiles(
  bucket: string = S3_BUCKET,
  prefix?: string,
  maxFiles: number = 1000
): Promise<Array<{ name: string; size: number; lastModified: Date; etag: string }>> {
  const files: Array<{ name: string; size: number; lastModified: Date; etag: string }> = [];
  return new Promise((resolve, reject) => {
    const stream = s3Client.listObjects(bucket, prefix, false);
    stream.on("data", (obj) => {
      if (files.length < maxFiles && obj.name) {
        files.push({
          name: obj.name,
          size: obj.size ?? 0,
          lastModified: obj.lastModified ?? new Date(),
          etag: obj.etag ?? "",
        });
      }
    });
    stream.on("end", () => resolve(files));
    stream.on("error", reject);
  });
}

export async function copyFile(
  sourceFileName: string,
  destFileName: string,
  sourceBucket: string = S3_BUCKET,
  destBucket: string = S3_BUCKET
): Promise<void> {
  await s3Client.copyObject(
    destBucket,
    destFileName,
    `${sourceBucket}/${sourceFileName}`
  );
}

/** Get file record by id (no year; single table) */
export async function getFileRecord(
  fileId: string
): Promise<(typeof fileTable.$inferSelect) | null> {
  const [fileRecord] = await db
    .select()
    .from(fileTable)
    .where(and(eq(fileTable.id, fileId), eq(fileTable.isDeleted, false)))
    .limit(1);
  return fileRecord ?? null;
}

export async function getFileRecordByName(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<(typeof fileTable.$inferSelect) | null> {
  const [fileRecord] = await db
    .select()
    .from(fileTable)
    .where(
      and(
        eq(fileTable.fileName, fileName),
        eq(fileTable.bucket, bucket),
        eq(fileTable.isDeleted, false)
      )
    )
    .limit(1);
  return fileRecord ?? null;
}

export async function getFileWithLogging(
  fileName: string,
  bucket: string = S3_BUCKET,
  _accessType: string = "download"
): Promise<Buffer> {
  const fileRecord = await getFileRecordByName(fileName, bucket);
  if (!fileRecord) throw new Error("File record not found");
  return getFile(fileName, bucket);
}

export async function listFilesWithRecords(
  organizationId?: string,
  uploadedBy?: string,
  isPublic?: boolean,
  limit: number = 100
): Promise<Array<typeof fileTable.$inferSelect>> {
  const conditions = [eq(fileTable.isDeleted, false)];
  if (organizationId) conditions.push(eq(fileTable.organizationId, organizationId));
  if (uploadedBy) conditions.push(eq(fileTable.uploadedBy, uploadedBy));
  if (isPublic !== undefined) conditions.push(eq(fileTable.isPublic, isPublic));
  return db
    .select()
    .from(fileTable)
    .where(and(...conditions))
    .orderBy(fileTable.createdAt)
    .limit(limit);
}

export async function getFileFromS3(
  fileName: string,
  bucket?: string
): Promise<Buffer> {
  const bucketName = bucket ?? S3_BUCKET;
  const stream = await s3Client.getObject(bucketName, fileName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
