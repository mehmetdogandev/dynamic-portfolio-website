import { db } from '@/lib/db'
import { headerSettings } from '@/lib/db/schema'

export async function seed() {
  const existing = await db
    .select({ id: headerSettings.id })
    .from(headerSettings)
    .limit(1)
  if (existing.length > 0) {
    console.log('Skip header_settings seed: row already exists')
    return
  }

  await db.insert(headerSettings).values({
    stickyHeaderEnabled: false,
    scrollProgressBarEnabled: false,
  })
  console.log('  Seeded header_settings (defaults)')
}
