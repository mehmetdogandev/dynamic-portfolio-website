import 'server-only'

import { asc } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { homeHighlight } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { HomeHighlightIconKey } from '@/lib/website/home-highlight-icons'

export type WebsiteHomeHighlight = {
  title: string
  description: string
  iconKey: HomeHighlightIconKey | string
}

export async function getPublicHomeHighlights(): Promise<
  WebsiteHomeHighlight[]
> {
  const db = getDbConnection()

  return db
    .select({
      title: homeHighlight.title,
      description: homeHighlight.description,
      iconKey: homeHighlight.iconKey,
    })
    .from(homeHighlight)
    .where(excludeDeleted(homeHighlight))
    .orderBy(asc(homeHighlight.sortOrder), asc(homeHighlight.createdAt))
}
