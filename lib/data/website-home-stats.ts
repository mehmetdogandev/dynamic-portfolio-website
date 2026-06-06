import 'server-only'

import { and, eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { homeStatSet } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'

export type WebsiteHomeStat = {
  value: string
  label: string
}

export async function getPublishedHomeStatSet(): Promise<
  WebsiteHomeStat[] | null
> {
  const db = getDbConnection()

  const row = await db
    .select({
      stat1Value: homeStatSet.stat1Value,
      stat1Label: homeStatSet.stat1Label,
      stat2Value: homeStatSet.stat2Value,
      stat2Label: homeStatSet.stat2Label,
      stat3Value: homeStatSet.stat3Value,
      stat3Label: homeStatSet.stat3Label,
      stat4Value: homeStatSet.stat4Value,
      stat4Label: homeStatSet.stat4Label,
    })
    .from(homeStatSet)
    .where(
      and(eq(homeStatSet.status, 'PUBLISHED'), excludeDeleted(homeStatSet))
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!row) return null

  return [
    { value: row.stat1Value, label: row.stat1Label },
    { value: row.stat2Value, label: row.stat2Label },
    { value: row.stat3Value, label: row.stat3Label },
    { value: row.stat4Value, label: row.stat4Label },
  ]
}
