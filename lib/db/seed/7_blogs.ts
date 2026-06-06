import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blog, blogCategory } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'

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

const BLOG_ROWS: SeedBlog[] = [
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
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
    seoTitle: 'Kurumsal gözlemlenebilirlik: log ve metrik | Aksiyon Soft',
    seoDescription:
      'Üretim ortamında loglama, metrik ve hata izleme ile güvenilir operasyon. Kurumsal yazılım ekipleri için pratik yaklaşımlar.',
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
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
    seoTitle: 'RBAC ve kurumsal erişim modeli nasıl tasarlanır?',
    seoDescription:
      'Rol tabanlı erişimde kapsam ve izinlerin netleştirilmesi, denetim ve ölçeklenebilirlik için özet rehber.',
  },
  {
    title: 'Aksiyon Soft platform güncellemeleri',
    slug: 'aksiyon-soft-platform-guncellemeleri',
    excerpt:
      'Düzenli sürümler, geriye dönük uyumluluk ve iletişim kanallarımız.',
    content: [
      'Bu sürüm döneminde kullanıcı arayüzü ve performans iyileştirmeleri yayımlandı.',
      'API sürümlerinde geriye dönük uyumluluk korunarak geçiş adımları paylaşıldı.',
      'Müşteri ekipleri için yayın notları düzenli olarak iletilmektedir.',
    ],
    categorySlug: 'duyuru',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    seoTitle: 'Platform güncellemeleri ve sürüm notları | Aksiyon Soft',
    seoDescription:
      'Kurumsal yazılım platformunda düzenli sürümler, API uyumluluğu ve müşteri iletişimi hakkında özet bilgi.',
  },
  {
    title: 'API tasarımında sözleşme ve geriye dönük uyumluluk',
    slug: 'api-tasariminda-sozlesme-ve-uyumluluk',
    excerpt:
      'Kurumsal entegrasyonlarda versiyonlama, hata sözleşmesi ve tüketici beklentilerini yönetmek.',
    content: [
      'Açık ve stabil bir API sözleşmesi, birden fazla tüketici ekibinin aynı anda güvenle geliştirmesini sağlar.',
      'Kırıcı değişiklikleri kanallara ayırmak ve kademeli geçiş planlamak operasyon riskini azaltır.',
      'Hata gövdeleri ve durum kodları için ortak bir şema, destek ve entegrasyon süresini kısaltır.',
    ],
    categorySlug: 'muhendislik',
    imageUrl: WEBSITE_IMAGES.blogCovers[0]!,
    seoTitle: 'Kurumsal API tasarımı: sözleşme ve uyumluluk ipuçları',
    seoDescription:
      'Özel yazılım ve entegrasyon projelerinde API sürümü, hata modeli ve geriye dönük uyumluluğun kısa özeti.',
  },
  {
    title: 'PostgreSQL ile okuma ağırlıklı iş yükleri',
    slug: 'postgresql-okuma-agirlikli-is-yukleri',
    excerpt:
      'İndeks stratejisi, bağlantı havuzu ve raporlama sorgularında performans düşüncesi.',
    content: [
      'Okuma ağırlıklı panolar için uygun indeks seçimi sorgu süresini doğrudan etkiler.',
      'Bağlantı havuzu üst sınırları ve zaman aşımı politikaları üretimde stabilite sağlar.',
      'Ağır raporları ana işlem yükünden ayırmak için okuma replikası veya materyalize görünüm düşünülebilir.',
    ],
    categorySlug: 'muhendislik',
    imageUrl: WEBSITE_IMAGES.blogCovers[1]!,
    seoTitle: 'PostgreSQL performansı: okuma yoğun kurumsal senaryolar',
    seoDescription:
      'Kurumsal uygulamalarda raporlama ve pano sorguları için indeks ve havuzlama odaklı kısa teknik not.',
  },
  {
    title: 'Kurumsal yazılım projesinde kapsam ve değişiklik yönetimi',
    slug: 'kurumsal-yazilim-kapsam-ve-degisiklik-yonetimi',
    excerpt:
      'Öncelik, kabul kriterleri ve paydaş hizalaması ile teslimatın öngörülebilir tutulması.',
    content: [
      'Net bir ürün özeti ve sprint kapsamı, beklenen dışı genişlemeleri erken yakalar.',
      'Değişiklik talepleri için hafif bir onay akışı bile iletişim gürültüsünü azaltır.',
      'Müşteri ve geliştirme ekipleri arasında tek doğruluk kaynağı olarak yaşayan dokümantasyon önerilir.',
    ],
    categorySlug: 'entegrasyon',
    imageUrl: WEBSITE_IMAGES.blogCovers[2]!,
    seoTitle: 'Kapsam yönetimi: kurumsal yazılım teslimatında pratikler',
    seoDescription:
      'Özel yazılım projelerinde önceliklendirme, değişiklik kontrolü ve paydaş hizalaması için özet tavsiyeler.',
  },
  {
    title: 'Güvenlik değerlendirmesi öncesi kontrol listesi',
    slug: 'guvenlik-degerlendirmesi-oncesi-kontrol-listesi',
    excerpt:
      'Kimlik doğrulama, yetkilendirme, günlük ve bağımlılık yüzeyi için hızlı bir ön kontrol.',
    content: [
      'Oturum ve anahtar yönetiminin merkezi olmayan parçaları gözden geçirilir.',
      'Ayrıcalıklı hesaplar ve servis hesapları için ayrıntılı denetim izi talep edilir.',
      'Üçüncü parti paketler için güvenlik güncellemesi politikası netleştirilir.',
    ],
    categorySlug: 'guvenlik',
    imageUrl: WEBSITE_IMAGES.blogCovers[3]!,
    seoTitle: 'Kurumsal uygulama güvenliği: değerlendirme öncesi checklist',
    seoDescription:
      'Kurumsal yazılım ve portal projelerinde penestrasyon veya denetim öncesi temel güvenlik kontrolleri.',
  },
  {
    title: 'Müşteri portalında SSO ve oturum güvenliği',
    slug: 'musteri-portalinda-sso-ve-oturum-guvenligi',
    excerpt:
      'Kurumsal kimlik sağlayıcı entegrasyonu, token yenileme ve çıkış senaryoları.',
    content: [
      'SSO ile parola yükü azalır; oturum süresi ve yenileme politikaları açıkça tanımlanmalıdır.',
      'Çıkış işlemi tüm istemci sekmelerinde tutarlı davranmalıdır.',
      'Hassas işlemler için step-up authentication düşünülebilir.',
    ],
    categorySlug: 'guvenlik',
    imageUrl:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=80',
    seoTitle: 'SSO ve oturum güvenliği: müşteri self-servis portalı',
    seoDescription:
      'Kurumsal portal ve B2B yazılımlarda tek oturum, token yaşam döngüsü ve güvenli çıkış için kısa rehber.',
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

    const response = await fetch(item.imageUrl)
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
  }
}
