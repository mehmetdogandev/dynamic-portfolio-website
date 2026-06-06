import 'server-only'

import { getDbConnection } from '@/lib/db'
import { reference } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { excludeDeleted } from '@/lib/db/utils'
import type { WebsiteReference } from '@/lib/website/types'
import {
  referenceMonogramClassForId,
  referenceMonogramText,
} from '@/lib/reference/monogram'

/**
 * Kamuya açık referans listesi (RSC / server actions).
 * Soft silinenler dahil edilmez.
 */
export async function getPublicReferences(): Promise<WebsiteReference[]> {
  const db = getDbConnection()
  const rows = await db
    .select({
      id: reference.id,
      name: reference.name,
      sector: reference.sector,
      description: reference.description,
      summary: reference.summary,
      websiteUrl: reference.websiteUrl,
      logoId: reference.logoId,
      logoAlt: reference.logoAlt,
    })
    .from(reference)
    .where(excludeDeleted(reference))
    .orderBy(asc(reference.sortOrder), asc(reference.createdAt))

  return rows.map(
    (r): WebsiteReference => ({
      id: r.id,
      name: r.name,
      sector: r.sector,
      description: r.description ?? undefined,
      summary: r.summary ?? undefined,
      websiteUrl: r.websiteUrl ?? undefined,
      logoSrc: r.logoId ? `/api/files/${r.logoId}/view` : undefined,
      logoAlt: r.logoAlt ?? undefined,
      logoText: referenceMonogramText(r.name),
      monogramClass: referenceMonogramClassForId(r.id),
    })
  )
}
