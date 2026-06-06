import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutInterest } from '@/lib/db/schema'

/** referance/.../skills-interests.tsx — interests */
const INTEREST_ROWS = [
  'Açık kaynak projeler',
  'Topluluk ve mentorluk',
  'Yazılım eğitimi',
  'Elektrikli araç ve mobilite teknolojileri',
  'İş süreçlerinin dijitalleştirilmesi',
] as const

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(aboutInterest)
    .where(isNull(aboutInterest.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip about interest seed: table is not empty')
    return
  }

  for (const [index, label] of INTEREST_ROWS.entries()) {
    await db.insert(aboutInterest).values({
      label,
      sortOrder: index,
    })
    console.log(`  Seeded about interest: ${label}`)
  }
}
