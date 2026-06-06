import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutTechnology } from '@/lib/db/schema'

/** referance/.../skills-interests.tsx — technologies */
const TECHNOLOGY_ROWS = [
  {
    category: 'Backend & API',
    items: ['Node.js', 'Django', 'tRPC', 'REST API', 'PHP', 'C#'],
  },
  {
    category: 'Frontend',
    items: ['Next.js', 'Vue.js', 'React', 'TypeScript', 'HTML/CSS'],
  },
  {
    category: 'Veritabanı & Altyapı',
    items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Docker'],
  },
  {
    category: 'Diğer',
    items: ['Git', 'Judge0', 'Flutter', 'WordPress'],
  },
] as const

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(aboutTechnology)
    .where(isNull(aboutTechnology.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip about technology seed: table is not empty')
    return
  }

  let sortOrder = 0
  for (const group of TECHNOLOGY_ROWS) {
    for (const name of group.items) {
      await db.insert(aboutTechnology).values({
        category: group.category,
        name,
        sortOrder,
      })
      sortOrder += 1
    }
  }
  console.log(`  Seeded ${sortOrder} about technology row(s)`)
}
