// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === "undefined" && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
}
import * as Minio from "minio";

let _s3Client: Minio.Client | null = null;

/**
 * MinIO/S3 client instance. Lazy-initialized at runtime to avoid "Invalid endPoint"
 * during Next.js build when env vars are not available.
 * Requires S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY at runtime.
 */
export function getS3Client(): Minio.Client {
  if (!_s3Client) {
    const endPoint = process.env.S3_ENDPOINT ?? "";
    if (!endPoint) {
      throw new Error("S3_ENDPOINT is not configured");
    }
    _s3Client = new Minio.Client({
      endPoint,
      port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
      accessKey: process.env.S3_ACCESS_KEY ?? "",
      secretKey: process.env.S3_SECRET_KEY ?? "",
      useSSL: process.env.S3_USE_SSL === "true",
    });
  }
  return _s3Client;
}

/** Lazy proxy - defers MinIO client creation until first use (avoids build-time init) */
export const s3Client = new Proxy({} as Minio.Client, {
  get(_, prop) {
    const client = getS3Client();
    const value = client[prop as keyof Minio.Client];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
