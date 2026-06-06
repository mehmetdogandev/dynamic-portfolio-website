import 'server-only'

import { getDbConnection } from '@/lib/db'
import { headerSettings } from '@/lib/db/schema'

export type PublicHeaderSettings = {
  stickyHeaderEnabled: boolean
  scrollProgressBarEnabled: boolean
}

export async function getPublicHeaderSettings(): Promise<PublicHeaderSettings> {
  const db = getDbConnection()
  const [row] = await db.select().from(headerSettings).limit(1)

  if (!row) {
    return {
      stickyHeaderEnabled: false,
      scrollProgressBarEnabled: false,
    }
  }

  return {
    stickyHeaderEnabled: row.stickyHeaderEnabled,
    scrollProgressBarEnabled: row.scrollProgressBarEnabled,
  }
}
