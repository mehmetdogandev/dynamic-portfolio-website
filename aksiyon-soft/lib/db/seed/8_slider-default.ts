/**
 * Canlı sitede gösterilecek **tek yayındaki** hero: bu gruptur (`PUBLISHED`).
 * Diğer tasarım varyantları `9_slider-hero-variants.ts` içinde taslak (`DRAFT`) olarak eklenir;
 * yayındaki değiştirme, admin’de (Kaydet) veya yeni tohum çalıştırmayla yönetilir.
 */
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { slider, sliderGroup } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import { uploadFile } from '@/lib/s3/utils'
import { HERO_AUTOPLAY_DEFAULT_MS } from '@/lib/website/slider-autoplay'
import { sitePath } from '@/lib/website/site-nav'

const GROUP_NAME = 'Varsayılan slider'

/** Same Unsplash URLs as former `WEBSITE_IMAGES` hero (see `lib/website/content/images.ts`). */
const unsplash = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1600&q=80`

const SEED_SLIDES: Array<{
  key: string
  imageUrl: string
  imageAlt: string
  title: string
  subtitle: string
  primaryLabel: string
  primaryHrefKey: 'iletisim' | 'hakkimizda' | 'references' | 'solution'
  secondaryLabel: string
  secondaryHrefKey: 'hakkimizda' | 'references' | 'solution' | 'iletisim'
  sortOrder: number
}> = [
  {
    key: 'intro',
    imageUrl: unsplash('photo-1497366754035-f200968a6e72'),
    imageAlt: 'Kurumsal ofis ve iş birliği ortamı',
    title: 'Dijital dönüşümde güvenilir çözüm ortağınız',
    subtitle:
      'Aksiyon Soft; kurumsal uygulamalar, entegrasyon ve operasyonel güvenilirlik odaklı uçtan uca yazılım hizmetleri sunar.',
    primaryLabel: 'Bize ulaşın',
    primaryHrefKey: 'iletisim',
    secondaryLabel: 'Kurumsal',
    secondaryHrefKey: 'hakkimizda',
    sortOrder: 0,
  },
  {
    key: 'integration',
    imageUrl: unsplash('photo-1522071820081-009f0129c71c'),
    imageAlt: 'Ekip ve dijital dönüşüm',
    title: 'Kurumsal uygulama, entegrasyon ve izlenebilir süreç',
    subtitle:
      'Karmaşık sistemleri birbirine bağlayan köprüler, rol tabanlı onaylar ve yönetim panoları ile operasyonu tek noktadan yönetin.',
    primaryLabel: 'Hakkımızda',
    primaryHrefKey: 'hakkimizda',
    secondaryLabel: 'Referanslar',
    secondaryHrefKey: 'references',
    sortOrder: 1,
  },
  {
    key: 'solution',
    imageUrl: unsplash('photo-1454165804606-c3d57bc86b40'),
    imageAlt: 'Çözüm ve teknoloji odaklı çalışma',
    title: 'Sektörel deneyim ve uygulanabilir çözümler',
    subtitle:
      'Referans çözümlerimiz ve ürünleştirilebilir modüllerimizle hızlı başlangıç, ölçeklenebilir mimari ve net teslimat.',
    primaryLabel: 'Çözümler',
    primaryHrefKey: 'solution',
    secondaryLabel: 'İletişim',
    secondaryHrefKey: 'iletisim',
    sortOrder: 2,
  },
]

export async function seed() {
  const existing = await db
    .select({ id: sliderGroup.id })
    .from(sliderGroup)
    .where(and(eq(sliderGroup.name, GROUP_NAME), excludeDeleted(sliderGroup)))
    .limit(1)
    .then((r) => r[0])

  if (existing) {
    console.log(
      `Skip slider default seed: group "${GROUP_NAME}" already exists`
    )
    return
  }

  const [group] = await db
    .insert(sliderGroup)
    .values({
      name: GROUP_NAME,
      description: 'Ana sayfa hero slider',
      type: 'DEFAULT',
      autoplayInterval: HERO_AUTOPLAY_DEFAULT_MS,
      status: 'PUBLISHED',
      sortOrder: 0,
    })
    .returning({ id: sliderGroup.id })

  if (!group) {
    throw new Error('slider default seed: failed to insert slider group')
  }

  for (const row of SEED_SLIDES) {
    const res = await fetch(row.imageUrl)
    if (!res.ok) {
      throw new Error(
        `slider default seed: failed to fetch image ${row.key} (${res.status})`
      )
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const upload = await uploadFile(
      buffer,
      `hero-${row.key}.${ext}`,
      contentType,
      {
        prefix: 'seed/slider',
        isPublic: true,
      }
    )

    await db.insert(slider).values({
      groupId: group.id,
      fileId: upload.id,
      sortOrder: row.sortOrder,
      title: row.title,
      subtitle: row.subtitle,
      imageAlt: row.imageAlt,
      showPrimaryButton: true,
      showSecondaryButton: true,
      primaryLabel: row.primaryLabel,
      primaryHref: sitePath(row.primaryHrefKey),
      secondaryLabel: row.secondaryLabel,
      secondaryHref: sitePath(row.secondaryHrefKey),
    })
    console.log(`  Seeded hero slide: ${row.key}`)
  }

  console.log(`  Seeded slider group: ${GROUP_NAME}`)
}
