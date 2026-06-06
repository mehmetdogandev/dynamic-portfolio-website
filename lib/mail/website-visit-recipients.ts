import { inArray, and, isNull } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db/database-utils'
import { user } from '@/lib/db/schema'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { getUserIdsWithScopePermission } from '@/lib/utils/rbac-notify-recipients'

/**
 * E-mail adresses of users who have ACCESS on both MAIL and MAIL_LOG scopes
 * (union, deduplicated) — for website visit notifications.
 */
export async function getWebsiteVisitRecipientEmails(): Promise<string[]> {
  const db = getDbConnection()
  const mailIds = await getUserIdsWithScopePermission(
    db,
    SCOPES.MAIL,
    PERMISSIONS.ACCESS
  )
  const logIds = await getUserIdsWithScopePermission(
    db,
    SCOPES.MAIL_LOG,
    PERMISSIONS.ACCESS
  )
  const ids = [...new Set([...mailIds, ...logIds])]
  if (ids.length === 0) return []
  const rows = await db
    .select({ email: user.email })
    .from(user)
    .where(and(inArray(user.id, ids), isNull(user.deletedAt)))
  return [...new Set(rows.map((r) => r.email).filter((e) => e.length > 0))]
}
