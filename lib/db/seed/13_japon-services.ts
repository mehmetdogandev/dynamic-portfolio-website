import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { japonService } from '@/lib/db/schema'

const SERVICES: { name: string; description: string }[] = [
  {
    name: 'Yağ ve filtre değişimi',
    description: 'Motor yağı, yağ filtresi ve hava filtresi değişimi.',
  },
  {
    name: 'Fren balata değişimi',
    description: 'Ön/arka fren balatalarının kontrolü ve değişimi.',
  },
  {
    name: 'Lastik rotasyonu',
    description: '4 lastiğin pozisyon değişimi ve hava basıncı ayarı.',
  },
  {
    name: 'Akü kontrolü ve değişimi',
    description: 'Akü voltaj testi ve gerekirse yenisi ile değişimi.',
  },
  {
    name: 'Triger seti değişimi',
    description: 'Triger kayışı, gergi ve rulman setinin değişimi.',
  },
  {
    name: 'Klima bakımı',
    description:
      'Klima gazı şarjı, polen filtresi değişimi ve sistem temizliği.',
  },
  {
    name: 'Periyodik bakım',
    description: 'Üretici servis kılavuzuna göre tam kapsamlı kontrol.',
  },
  {
    name: 'Arıza tespiti (diagnostik)',
    description: 'OBD2 cihazı ile elektronik arıza tespiti.',
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(japonService)
    .where(isNull(japonService.deletedAt))

  if ((row?.n ?? 0) > 0) {
    console.log(
      'Skip japon-services seed: japon_services table already populated'
    )
    return
  }

  for (const item of SERVICES) {
    await db.insert(japonService).values({
      name: item.name,
      description: item.description,
      isActive: true,
    })
  }

  console.log(`✓ Inserted ${SERVICES.length} japon services`)
}
