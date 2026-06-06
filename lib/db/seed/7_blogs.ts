import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blog, blogCategory } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'

type SeedBlog = {
  title: string
  slug: string
  excerpt: string
  content: string[]
  categorySlug: string
  imageUrl: string
  seoTitle: string
  seoDescription: string
}

/** referance/.../src/data/mock-blog.ts — portfolyo konuları */
const BLOG_ROWS: SeedBlog[] = [
  {
    title: 'Full-Stack Geliştirmeye Başlarken',
    slug: 'full-stack-gelistirmeye-baslarken',
    excerpt:
      'Frontend ve backend teknolojilerini bir arada öğrenmek isteyenler için pratik öneriler ve önerilen teknoloji yığınları.',
    content: [
      'Full-stack geliştirici olmak hem frontend hem backend konularında bilgi sahibi olmayı gerektirir.',
      'HTML, CSS ve JavaScript ile başlayın; ardından React veya Vue.js gibi bir framework öğrenin.',
      'Node.js + Express veya Next.js API Routes ile backend deneyimi kazanın; PostgreSQL ile veritabanı modelleme öğrenin.',
      'TypeScript, tRPC, Drizzle ve Next.js kombinasyonu modern full-stack projeler için güçlü bir seçenektir.',
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80',
    seoTitle: 'Full-stack geliştirmeye başlarken | Mehmet Doğan',
    seoDescription:
      'Frontend ve backend teknolojilerini bir arada öğrenmek için pratik öneriler ve teknoloji yığını tavsiyeleri.',
  },
  {
    title: 'ERP Sistemleri Nedir ve Neden Önemli?',
    slug: 'erp-sistemleri-nedir-ve-neden-onemli',
    excerpt:
      'Kurumsal Kaynak Planlaması (ERP) sistemlerinin işletmeler için önemi ve yazılım geliştirici perspektifinden ERP projeleri.',
    content: [
      'ERP sistemleri, bir işletmenin temel süreçlerini tek bir platformda birleştiren yazılımlardır.',
      'Veri tutarlılığı, süreç otomasyonu ve raporlama kolaylığı sağlar.',
      'ERP projelerinde modüler mimari, rol tabanlı erişim kontrolü ve esnek veritabanı modellemesi önemlidir.',
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80',
    seoTitle: 'ERP sistemleri nedir? | Yazılım mühendisi notları',
    seoDescription:
      'Kurumsal Kaynak Planlaması sistemlerinin işletmelere faydası ve geliştirici perspektifinden ERP projeleri.',
  },
  {
    title: 'Yapay Zeka ve Doğal Dil İşleme',
    slug: 'yapay-zeka-ve-dogal-dil-isleme',
    excerpt: "NLP alanına giriş ve T3 AI'LE topluluğundaki deneyimlerim.",
    content: [
      'Doğal dil işleme, bilgisayarların insan dilini anlamasını ve üretmesini sağlayan yapay zeka alt alanıdır.',
      'NLP projelerinde veri toplama ve ön işleme kritik öneme sahiptir.',
      "T3 AI'LE topluluğunda doğal dil işleme modeli üzerinde çalışırken veri toplama ve ön işleme faaliyetlerinde bulundum.",
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&q=80',
    seoTitle: 'Yapay zeka ve NLP giriş | Mehmet Doğan',
    seoDescription:
      'Doğal dil işleme alanına giriş ve topluluk tabanlı AI araştırma deneyimleri.',
  },
  {
    title: 'Üniversitede Teknoloji Topluluğu Kurmak',
    slug: 'universite-toplulugu-kurmak',
    excerpt:
      "ASÜ Teknoloji Atölyesi'ni kurarken edindiğim deneyimler ve genç geliştiricilere öneriler.",
    content: [
      'Üniversitede teknoloji odaklı bir topluluk kurmak kişisel gelişim ve network açısından benzersiz fırsatlar sunar.',
      'Önce benzer ilgi alanına sahip arkadaşlarınızla çekirdek ekip oluşturun; üniversite yönetimiyle iletişime geçin.',
      "Workshop'lar, hackathon'lar ve konuk konuşmacılar topluluğu canlı tutar.",
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80',
    seoTitle: 'Üniversitede teknoloji topluluğu kurmak',
    seoDescription:
      'ASÜ Teknoloji Atölyesi deneyiminden yola çıkarak üniversite topluluğu kurma ve yönetme ipuçları.',
  },
  {
    title: 'Staj Deneyimleri ve Kariyer İpuçları',
    slug: 'staj-deneyimleri-ve-kariyer-ipuclari',
    excerpt:
      'Kuzeyboru ve N2Mobile stajlarında edindiğim deneyimler ve yazılım kariyerine hazırlananlar için öneriler.',
    content: [
      'Staj, teoriyi pratiğe dönüştürmenin en iyi yoludur.',
      "GitHub profilinizi güncel tutun, kişisel projeler ekleyin ve LinkedIn'de aktif olun.",
      "Sorular sorun, kod review'larına katılın ve dokümantasyon yazma alışkanlığı edinin.",
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80',
    seoTitle: 'Staj deneyimleri ve kariyer ipuçları',
    seoDescription:
      'Kuzeyboru ve N2Mobile staj deneyimlerinden çıkarılan dersler ve yazılım kariyeri için pratik öneriler.',
  },
  {
    title: 'Kurumsal uygulamalarda gözlemlenebilirlik',
    slug: 'kurumsal-uygulamalarda-gozlemlenebilirlik',
    excerpt:
      'Loglama, metrikler ve hata izleme ile üretim ortamında güvenilir operasyon.',
    content: [
      'Kurumsal ürünlerde yalnızca hata logu yeterli değildir.',
      'Kritik iş akışları için izlenebilir olay yapısı kurmak proje süresini azaltır.',
      'Gözlemlenebilirlik kültürü geliştirme ve operasyon ekiplerini aynı hedefte buluşturur.',
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80',
    seoTitle: 'Kurumsal gözlemlenebilirlik: log ve metrik',
    seoDescription:
      'Üretim ortamında loglama, metrik ve hata izleme ile güvenilir operasyon için pratik yaklaşımlar.',
  },
  {
    title: 'RBAC ile erişim modeli tasarımı',
    slug: 'rbac-ile-erisim-modeli-tasarimi',
    excerpt:
      'Kapsam ve izinlerin net tanımı, denetim ve ölçeklenebilirlik için neden önemlidir.',
    content: [
      'Erişim modeli ürün büyüdükçe daha da kritik hale gelir.',
      'Scope ve permission netliği hem güvenlik hem kullanıcı deneyimi sağlar.',
      'Doğru RBAC modeli denetim raporlamasını kolaylaştırır.',
    ],
    categorySlug: 'guvenlik',
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80',
    seoTitle: 'RBAC ve kurumsal erişim modeli nasıl tasarlanır?',
    seoDescription:
      'Rol tabanlı erişimde kapsam ve izinlerin netleştirilmesi için özet rehber.',
  },
  {
    title: 'PostgreSQL ile okuma ağırlıklı iş yükleri',
    slug: 'postgresql-okuma-agirlikli-is-yukleri',
    excerpt:
      'İndeks stratejisi, bağlantı havuzu ve raporlama sorgularında performans düşüncesi.',
    content: [
      'Okuma ağırlıklı panolar için uygun indeks seçimi sorgu süresini doğrudan etkiler.',
      'Bağlantı havuzu üst sınırları ve zaman aşımı politikaları üretimde stabilite sağlar.',
      'Ağır raporları ana işlem yükünden ayırmak için okuma replikası düşünülebilir.',
    ],
    categorySlug: 'muhendislik',
    imageUrl:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=80',
    seoTitle: 'PostgreSQL performansı: okuma yoğun senaryolar',
    seoDescription:
      'Raporlama ve pano sorguları için indeks ve havuzlama odaklı kısa teknik not.',
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(blog)
    .where(isNull(blog.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip blog seed: blog table is not empty')
    return
  }

  const categories = await db
    .select({ id: blogCategory.id, slug: blogCategory.slug })
    .from(blogCategory)
    .where(isNull(blogCategory.deletedAt))
  const categoryIdBySlug = new Map(
    categories.map((item) => [item.slug, item.id])
  )

  for (const [index, item] of BLOG_ROWS.entries()) {
    const categoryId = categoryIdBySlug.get(item.categorySlug) ?? null
    if (!categoryId) {
      throw new Error(`blog seed: category not found (${item.categorySlug})`)
    }

    const response = await fetch(item.imageUrl, {
      signal: AbortSignal.timeout(45_000),
    })
    if (!response.ok) {
      throw new Error(`blog seed: image fetch failed (${response.status})`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const uploaded = await uploadFile(
      buffer,
      `${item.slug}.${extension}`,
      contentType,
      {
        prefix: 'seed/blog',
        isPublic: true,
        altText: `${item.title} — blog kapak görseli`,
      }
    )

    await db.insert(blog).values({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: {
        type: 'doc',
        version: 1,
        html: item.content.map((paragraph) => `<p>${paragraph}</p>`).join(''),
        imageFileIds: [],
        videoFileIds: [],
      },
      categoryId,
      fileId: uploaded.id,
      isPublished: true,
      publishedAt: new Date(),
      sortOrder: index,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      robotsIndex: true,
    })
    console.log(`  Seeded blog: ${item.title}`)
  }
}
