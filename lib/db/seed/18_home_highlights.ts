import { count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { homeHighlight } from '@/lib/db/schema'

const SEED_ROWS = [
  {
    title: 'Full-Stack Web',
    description:
      'Next.js, Django, Vue.js ile uçtan uca uygulamalar ve API tasarımı.',
    iconKey: 'code2',
  },
  {
    title: 'ERP & İş Süreçleri',
    description:
      'Kurumsal sistemler, Dolibarr, insan kaynakları ve operasyonel süreçler.',
    iconKey: 'database',
  },
  {
    title: 'IoT & Donanım',
    description:
      'ESP32, RFID, sensör tabanlı sistemler ve gerçek zamanlı veri toplama.',
    iconKey: 'cpu',
  },
  {
    title: 'Yapay Zeka & NLP',
    description:
      'Sohbet botları, doğal dil işleme ve model eğitimi projeleri.',
    iconKey: 'bot',
  },
] as const

export async function seed() {
  const [row] = await db.select({ n: count() }).from(homeHighlight)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip home_highlight seed: table is not empty')
    return
  }

  for (let i = 0; i < SEED_ROWS.length; i++) {
    const item = SEED_ROWS[i]!
    await db.insert(homeHighlight).values({
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
      sortOrder: i,
    })
    console.log(`  Seeded home_highlight: ${item.title}`)
  }
}
