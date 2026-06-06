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

const unsplash = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1600&q=80`

const SEED_SLIDES: Array<{
  key: string
  /** Sırayla denenir; ilk başarılı görsel kullanılır */
  imageCandidates: string[]
  imageAlt: string
  title: string
  subtitle: string
  primaryLabel: string
  primaryHrefKey: 'iletisim' | 'hakkimda' | 'referanslar' | 'projeler' | 'blog'
  secondaryLabel: string
  secondaryHrefKey:
    | 'hakkimda'
    | 'referanslar'
    | 'projeler'
    | 'iletisim'
    | 'blog'
  sortOrder: number
}> = [
  {
    key: 'intro',
    imageCandidates: [
      unsplash('photo-1498050108023-c5249f4df085'),
      unsplash('photo-1516321318423-f06f85e504b3'),
      unsplash('photo-1504639725590-34d0984388bd'),
    ],
    imageAlt: 'Laptop üzerinde yazılım geliştirme',
    title: 'Merhaba, ben Mehmet Doğan',
    subtitle:
      'Software Engineer. ERP sistemleri, full-stack web uygulamaları ve yapay zeka projeleri üzerinde çalışıyorum.',
    primaryLabel: 'Projelerim',
    primaryHrefKey: 'projeler',
    secondaryLabel: 'İletişim',
    secondaryHrefKey: 'iletisim',
    sortOrder: 0,
  },
  {
    key: 'experience',
    imageCandidates: [
      unsplash('photo-1523240795612-9a054b0db644'),
      unsplash('photo-1531482615713-2afd69097998'),
      unsplash('photo-1505373877841-8d25f7d46678'),
    ],
    imageAlt: 'Topluluk, eğitim ve mentorluk etkinliği',
    title: 'Kurumsal deneyim & topluluk liderliği',
    subtitle:
      'Anadolu Mikronize, T3 Vakfı ve üniversite topluluklarında edindiğim deneyimlerle üretken çözümler geliştiriyorum.',
    primaryLabel: 'Hakkımda',
    primaryHrefKey: 'hakkimda',
    secondaryLabel: 'Referanslar',
    secondaryHrefKey: 'referanslar',
    sortOrder: 1,
  },
  {
    key: 'projeler',
    imageCandidates: [
      unsplash('photo-1461749280684-dccba630e2f6'),
      unsplash('photo-1677442136019-21780ecad995'),
      unsplash('photo-1555066931-4365d14bab8c'),
    ],
    imageAlt: 'Kod editörü ve yapay zeka odaklı proje çalışması',
    title: 'Projeler & açık kaynak çalışmalar',
    subtitle:
      'ERP, IoT, mobil uygulama ve yapay zeka odaklı projelerimi inceleyin; blog yazılarımda teknik notlarımı paylaşıyorum.',
    primaryLabel: 'Projeler',
    primaryHrefKey: 'projeler',
    secondaryLabel: 'Blog',
    secondaryHrefKey: 'blog',
    sortOrder: 2,
  },
]

type FetchedImage = {
  buffer: Buffer
  contentType: string
  usedUrl: string
}

async function fetchFirstAvailableImage(
  candidates: string[],
  slideKey: string
): Promise<FetchedImage> {
  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) {
        console.warn(
          `  slider ${slideKey}: görsel alınamadı (${res.status}) — ${url}`
        )
        continue
      }

      const contentType = res.headers.get('content-type')?.split(';')[0]?.trim()
      if (!contentType?.startsWith('image/')) {
        console.warn(
          `  slider ${slideKey}: geçersiz içerik tipi (${contentType ?? 'yok'}) — ${url}`
        )
        continue
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.byteLength < 4_096) {
        console.warn(
          `  slider ${slideKey}: dosya çok küçük (${buffer.byteLength} B) — ${url}`
        )
        continue
      }

      console.log(
        `  slider ${slideKey}: görsel yüklendi (${Math.round(buffer.byteLength / 1024)} KB)`
      )
      return { buffer, contentType, usedUrl: url }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`  slider ${slideKey}: fetch hatası — ${url} (${message})`)
    }
  }

  throw new Error(
    `slider default seed: "${slideKey}" için hiçbir görsel indirilemedi`
  )
}

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
    const { buffer, contentType } = await fetchFirstAvailableImage(
      row.imageCandidates,
      row.key
    )
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
