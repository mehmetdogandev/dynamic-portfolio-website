import { createHash, randomBytes } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { radioMobileApiKey } from '@/lib/db/schema/radio-mobile'
import type { RadioMobileChannelValue } from './channels'
import { CHANNEL_SCOPE } from './channels'

export function hashApiKey(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

export function generateApiKeyPlain(): string {
  return `rmk_${randomBytes(32).toString('hex')}`
}

export function extractApiKeyFromRequest(request: Request): string | null {
  const header =
    request.headers.get('x-radio-mobile-api-key') ??
    request.headers.get('authorization')
  if (!header) return null
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim()
  }
  return header.trim()
}

export async function verifyApiKeyForChannel(
  plainKey: string,
  channel: RadioMobileChannelValue
): Promise<{ ok: true; keyId: string } | { ok: false }> {
  const hash = hashApiKey(plainKey)
  const db = getDbConnection()
  const [row] = await db
    .select()
    .from(radioMobileApiKey)
    .where(
      and(
        eq(radioMobileApiKey.keyHash, hash),
        isNull(radioMobileApiKey.deletedAt)
      )
    )
    .limit(1)

  if (!row) return { ok: false }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { ok: false }
  }

  const allowed =
    (channel === 'android_release' && row.canAndroidRelease) ||
    (channel === 'android_debug' && row.canAndroidDebug) ||
    (channel === 'ios_release' && row.canIosRelease) ||
    (channel === 'ios_debug' && row.canIosDebug)

  if (!allowed) return { ok: false }

  await db
    .update(radioMobileApiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(radioMobileApiKey.id, row.id))

  return { ok: true, keyId: row.id }
}

export function channelPermissionField(channel: RadioMobileChannelValue) {
  return CHANNEL_SCOPE[channel]
}
