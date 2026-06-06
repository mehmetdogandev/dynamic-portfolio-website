import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { japonFormen } from '@/lib/db/schema'

const FORMEN: {
  name: string
  surname: string
  phone: string
  notes?: string
}[] = [
  {
    name: 'Ahmet',
    surname: 'Yılmaz',
    phone: '+90 555 111 22 33',
    notes: 'Motor ve şanzıman uzmanı.',
  },
  {
    name: 'Mehmet',
    surname: 'Demir',
    phone: '+90 555 222 33 44',
    notes: 'Klima ve elektrik sistemleri.',
  },
  {
    name: 'Hasan',
    surname: 'Kaya',
    phone: '+90 555 333 44 55',
    notes: 'Triger ve periyodik bakım.',
  },
  {
    name: 'Murat',
    surname: 'Çelik',
    phone: '+90 555 444 55 66',
    notes: 'Akü ve diagnostik.',
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(japonFormen)
    .where(isNull(japonFormen.deletedAt))

  if ((row?.n ?? 0) > 0) {
    console.log('Skip japon-formen seed: japon_formen table already populated')
    return
  }

  for (const item of FORMEN) {
    await db.insert(japonFormen).values({
      name: item.name,
      surname: item.surname,
      phone: item.phone,
      notes: item.notes ?? null,
      isActive: true,
    })
  }

  console.log(`✓ Inserted ${FORMEN.length} japon formen`)
}
