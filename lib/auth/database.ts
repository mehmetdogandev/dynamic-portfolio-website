import { betterAuth } from 'better-auth'
import { createAuthAdapter } from './adapter'
import { admin, username } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { sendMail } from '../mail'
import { getDbConnection } from '../db/database-utils'
import { user as userTable } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getPasswordResetAppOrigin } from './password-reset-origin'
import { adminHref } from '@/lib/admin-path'
/**
 * Cache for auth instances to avoid recreating them on every request.
 */
let authInstanceCache: AuthInstance | null = null

/**
 * Multi-tenant Better Auth configuration factory with instance caching.
 *
 * Creates and caches year-specific auth instances with separate databases and sessions.
 * Each year has its own:
 * - Database connection (aksiyonsoft etc.)
 * - Session cookies (aksiyonsoft-session etc.)
 * - User base and authentication state
 *
 * Performance: Auth instances are cached in memory to avoid expensive recreation
 * on every request (~40-80% performance improvement).
 *
 * @returns Cached Better Auth instance
 */
export function createAuthInstance() {
  if (authInstanceCache) {
    return authInstanceCache
  }

  const authInstance = createAuthInstanceUncached()
  authInstanceCache = authInstance
  return authInstance
}

type AuthInstance = ReturnType<typeof createAuthInstanceUncached>
function createAuthInstanceUncached() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins:
      process.env.TRUSTED_ORIGINS?.split(',')
        .map((o) => o.trim())
        .filter(Boolean) ?? [],
    session: {
      cookieCache: {
        enabled: false,
        // maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
      },
      cookieName: 'mehmetdogandev-session',
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, token }) => {
        const yearDb = getDbConnection()

        const [userFromDB] = await yearDb
          .select({
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.id, user.id))
          .limit(1)

        if (!userFromDB?.email) {
          throw new Error('User not found')
        }

        const baseUrl = getPasswordResetAppOrigin(new Headers())
        const resetUrl = `${baseUrl}${adminHref('/reset-password')}?token=${encodeURIComponent(token)}`

        const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:15px;line-height:1.5;color:#333;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #e0e0e0;">
          <tr>
            <td style="height:4px;background-color:#2c3e50;"></td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Şifre sıfırlama</p>
              <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#1f2937;">Yeni şifre belirleyin</h1>
              <p style="margin:0 0 20px;color:#4b5563;">Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bağlantı tek kullanımlık ve süre sınırlıdır.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#1e293b;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-weight:600;color:#ffffff;text-decoration:none;">Şifremi sıfırla</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;word-break:break-all;color:#6b7280;">Bağlantı çalışmazsa kopyalayın:<br/>${resetUrl}</p>
              <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Bu talebi siz yapmadıysanız bu e-postayı yok sayın.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">Aksiyon Soft — Yönetim paneli</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim()

        await sendMail({
          to: userFromDB.email,
          subject: 'Şifre sıfırlama — Aksiyon Soft',
          html,
        })
      },
    },
    plugins: [
      username({
        minUsernameLength: 1,
        maxUsernameLength: 100,
        usernameValidator: (name) => {
          const t = name.trim()
          return t.length >= 1 && t.length <= 100
        },
      }),
      admin({
        adminUserIds: [],
      }),
      nextCookies(),
    ],
    user: {
      additionalFields: {
        lastName: {
          type: 'string',
          required: true,
        },
      },
    },
    database: createAuthAdapter(),
  })
}

/**
 * Clear cached auth instance for a specific year.
 * Use this when auth configuration changes or for cleanup.
 *
 * @param year - The year to clear cache for (optional, clears all if not provided)
 */
export function clearAuthInstanceCache() {
  authInstanceCache = null
}

/**
 * Get the default auth instance for the current year.
 * Provides backwards compatibility with existing code.
 */
export function getDefaultAuthInstance() {
  return createAuthInstance()
}

// Export default auth instance for backwards compatibility
export const auth = getDefaultAuthInstance()

export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = AuthSession['user']
