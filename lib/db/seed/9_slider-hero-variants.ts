/**
 * Tasarım varyantları demo grupları — hepsi **taslak**; yalnızca `8_slider-default.ts` tek **yayında** başlar.
 * Görseller `8_` içindekilerle çakışmamalı (farklı Unsplash id’leri).
 */
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { slider, sliderGroup, sliderTypeEnum } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import { uploadFile } from '@/lib/s3/utils'
import { HERO_AUTOPLAY_DEFAULT_MS } from '@/lib/website/slider-autoplay'
import { sitePath } from '@/lib/website/site-nav'

const unsplash = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1600&q=80`

type HrefKey = 'iletisim' | 'hakkimizda' | 'references' | 'solution'

type SeedSlide = {
  key: string
  imageUrl: string
  imageAlt: string
  title: string
  subtitle: string
  primaryLabel: string
  primaryHrefKey: HrefKey
  secondaryLabel: string
  secondaryHrefKey: HrefKey
  sortOrder: number
  showPrimaryButton?: boolean
  showSecondaryButton?: boolean
}

type SliderTypeRow = (typeof sliderTypeEnum.enumValues)[number]

const VARIANT_GROUPS: {
  type: SliderTypeRow
  name: string
  description: string
  sortOrder: number
  slides: SeedSlide[]
}[] = [
  {
    type: 'SPLIT_LEFT',
    name: 'Seed · Bölünmüş (metin sol)',
    description: 'Bölünmüş hero: metin solda, görseller sağda (seed)',
    sortOrder: 1,
    slides: [
      {
        key: 's1',
        imageUrl: unsplash('photo-1556761175-5973dc0f32e7'),
        imageAlt: 'Açık ofis alanı',
        title: 'Sol blok: net mesaj, sağ blok: görsel ağırlık',
        subtitle:
          'Başlık ve açıklama solda; büyük görsel sağda. Kurumsal giriş için uygundur.',
        primaryLabel: 'Bize ulaşın',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Kurumsal',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 0,
      },
      {
        key: 's2',
        imageUrl: unsplash('photo-1553877522-43269d4ea984'),
        imageAlt: 'Ekip çalışması',
        title: 'Dönüşümden uygulamaya izlenebilir bir hat',
        subtitle:
          'Aynı veri modeliyle farklı slaytlar; hizalama bölünmüş düzlemde okunur.',
        primaryLabel: 'Referanslar',
        primaryHrefKey: 'references',
        secondaryLabel: 'Çözümler',
        secondaryHrefKey: 'solution',
        sortOrder: 1,
      },
      {
        key: 's3',
        imageUrl: unsplash('photo-1449824913935-59a10b8d2000'),
        imageAlt: 'Çözüm yönetimi',
        title: 'Operasyonu görünür, kararları ölçülebilir kılın',
        subtitle: 'Üçüncü vurgu: net teslim ve iletişim hattı.',
        primaryLabel: 'Hakkımızda',
        primaryHrefKey: 'hakkimizda',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 2,
      },
    ],
  },
  {
    type: 'SPLIT_RIGHT',
    name: 'Seed · Bölünmüş (metin sağ)',
    description: 'Görsel sol, metin sağ; seed',
    sortOrder: 2,
    slides: [
      {
        key: 'r1',
        imageUrl: unsplash('photo-1522071820081-009f0129c71c'),
        imageAlt: 'Şehir manzarası',
        title: 'Görsel solda, mesaj sağa hizalı',
        subtitle:
          'Sağ blokta tipografi; solda büyük görüntü. Marka bütünlüğüne uygun.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 0,
      },
      {
        key: 'r2',
        imageUrl: unsplash('photo-1504384308090-c894fdcc538d'),
        imageAlt: 'Çalışma ortamı',
        title: 'Farklı slaytlar, aynı bölünmüş düzen',
        subtitle: 'Görüntü ve metin dengesi aynı kalır; sadece içerik değişir.',
        primaryLabel: 'Hakkımızda',
        primaryHrefKey: 'hakkimizda',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 1,
      },
      {
        key: 'r3',
        imageUrl: unsplash('photo-1451187580459-43490279c0fa'),
        imageAlt: 'Dünya ağı',
        title: 'Dijitalleşmeyi tek pencerede yönetin',
        subtitle:
          'Cihaz ağı ve süreçler: kurumsal ölçekte sade, okunur bir dille.',
        primaryLabel: 'İletişim',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 2,
      },
    ],
  },
  {
    type: 'THUMB_STRIP',
    name: 'Seed · Alt küçük resim',
    description: 'Ana alan + alt bant; dört slayt',
    sortOrder: 3,
    slides: [
      {
        key: 't1',
        imageUrl: unsplash('photo-1507679799987-c73779587ccf'),
        imageAlt: 'Dizüstü ve ofis',
        title: 'Ana sahne + altta tıklanabilir strip',
        subtitle:
          'Aktif büyük görüntü; aşağıda tüm kareler önizleme gibi dolaşılır.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 0,
      },
      {
        key: 't2',
        imageUrl: unsplash('photo-1517245386807-bb43f82c33c4'),
        imageAlt: 'Toplantı',
        title: 'İkinci büyük görsel',
        subtitle: 'Dört slaytlık strip’in farkı hemen belli olsun diye.',
        primaryLabel: 'Hakkımızda',
        primaryHrefKey: 'hakkimizda',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 1,
      },
      {
        key: 't3',
        imageUrl: unsplash('photo-1520607162513-77705c0f0d4a'),
        imageAlt: 'Cam ofis',
        title: 'Üçüncü bant öğesi',
        subtitle: 'Aynı tipografi; sadece görüntü değişimi.',
        primaryLabel: 'İletişim',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Çözümler',
        secondaryHrefKey: 'solution',
        sortOrder: 2,
      },
      {
        key: 't4',
        imageUrl: unsplash('photo-1517694712202-14dd9538aa97'),
        imageAlt: 'Takım',
        title: 'Dördüncü slayt — strip dolar',
        subtitle: 'En az dört kare, strip’e anlam katar.',
        primaryLabel: 'Referanslar',
        primaryHrefKey: 'references',
        secondaryLabel: 'Hakkımızda',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 3,
      },
    ],
  },
  {
    type: 'MINIMAL_DOTS',
    name: 'Seed · Minimal merkez',
    description: 'Kısa kopya, açık tipografi, noktalar (seed)',
    sortOrder: 4,
    slides: [
      {
        key: 'm1',
        imageUrl: unsplash('photo-1498050108023-c5249f4df085'),
        imageAlt: 'Dağ silüeti',
        title: 'Daha az UI, daha çok cümle',
        subtitle: 'Kısa.',
        primaryLabel: 'Bize ulaşın',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Kurumsal',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 0,
      },
      {
        key: 'm2',
        imageUrl: unsplash('photo-1518837695005-2083093ee35b'),
        imageAlt: 'Gökyüzü',
        title: 'Hızlı, sade, merkezde',
        subtitle: 'Dikkat başlıkta.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 1,
      },
      {
        key: 'm3',
        imageUrl: unsplash('photo-1552664730-d307ca884978'),
        imageAlt: 'Gece şehri',
        title: 'Noktalar yeter; oklar hafif',
        subtitle: 'Görüntü arka planda silik.',
        primaryLabel: 'Hakkımızda',
        primaryHrefKey: 'hakkimizda',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 2,
      },
    ],
  },
  {
    type: 'CINEMATIC',
    name: 'Seed · Sinematik karanlık',
    description: 'Koyu görsellik, alt ilerleme; daha uzun alt metin (seed)',
    sortOrder: 5,
    slides: [
      {
        key: 'c1',
        imageUrl: unsplash('photo-1506905925346-21bda4d32df4'),
        imageAlt: 'Dağ ve sis',
        title: 'Daha koyu bir açılış, alt şerit ilerleme',
        subtitle:
          'Bu tipte alt metin bir cümlelik üst bant, başlık güçlü, arka plan bilinçli karanlık; ürün hikayesi anlatıyor hissi verir. İzleyiciyi sokağa indirip ışığa yönlendirebilirsiniz. Devam cümleleri, sinematik tonda kısa tutulmalı; böylece okuma yükü artmaz ve odak yine başlıktadır. İkinci cümleler tekrar yok, her slayt ayrı bir bölüm gibi nefes almalı. İşte bu nedenle seed’de açıklamayı biraz uzatıyoruz.',
        primaryLabel: 'İletişim',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Hakkımızda',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 0,
      },
      {
        key: 'c2',
        imageUrl: unsplash('photo-1518837695005-2083093ee35b'),
        imageAlt: 'Okyanus',
        title: 'Gecede ikinci plaka',
        subtitle:
          'Deniz ve ışık, dramatik fakat sakin. Cinematic: karakter net, açıklamalar ayrıntı taşır fakat aşırı söz söylemez. Bu paragrafta da ilerleme hissi, alt çubukla aynı ritimde gitmeli; uzun cümle sinemada da monolog gibidir, abartmadan. Referans: gece, kontrast, sessiz hareket. Son cümle: net bir çağrı.',
        primaryLabel: 'Referanslar',
        primaryHrefKey: 'references',
        secondaryLabel: 'Çözümler',
        secondaryHrefKey: 'solution',
        sortOrder: 1,
      },
      {
        key: 'c3',
        imageUrl: unsplash('photo-1520607162513-77705c0f0d4a'),
        imageAlt: 'Orman ışık huzmesi',
        title: 'Işık oyunu, üçüncü sahnede açılır',
        subtitle:
          'Ağaçlar, yumuşak gradient ve titrek gölge: sinemada üçüncü perde. Burada açıklama, izleyenin dikkatini ilerleme çubuğuna eşleştirmek için hafif uzatıldı. Metin, sessiz yürüyüş: bir nefes, bir cadde, bir karar. Sonunda yine aynı kurumsal dil, fakat tonu daha olgun, daha az pazarlama, daha çok hikâye. Bitiş cümlesi kısadır, başlık taşır yükü.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 2,
      },
    ],
  },
  {
    type: 'PEEK_CARDS',
    name: 'Seed · Komşu kart görünür',
    description: 'Peek carousel; dört yatay kart (seed)',
    sortOrder: 6,
    slides: [
      {
        key: 'p1',
        imageUrl: unsplash('photo-1498050108023-c5249f4df085'),
        imageAlt: 'Mock',
        title: 'Yan komşu hafif görünsün',
        subtitle: 'Aktif kart büyür, yanlarda bir sonraki seçilir.',
        primaryLabel: 'İletişim',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Hakkımızda',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 0,
      },
      {
        key: 'p2',
        imageUrl: unsplash('photo-1517694712202-14dd9538aa97'),
        imageAlt: 'Kod ekranı',
        title: 'Kart 2: ürün fokus',
        subtitle: 'Aynı layout, farklı görsel; kaydırmayla ileri.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 1,
      },
      {
        key: 'p3',
        imageUrl: unsplash('photo-1451187580459-43490279c0fa'),
        imageAlt: 'Dizüstü',
        title: 'Kart 3: mühendislik',
        subtitle:
          'Dört kare, peek alanı dolar; strip hissi yok, kart yığılımı var.',
        primaryLabel: 'Referanslar',
        primaryHrefKey: 'references',
        secondaryLabel: 'Çözümler',
        secondaryHrefKey: 'solution',
        sortOrder: 2,
      },
      {
        key: 'p4',
        imageUrl: unsplash('photo-1552664730-d307ca884978'),
        imageAlt: 'Takım el sıkışma',
        title: 'Dördüncü: kapanış çağrısı',
        subtitle: 'Komşu kartlar yine sızar; cümle kısa.',
        primaryLabel: 'İletişim',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Hakkımızda',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 3,
      },
    ],
  },
  {
    type: 'STACK',
    name: 'Seed · Yığılım',
    description: 'Üst üste kart; birkaç arka katman, üç slayt (seed)',
    sortOrder: 7,
    slides: [
      {
        key: 'k1',
        imageUrl: unsplash('photo-1507679799987-c73779587ccf'),
        imageAlt: 'Basit masa',
        title: 'Önde bir kart, arkada hafif derinlik',
        subtitle:
          'Aktif odak, diğerleri aynı desteden geliyormuş gibi hizalanır.',
        primaryLabel: 'Bize ulaşın',
        primaryHrefKey: 'iletisim',
        secondaryLabel: 'Kurumsal',
        secondaryHrefKey: 'hakkimizda',
        sortOrder: 0,
      },
      {
        key: 'k2',
        imageUrl: unsplash('photo-1519389950473-47ba0277781c'),
        imageAlt: 'Takım toplantı',
        title: 'İkinci yığın, farklı görsel',
        subtitle: 'Rotasyon, önceki karta sinyal; animasyonu abartma.',
        primaryLabel: 'Çözümler',
        primaryHrefKey: 'solution',
        secondaryLabel: 'Referanslar',
        secondaryHrefKey: 'references',
        sortOrder: 1,
      },
      {
        key: 'k3',
        imageUrl: unsplash('photo-1531482615713-2afd69097998'),
        imageAlt: 'Beyaz ofis',
        title: 'Üçüncü: kapanan deste',
        subtitle: 'Bir ileri, bir geri; aynı tipografi, farklı hikâye.',
        primaryLabel: 'Hakkımızda',
        primaryHrefKey: 'hakkimizda',
        secondaryLabel: 'İletişim',
        secondaryHrefKey: 'iletisim',
        sortOrder: 2,
      },
    ],
  },
]

async function insertGroupSlides(groupId: string, rows: SeedSlide[]) {
  for (const row of rows) {
    const res = await fetch(row.imageUrl)
    if (!res.ok) {
      throw new Error(
        `hero variants seed: image ${row.key} failed (${res.status})`
      )
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const upload = await uploadFile(
      buffer,
      `variant-${row.key}-${groupId.slice(0, 8)}.${ext}`,
      contentType,
      {
        prefix: 'seed/slider',
        isPublic: true,
      }
    )

    await db.insert(slider).values({
      groupId,
      fileId: upload.id,
      sortOrder: row.sortOrder,
      title: row.title,
      subtitle: row.subtitle,
      imageAlt: row.imageAlt,
      showPrimaryButton: row.showPrimaryButton ?? true,
      showSecondaryButton: row.showSecondaryButton ?? true,
      primaryLabel: row.primaryLabel,
      primaryHref: sitePath(row.primaryHrefKey),
      secondaryLabel: row.secondaryLabel,
      secondaryHref: sitePath(row.secondaryHrefKey),
    })
  }
}

export async function seed() {
  for (const g of VARIANT_GROUPS) {
    const [existing] = await db
      .select({ id: sliderGroup.id })
      .from(sliderGroup)
      .where(
        and(
          eq(sliderGroup.name, g.name),
          eq(sliderGroup.type, g.type),
          excludeDeleted(sliderGroup)
        )
      )
      .limit(1)

    if (existing) {
      console.log(`Skip hero variant seed: ${g.name}`)
      continue
    }

    const [row] = await db
      .insert(sliderGroup)
      .values({
        name: g.name,
        description: g.description,
        type: g.type,
        autoplayInterval: HERO_AUTOPLAY_DEFAULT_MS,
        status: 'DRAFT',
        sortOrder: g.sortOrder,
      })
      .returning({ id: sliderGroup.id })

    if (!row) {
      throw new Error(`hero variant seed: insert failed for ${g.name}`)
    }

    await insertGroupSlides(row.id, g.slides)
    console.log(
      `  Seeded slider group: ${g.name} (${g.type}, ${g.slides.length} slides)`
    )
  }
}
