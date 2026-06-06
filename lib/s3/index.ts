// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
import * as Minio from 'minio'

if (
  !process.env.S3_ENDPOINT ||
  !process.env.S3_ACCESS_KEY ||
  !process.env.S3_SECRET_KEY
) {
  throw new Error('S3 configuration is missing in environment variables')
}

/**
 * `S3_ENDPOINT=minio` yalnızca Docker Compose ağında çözülür. Host üzerinden
 * `pnpm db:seed` hostta çalışırken seed `S3_HOST_OVERRIDE=127.0.0.1` set edebilir
 * (`.dockerenv` yoksa; bkz. `lib/db/seed/index.ts`).
 *
 * Next.js sürecinde (`NEXT_RUNTIME` tanımlı) `S3_HOST_OVERRIDE` **yok sayılır**:
 * `.env` içinde kalırsa konteyner loopback’e bağlanıp dosya API’leri 500 verir.
 */
function resolveS3EndPoint(): string {
  const configured = process.env.S3_ENDPOINT!.trim()
  const override = process.env.S3_HOST_OVERRIDE?.trim()
  const isNextJsRuntime =
    typeof process.env.NEXT_RUNTIME === 'string' &&
    process.env.NEXT_RUNTIME.length > 0

  if (configured === 'minio' && override && !isNextJsRuntime) {
    return override
  }
  return configured
}

/**
 * MinIO/S3 client instance configured for object storage operations.
 *
 * This client provides secure, high-performance object storage capabilities:
 * - **Multi-provider Support**: Compatible with AWS S3, MinIO, and S3-compatible services
 * - **Environment Configuration**: Automatically configured from environment variables
 * - **Flexible Connectivity**: Supports both HTTP and HTTPS connections
 * - **Port Configuration**: Handles custom port configurations for local/development setups
 * - **Security**: Validates required credentials at initialization
 *
 * Required environment variables:
 * - `S3_ENDPOINT`: Storage service endpoint (e.g., 's3.amazonaws.com', 'localhost')
 * - `S3_ACCESS_KEY`: Access key for authentication
 * - `S3_SECRET_KEY`: Secret key for authentication
 * - `S3_PORT`: Optional port number (defaults to standard ports)
 * - `S3_USE_SSL`: Optional SSL/TLS usage ('true'/'false', defaults to false)
 *
 * @throws {Error} When required S3 configuration environment variables are missing
 *
 * @example
 * ```typescript
 * // Environment setup (.env.local)
 * S3_ENDPOINT=localhost
 * S3_PORT=9000
 * S3_ACCESS_KEY=minioadmin
 * S3_SECRET_KEY=minioadmin
 * S3_USE_SSL=false
 *
 * // Usage
 * await s3Client.putObject('bucket', 'file.jpg', fileBuffer)
 * ```
 */
export const s3Client = new Minio.Client({
  endPoint: resolveS3EndPoint(),
  port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  useSSL: process.env.S3_USE_SSL === 'true',
})
