'use server'
// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
import { headers } from 'next/headers'
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import z from 'zod/v4'
import { createAuthInstance } from '../auth/database'
import { getDbConnection, user } from '../db'
import { eq, sql } from 'drizzle-orm'
import { session as sessionTable } from '../db/schema'
const signInSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

type SignInFormData = z.infer<typeof signInSchema>

const signUpSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(100, 'Username must be at most 100 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  email: z.email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100),
})
type SignUpFormData = z.infer<typeof signUpSchema>

/**
 * Multi-tenant session retrieval utility for Next.js applications.
 *
 * Extracts the year from request headers and uses the appropriate auth instance
 * to retrieve the session data. This enables year-specific authentication
 * across the entire application.
 *
 * @param _headers - Optional headers object (defaults to Next.js headers())
 * @param year - Optional year override (defaults to header value or current year)
 * @returns {Promise<Session | null>} User session data or null if not authenticated
 *
 * @example
 * ```typescript
 * // In a Server Component (auto-detects year from headers)
 * const session = await getSession()
 *
 * // In an API Route with explicit year
 * const session = await getSession(headers, '2024')
 *
 * // In TRPC context
 * const session = await getSession(opts.headers)
 * ```
 */
export const getSession = async (_headers?: Headers | ReadonlyHeaders) => {
  const requestHeaders = _headers || (await headers())

  const auth = createAuthInstance()

  return await auth.api.getSession({
    headers: requestHeaders,
  })
}

/**
 * Cached session retrieval for performance optimization.
 * Uses React's cache primitive to avoid duplicate session calls.
 */
export const getCachedSession = async (headers: Headers) => {
  // "use cache";
  // DISABLED DUE TO NEXT-WS RUNTIME COMPATIBILITY ISSUES WITH USE-CACHE FLAG, DO NOT RE-ENABLE WITHOUT TESTING FIRST
  return await getSession(headers)
}

/**
 * Multi-tenant sign up function.
 * Creates user in the specified year's database.
 */
export const signUp = async ({
  username,
  password,
  email,
  name,
  lastName,
}: SignUpFormData) => {
  const result = signUpSchema.safeParse({
    username,
    password,
    email,
    name,
    lastName,
  })

  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Invalid input' }
  }

  try {
    const auth = createAuthInstance()

    const signUpResult = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email,
        password,
        name,
        lastName,
        username,
      },
    })

    return { success: true, user: signUpResult.user }
  } catch (_error) {
    return { error: 'An error occurred during sign up' }
  }
}

type SafeSignInResult = {
  user?: unknown
  token?: string
  session?: {
    id: string
  }
}

export const signIn = async (data: SignInFormData) => {
  const parsed = signInSchema.safeParse(data)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    if (firstError) {
      const message = firstError.message

      if (
        message.includes('Invalid email') ||
        message.includes('email address')
      ) {
        return { error: 'Geçerli bir e-posta adresi giriniz' }
      }
      if (message.includes('Password must be at least 6 characters')) {
        return { error: 'Şifre en az 6 karakter olmalıdır' }
      }
      if (message.includes('Password must be less than 100 characters')) {
        return { error: 'Şifre 100 karakterden az olmalıdır' }
      }

      return { error: message }
    }
    return { error: 'Geçersiz giriş bilgileri' }
  }

  const emailInput = data.email.trim()
  const password = data.password

  try {
    const auth = createAuthInstance()
    const db = getDbConnection()

    const normalizedEmail = emailInput.toLowerCase()

    const [_user] = await db
      .select({
        id: user.id,
        deletedAt: user.deletedAt,
        email: user.email,
      })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      .limit(1)

    if (!_user) {
      return { error: 'Kullanıcı bulunamadı' }
    }

    if (_user.deletedAt) {
      return {
        error:
          'Pasife alınan kullanıcılar sisteme giriş yapamazlar, lütfen sistem yöneticisi ile iletişime geçiniz.',
      }
    }

    const requestHeaders = await headers()

    const signInResult = (await auth.api.signInEmail({
      headers: requestHeaders,
      body: {
        email: _user.email,
        password,
      },
    })) as SafeSignInResult

    if (!signInResult?.token && !signInResult?.session?.id) {
      return {
        error: 'Şifre hatalı. Lütfen şifrenizi kontrol edin.',
      }
    }

    try {
      const hdr = requestHeaders.get('x-device-info')
      const macHdr = requestHeaders.get('x-device-mac')
      const localIpHdr = requestHeaders.get('x-device-local-ip')
      const globalIpHdr = requestHeaders.get('x-device-global-ip')

      let parsed: Record<string, unknown> | null = null
      if (hdr) {
        try {
          const decoded = Buffer.from(hdr, 'base64').toString('utf8')
          parsed = JSON.parse(decoded)
        } catch (_e) {
          parsed = null
        }
      }

      const device = {
        mac: macHdr ?? (parsed && (parsed['mac'] as string)) ?? null,
        localIp:
          localIpHdr ?? (parsed && (parsed['localIp'] as string)) ?? null,
        globalIp:
          globalIpHdr ?? (parsed && (parsed['globalIp'] as string)) ?? null,
      } as {
        mac?: string | null
        localIp?: string | null
        globalIp?: string | null
      }

      const sessionId = signInResult.session?.id ?? null
      const token = signInResult.token ?? null
      const targetDb = getDbConnection()
      if (sessionId || token) {
        const whereClause = sessionId
          ? eq(sessionTable.id, sessionId)
          : eq(sessionTable.token, token as string)

        await targetDb
          .update(sessionTable)
          .set({
            macAddress: device.mac || undefined,
            deviceLocalIp: device.localIp || undefined,
            deviceGlobalIp: device.globalIp || undefined,
            updatedAt: new Date(),
          })
          .where(whereClause)
      }
    } catch (_err) {}

    return {
      success: true,
      user: signInResult.user,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (
      errorMessage.includes('Invalid password') ||
      errorMessage.includes('incorrect password')
    ) {
      return { error: 'Şifre hatalı. Lütfen şifrenizi kontrol edin.' }
    }
    if (
      errorMessage.includes('User not found') ||
      errorMessage.includes('user not found')
    ) {
      return { error: 'Kullanıcı bulunamadı. E-posta adresinizi kontrol edin.' }
    }

    return {
      error:
        'Giriş yapılamadı. E-posta ve şifrenizi kontrol edip tekrar deneyin.',
    }
  }
}

export const signOut = async () => {
  try {
    const auth = createAuthInstance()

    await auth.api.signOut({
      headers: await headers(),
    })

    return { success: true }
  } catch (error) {
    console.error('[auth:signOut]', error)
    return { error: 'An error occurred during sign out' }
  }
}

export async function revokeAdminSession(
  hdrs: Headers | ReadonlyHeaders
): Promise<void> {
  const auth = createAuthInstance()
  try {
    await auth.api.signOut({ headers: hdrs })
  } catch {
    // ignore
  }
}
