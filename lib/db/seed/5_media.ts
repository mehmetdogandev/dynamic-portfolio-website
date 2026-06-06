import { and, count, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { media, mediaGroup } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'
import { STATIC_MEDIA_GROUPS, STATIC_MEDIA_ITEMS } from './media-static-data'

function toMediaType(kind: 'etkinlik' | 'project' | 'topluluk' | 'teknoloji') {
  if (kind === 'etkinlik' || kind === 'teknoloji') return 'ACTIVITY' as const
  if (kind === 'project') return 'PROJECT' as const
  return 'COMMUNITY' as const
}

const imageUrl = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1400&q=80`

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(media)
    .where(isNull(media.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip media seed: media table is not empty')
    return
  }

  // 1) Fetch existing media groups from system after media-group seed.
  const existingGroups = await db
    .select({
      id: mediaGroup.id,
      name: mediaGroup.name,
    })
    .from(mediaGroup)
    .where(isNull(mediaGroup.deletedAt))

  // 2) Build key -> current DB group id map by static group names.
  const groupIdByKey = new Map<string, string>()
  for (const staticGroup of STATIC_MEDIA_GROUPS) {
    const found = existingGroups.find((g) => g.name === staticGroup.name)
    if (!found) {
      throw new Error(
        `media seed: media group not found in DB (${staticGroup.name})`
      )
    }
    groupIdByKey.set(staticGroup.key, found.id)
  }

  const mediaIdByKey = new Map<string, string>()
  const roots = STATIC_MEDIA_ITEMS.filter((item) => item.parentKey === null)
  const children = STATIC_MEDIA_ITEMS.filter((item) => item.parentKey !== null)

  for (const [index, item] of [...roots, ...children].entries()) {
    const groupId = groupIdByKey.get(item.groupKey)
    if (!groupId) {
      throw new Error(
        `media seed: group key could not be mapped (${item.groupKey})`
      )
    }

    let parentMediaId: string | null = null
    if (item.parentKey) {
      parentMediaId = mediaIdByKey.get(item.parentKey) ?? null
      if (!parentMediaId) {
        throw new Error(
          `media seed: parent media not found (${item.parentKey})`
        )
      }
    }

    const res = await fetch(imageUrl(item.photoPath))
    if (!res.ok) {
      throw new Error(
        `media seed: failed to fetch image ${item.key} (${res.status})`
      )
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const upload = await uploadFile(buffer, `${item.key}.${ext}`, contentType, {
      prefix: 'seed/media',
      isPublic: true,
      altText: item.title,
    })

    const [inserted] = await db
      .insert(media)
      .values({
        mediaGroupId: groupId,
        fileId: upload.id,
        type: toMediaType(item.kind),
        title: item.title,
        description: item.detail,
        imageAlt: item.imageAlt?.trim() || item.title,
        parentMediaId,
        sortOrder: index,
      })
      .returning({ id: media.id })

    if (!inserted) {
      throw new Error(`media seed: failed to insert media (${item.key})`)
    }

    mediaIdByKey.set(item.key, inserted.id)
    console.log(`  Seeded media: ${item.title}`)
  }

  // Validate parent-media links after seed.
  for (const child of STATIC_MEDIA_ITEMS.filter(
    (item) => item.parentKey !== null
  )) {
    const childId = mediaIdByKey.get(child.key)
    const parentId = mediaIdByKey.get(child.parentKey!)
    if (!childId || !parentId) continue
    const row = await db
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, childId), eq(media.parentMediaId, parentId)))
      .limit(1)
      .then((r) => r[0])
    if (!row) {
      throw new Error(`media seed: parent relation missing (${child.key})`)
    }
  }
}
