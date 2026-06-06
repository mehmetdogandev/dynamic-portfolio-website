import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutPageProfile } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'

/** referance/dynamic-portfolio-website/src/config/site.ts — about bloğu */
const PROFILE_SEED = {
  lead: 'Yazılım, benim için sadece bir meslek değil; problemleri çözmek, sistemleri tasarlamak ve insanların işini kolaylaştırmak anlamına geliyor. Bu tutkuyla yola çıkarak hem kurumsal dünyada hem de topluluk ve girişim tarafında deneyim kazanmaya devam ediyorum.',
  intro:
    "Aksaray Üniversitesi Yazılım Mühendisliği bölümünde lisans eğitimime devam ederken, Anadolu Mikronize'de Yazılım Destek Uzmanı olarak çalışıyorum. Şirketin dijital dönüşümü için ERP sistemi ve web altyapısı geliştiriyorum. N2Mobile ve Kuzeyboru'da edindiğim staj ve tam zamanlı deneyimlerle Vue.js, Django, API tasarımı ve veritabanı sistemleri konusunda sağlam bir temel oluşturdum.",
  introPart2:
    "Teknoloji tutkum ofis duvarlarının ötesine uzanıyor. ASÜ Teknoloji Atölyesi'nin kurucu başkanı olarak üniversitede bir teknoloji topluluğu kurdum; etkinlikler düzenledim, projelere liderlik ettim. T3 Vakfı Deneyap merkezinde mentorluk yapıyorum, gençlere yazılım ve yapay zeka eğitimi veriyorum. T3 AI'LE topluluğunda doğal dil işleme araştırmalarına katılıyorum. Gürman İnovasyon'da proje lideri olarak elektrikli araç ve yapay zeka entegrasyonları üzerinde çalıştım. MDKARE ~ SOFT ile freelance tam yığın projeler geliştiriyorum.",
  introPart3:
    "TÜBİTAK DENEYAP'ta ortaokul öğrencilerine yapay zeka dersi verdim. Sürekli öğrenmek ve başkalarının gelişimine katkıda bulunmak benim için güçlü bir motivasyon. ERP, web geliştirme, yapay zeka ve veritabanı sistemleri alanındaki birikimimi hem iş projelerinde hem de topluluk çalışmalarında kullanıyorum.",
  introPart4:
    'Gelecekte daha karmaşık sistemler tasarlamak, açık kaynağa katkı sağlamak ve teknoloji alanında anlamlı bir iz bırakmak istiyorum. Proje fırsatları, iş birlikleri veya sadece sohbet için benimle iletişime geçebilirsiniz.',
  seoTitle: 'Hakkımda | Mehmet Doğan — Software Engineer',
  seoDescription:
    'Mehmet Doğan; yazılım mühendisi, ERP ve full-stack geliştirme, yapay zeka ve topluluk mentorluğu. mehmetdogandev.com kişisel portfolyosu.',
  robotsIndex: true,
  sortOrder: 0,
} as const

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(aboutPageProfile)
    .where(excludeDeleted(aboutPageProfile))

  const hasProfile = (row?.n ?? 0) > 0

  if (!hasProfile) {
    await db.insert(aboutPageProfile).values(PROFILE_SEED)
    console.log('Seeded about page profile')
    return
  }

  const [existing] = await db
    .select({ id: aboutPageProfile.id })
    .from(aboutPageProfile)
    .where(excludeDeleted(aboutPageProfile))
    .limit(1)

  if (!existing) return

  await db
    .update(aboutPageProfile)
    .set({
      lead: PROFILE_SEED.lead,
      intro: PROFILE_SEED.intro,
      introPart2: PROFILE_SEED.introPart2,
      introPart3: PROFILE_SEED.introPart3,
      introPart4: PROFILE_SEED.introPart4,
      seoTitle: PROFILE_SEED.seoTitle,
      seoDescription: PROFILE_SEED.seoDescription,
      robotsIndex: PROFILE_SEED.robotsIndex,
      sortOrder: PROFILE_SEED.sortOrder,
    })
    .where(eq(aboutPageProfile.id, existing.id))

  console.log('Updated about page profile')
}
