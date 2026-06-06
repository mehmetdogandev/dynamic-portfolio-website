import { and, count, eq, isNull, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { about } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'

type AboutSeedRow = {
  title: string
  slug: string
  seoTitle: string
  seoDescription: string
  robotsIndex: boolean
  isPublished: boolean
  sortOrder: number
  paragraphs: string[]
  imageUrls: string[]
}

const ABOUT_ROWS: AboutSeedRow[] = [
  {
    title: 'Aksiyon Soft Hakkında',
    slug: 'aksiyon-soft-hakkinda',
    seoTitle: 'Aksiyon Soft Hakkında | Kurumsal Yazılım Partneri',
    seoDescription:
      'Aksiyon Soft; kurumsal yazılım geliştirme, entegrasyon ve sürdürülebilir operasyon yaklaşımıyla uzun vadeli çözüm ortaklığı sunar.',
    robotsIndex: true,
    isPublished: true,
    sortOrder: 0,
    paragraphs: [
      'Aksiyon Soft; orta ve büyük ölçekli kurumlar için güvenli, sürdürülebilir ve denetlenebilir yazılım ürünleri geliştirir.',
      'Projelerde kapsam, teslimat yaklaşımı ve operasyonel sorumluluklar net tanımlanır; hedefimiz uzun vadeli güvenilir iş ortaklığıdır.',
      'Mühendislik, ürün ve operasyon ekiplerimiz; kaliteyi, izlenebilirliği ve performansı merkeze alarak çalışır.',
    ],
    imageUrls: [WEBSITE_IMAGES.gallery[0]!, WEBSITE_IMAGES.gallery[1]!],
  },
  {
    title: 'Değerlerimiz ve Çalışma Şeklimiz',
    slug: 'degerlerimiz-ve-calisma-seklimiz',
    seoTitle: 'Aksiyon Soft Değerleri ve Çalışma Modeli',
    seoDescription:
      'Şeffaf iletişim, ölçülebilir teslimat ve güvenli teknoloji tercihleriyle kurumsal yazılım projelerinde sürdürülebilir başarı hedefliyoruz.',
    robotsIndex: true,
    isPublished: false,
    sortOrder: 1,
    paragraphs: [
      'Şeffaf iletişim, ölçülebilir teslimat ve teknik borcu kontrollü yönetmek temel ilkelerimizdir.',
      'İhtiyaçları yalnızca bugünü değil, bakım ve büyüme dönemini de dikkate alarak çözümleriz.',
      'Her teslimatta dokümantasyon, test kapsamı ve operasyonel hazır olma kriterlerini koruruz.',
    ],
    imageUrls: [WEBSITE_IMAGES.solutionCovers[0]!],
  },
  {
    title: 'Teknoloji ve Operasyon Yaklaşımımız',
    slug: 'teknoloji-ve-operasyon-yaklasimimiz',
    seoTitle: 'Teknoloji ve Operasyon Yaklaşımı | Aksiyon Soft',
    seoDescription:
      'Modern web teknolojileri, API tasarımı, veri katmanı ve gözlemlenebilirlik pratikleriyle üretim ortamına hazır çözümler sunuyoruz.',
    robotsIndex: true,
    isPublished: false,
    sortOrder: 2,
    paragraphs: [
      'Modern web teknolojileri, API tasarımı ve veri katmanı konularında derin mühendislik deneyimiyle çalışıyoruz.',
      'Üretim ortamlarında loglama, metrik, alarm ve yedekleme standartlarını proje başlangıcından itibaren planlıyoruz.',
      'Güvenlik ve erişim yönetimi kararlarını ürün mimarisinin doğal bir parçası olarak ele alıyoruz.',
    ],
    imageUrls: [WEBSITE_IMAGES.solutionCovers[2]!],
  },
  {
    title: 'Müşteri İş Birliği Modelimiz',
    slug: 'musteri-is-birligi-modelimiz',
    seoTitle: 'Müşteri İş Birliği Modeli | Aksiyon Soft',
    seoDescription:
      'Planlama, önceliklendirme ve canlıya geçiş süreçlerini ortak çalışma modeliyle yürütür; sürdürülebilir sonuç üretiriz.',
    robotsIndex: true,
    isPublished: false,
    sortOrder: 3,
    paragraphs: [
      'Proje boyunca iş birimlerinin geri bildirimleri sprint ritmi içinde düzenli şekilde değerlendirilir.',
      'Canlıya geçiş, performans doğrulama ve operasyon devir adımları açık bir geçiş planıyla yönetilir.',
      'Yol haritasını birlikte şekillendirir, değişen önceliklere kontrollü uyum sağlarız.',
    ],
    imageUrls: [WEBSITE_IMAGES.gallery[3]!],
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(about)
    .where(isNull(about.deletedAt))
  const publishedSeed = ABOUT_ROWS.find((item) => item.isPublished)
  if (!publishedSeed) {
    throw new Error('about seed: published row is required')
  }
  const now = new Date()

  await db.transaction(async (tx) => {
    for (const item of ABOUT_ROWS) {
      const imageFileIds: string[] = []
      const imageFigures: string[] = []
      for (const [imageIndex, imageUrl] of item.imageUrls.entries()) {
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`about seed: image fetch failed (${response.status})`)
        }
        const buffer = Buffer.from(await response.arrayBuffer())
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const extension = contentType.includes('png') ? 'png' : 'jpg'
        const uploaded = await uploadFile(
          buffer,
          `${item.slug}-${imageIndex + 1}.${extension}`,
          contentType,
          {
            prefix: 'seed/about',
            isPublic: true,
            altText: `${item.title} görsel ${imageIndex + 1}`,
          }
        )
        imageFileIds.push(uploaded.id)
        imageFigures.push(
          `<figure class="blog-me-media-block blog-content-media" data-blog-media="image" data-blog-align="${imageIndex % 2 === 0 ? 'center' : 'left'}" data-blog-width="${imageIndex % 2 === 0 ? '100' : '72'}"><img src="/api/files/${uploaded.id}/view" data-file-id="${uploaded.id}" alt="${item.title} görsel ${imageIndex + 1}" /></figure><p><br></p>`
        )
      }

      const html = item.paragraphs
        .map((paragraph, paragraphIndex) => {
          const segment = [`<p>${paragraph}</p>`]
          if (paragraphIndex < imageFigures.length) {
            segment.push(imageFigures[paragraphIndex]!)
          }
          return segment.join('')
        })
        .join('')
      await tx
        .insert(about)
        .values({
          title: item.title,
          slug: item.slug,
          content: {
            type: 'doc',
            version: 1,
            html,
            imageFileIds,
            videoFileIds: [],
          },
          isPublished: false,
          publishedAt: null,
          sortOrder: item.sortOrder,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          robotsIndex: item.robotsIndex,
        })
        .onConflictDoUpdate({
          target: about.slug,
          set: {
            title: item.title,
            content: {
              type: 'doc',
              version: 1,
              html,
              imageFileIds,
              videoFileIds: [],
            },
            isPublished: false,
            publishedAt: null,
            sortOrder: item.sortOrder,
            seoTitle: item.seoTitle,
            seoDescription: item.seoDescription,
            robotsIndex: item.robotsIndex,
          },
        })
    }

    const targetPublished = await tx
      .select({ id: about.id })
      .from(about)
      .where(and(eq(about.slug, publishedSeed.slug), isNull(about.deletedAt)))
      .limit(1)
      .then((items) => items[0])

    if (!targetPublished) {
      throw new Error(
        `about seed: published target not found (${publishedSeed.slug})`
      )
    }

    await tx
      .update(about)
      .set({ isPublished: false, publishedAt: null })
      .where(
        and(
          isNull(about.deletedAt),
          eq(about.isPublished, true),
          ne(about.id, targetPublished.id)
        )
      )

    await tx
      .update(about)
      .set({
        isPublished: true,
        publishedAt: now,
      })
      .where(eq(about.id, targetPublished.id))
  })

  if ((row?.n ?? 0) === 0) {
    console.log(`Seeded about rows: ${ABOUT_ROWS.length}`)
  } else {
    console.log(`Updated about rows: ${ABOUT_ROWS.length}`)
  }
}
