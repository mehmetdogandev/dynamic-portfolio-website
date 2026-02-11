// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === "undefined" && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
}
import * as Minio from "minio";

/**
 * MinIO/S3 client instance. Requires S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY at runtime when used.
 * Optional: S3_PORT, S3_USE_SSL, S3_BUCKET_NAME, S3_REGION
 */
export const s3Client = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT ?? "",
  port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
  accessKey: process.env.S3_ACCESS_KEY ?? "",
  secretKey: process.env.S3_SECRET_KEY ?? "",
  useSSL: process.env.S3_USE_SSL === "true",
});
