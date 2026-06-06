import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutExpertise } from '@/lib/db/schema'

/** referance/.../skills-interests.tsx — proficiencyAreas */
const EXPERTISE_ROWS = [
  {
    title: 'IoT ve Donanım Yazılımı',
    description:
      'ESP32, RFID ve sensör tabanlı sistemler. Personel giriş-çıkış, otomasyon ve gerçek zamanlı veri toplama projelerinde deneyim.',
    keywords: ['ESP32', 'RFID', 'Gerçek zamanlı veri', 'Otomasyon'],
  },
  {
    title: 'ERP ve İş Süreçleri',
    description:
      'Kurumsal Kaynak Planlaması, Dolibarr, insan kaynakları, envanter ve operasyonel süreçlerin dijitalleştirilmesi.',
    keywords: ['ERP', 'Dolibarr', 'İş süreçleri', 'CRM'],
  },
  {
    title: 'Full-Stack Web Geliştirme',
    description:
      'Next.js, Django, Vue.js ile uçtan uca uygulamalar. API tasarımı, veritabanı modellemesi ve dağıtım.',
    keywords: ['Next.js', 'Django', 'Vue.js', 'tRPC', 'REST API'],
  },
  {
    title: 'Yapay Zeka ve NLP',
    description:
      "Doğal dil işleme, sohbet botları (GetCody), model eğitimi. T3 AI'LE topluluğunda araştırma ve DENEYAP'ta eğitim deneyimi.",
    keywords: ['Python', 'NLP', 'Model eğitimi', 'Sohbet botları'],
  },
] as const

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(aboutExpertise)
    .where(isNull(aboutExpertise.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip about expertise seed: table is not empty')
    return
  }

  for (const [index, item] of EXPERTISE_ROWS.entries()) {
    await db.insert(aboutExpertise).values({
      title: item.title,
      description: item.description,
      keywords: [...item.keywords],
      sortOrder: index,
    })
    console.log(`  Seeded about expertise: ${item.title}`)
  }
}
