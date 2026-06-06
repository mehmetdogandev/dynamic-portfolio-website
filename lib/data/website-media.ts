import 'server-only'

import { and, asc, desc, eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { file, media, mediaGroup } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type {
  WebsiteGalleryGroup,
  WebsiteGalleryItem,
} from '@/lib/website/types'

function mapKind(type: string): WebsiteGalleryItem['kind'] {
  if (type === 'ACTIVITY' || type === 'EVENT') return 'etkinlik'
  if (type === 'PROJECT') return 'project'
  if (type === 'COMMUNITY') return 'topluluk'
  return undefined
}

export async function getPublicMediaGroups(): Promise<WebsiteGalleryGroup[]> {
  const db = getDbConnection()
  const groupRows = await db
    .select({
      id: mediaGroup.id,
      name: mediaGroup.name,
      description: mediaGroup.description,
      sortOrder: mediaGroup.sortOrder,
    })
    .from(mediaGroup)
    .where(excludeDeleted(mediaGroup))
    .orderBy(asc(mediaGroup.sortOrder), asc(mediaGroup.createdAt))

  const mediaRows = await db
    .select({
      id: media.id,
      mediaGroupId: media.mediaGroupId,
      type: media.type,
      title: media.title,
      description: media.description,
      imageAlt: media.imageAlt,
      fileId: media.fileId,
      sortOrder: media.sortOrder,
    })
    .from(media)
    .where(excludeDeleted(media))
    .orderBy(asc(media.sortOrder), asc(media.createdAt))

  const itemByGroup = new Map<string, WebsiteGalleryItem[]>()
  for (const row of mediaRows) {
    if (!row.mediaGroupId || !row.fileId) continue
    const list = itemByGroup.get(row.mediaGroupId) ?? []
    list.push({
      id: row.id,
      title: row.title,
      imageSrc: `/api/files/${row.fileId}/view`,
      alt: (row.imageAlt?.trim() || row.title).trim(),
      caption: row.title,
      detail: row.description ?? undefined,
      kind: mapKind(row.type),
    })
    itemByGroup.set(row.mediaGroupId, list)
  }

  return groupRows
    .map((row) => ({
      id: row.id,
      title: row.name,
      subtitle: row.description ?? undefined,
      items: itemByGroup.get(row.id) ?? [],
    }))
    .filter((group) => group.items.length > 0)
}

export async function getPublicMediaPreview(): Promise<WebsiteGalleryItem | null> {
  const db = getDbConnection()
  const [row] = await db
    .select({
      id: media.id,
      title: media.title,
      description: media.description,
      type: media.type,
      imageAlt: media.imageAlt,
      fileId: media.fileId,
    })
    .from(media)
    .innerJoin(mediaGroup, eq(media.mediaGroupId, mediaGroup.id))
    .innerJoin(file, eq(media.fileId, file.id))
    .where(
      and(
        excludeDeleted(media),
        excludeDeleted(mediaGroup),
        excludeDeleted(file),
        eq(file.isDeleted, false)
      )
    )
    .orderBy(desc(media.createdAt))
    .limit(1)

  if (!row?.fileId) return null

  return {
    id: row.id,
    title: row.title,
    imageSrc: `/api/files/${row.fileId}/view`,
    alt: (row.imageAlt?.trim() || row.title).trim(),
    caption: row.title,
    detail: row.description ?? undefined,
    kind: mapKind(row.type),
  }
}
