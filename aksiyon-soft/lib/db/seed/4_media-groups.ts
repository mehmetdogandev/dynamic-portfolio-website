import { and, count, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mediaGroup } from '@/lib/db/schema'
import { STATIC_MEDIA_GROUPS } from './media-static-data'

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(mediaGroup)
    .where(isNull(mediaGroup.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip media-group seed: media_group table is not empty')
    return
  }

  const insertedMap = new Map<string, string>()
  for (const [index, group] of STATIC_MEDIA_GROUPS.entries()) {
    const parentId = group.parentKey ? insertedMap.get(group.parentKey) : null
    if (group.parentKey && !parentId) continue

    const [inserted] = await db
      .insert(mediaGroup)
      .values({
        name: group.name,
        description: group.description ?? null,
        parentMediaGroupId: parentId ?? null,
        sortOrder: index,
      })
      .returning({ id: mediaGroup.id })
    if (inserted) insertedMap.set(group.key, inserted.id)
  }

  // Verify seeded rows can be listed from DB (used by next media seed).
  const existing = await db
    .select({ id: mediaGroup.id, name: mediaGroup.name })
    .from(mediaGroup)
    .where(isNull(mediaGroup.deletedAt))

  for (const group of STATIC_MEDIA_GROUPS) {
    const found = existing.find((x) => x.name === group.name)
    if (!found) {
      throw new Error(
        `media-group seed: group not found after insert (${group.name})`
      )
    }
  }

  // Check parent references in DB after insertion.
  for (const group of STATIC_MEDIA_GROUPS.filter((x) => x.parentKey !== null)) {
    const child = existing.find((x) => x.name === group.name)
    const parent = existing.find(
      (x) =>
        x.name ===
        STATIC_MEDIA_GROUPS.find((g) => g.key === group.parentKey)?.name
    )
    if (!child || !parent) continue
    const relation = await db
      .select({ id: mediaGroup.id })
      .from(mediaGroup)
      .where(
        and(
          eq(mediaGroup.id, child.id),
          eq(mediaGroup.parentMediaGroupId, parent.id)
        )
      )
      .limit(1)
      .then((r) => r[0])
    if (!relation) {
      throw new Error(
        `media-group seed: parent relation missing (${group.name})`
      )
    }
  }
}
