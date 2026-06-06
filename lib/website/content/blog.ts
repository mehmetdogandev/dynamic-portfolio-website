import type { WebsiteBlogPost } from '@/lib/website/types'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'

const asContent = (paragraphs: string[]) => ({
  type: 'doc' as const,
  version: 1 as const,
  html: paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join(''),
  imageFileIds: [],
  videoFileIds: [],
})

export const websiteBlogPosts: WebsiteBlogPost[] = [
  {
    id: '1',
    slug: 'kurumsal-uygulamalarda-gozlemlenebilirlik',
    title: 'Kurumsal uygulamalarda gözlemlenebilirlik',
    excerpt:
      'Loglama, metrikler ve hata izleme ile üretim ortamında güvenilir operasyon.',
    content: asContent([
      'Kurumsal ürünlerde yalnızca hata logu yeterli değildir; iş metrikleri ve sistem metrikleri birlikte takip edilmelidir.',
      'Tüm kritik akışlar için izlenebilir olay yapısı kurmak, sorun giderme sürelerini ciddi biçimde düşürür.',
      'Gözlemlenebilirlik kültürü, geliştirme ve operasyon ekiplerinin aynı dili konuşmasını sağlar.',
    ]),
    date: '2025-10-12',
    category: 'Mühendislik',
    imageSrc: WEBSITE_IMAGES.blogCovers[0],
  },
  {
    id: '2',
    slug: 'rbac-ile-erisim-modeli-tasarimi',
    title: 'RBAC ile erişim modeli tasarımı',
    excerpt:
      'Kapsam ve izinlerin net tanımı, denetim ve ölçeklenebilirlik için neden önemlidir.',
    content: asContent([
      'Erişim modeli, ürün büyüdükçe karmaşıklaşan kullanıcı rollerini yönetebilmek için en kritik katmanlardan biridir.',
      'Yetki kapsamlarının açık tanımlanması hem güvenlik hem de kullanıcı deneyimi tarafında öngörülebilir davranış sağlar.',
      'Doğru RBAC modeli, destek taleplerini azaltırken denetim raporlamasını kolaylaştırır.',
    ]),
    date: '2025-11-03',
    category: 'Güvenlik',
    imageSrc: WEBSITE_IMAGES.blogCovers[1],
  },
  {
    id: '3',
    slug: 'platform-guncellemeleri-2026-q1',
    title: 'Duyuru: Aksiyon Soft platform güncellemeleri',
    excerpt:
      'Düzenli sürümler, geriye dönük uyumluluk ve iletişim kanallarımız.',
    content: asContent([
      'Bu sürüm döneminde kullanıcı arayüzü, performans ve güvenlik odaklı çok sayıda iyileştirme devreye alındı.',
      'API sürümlerinde geriye dönük uyumluluk korunarak geçiş adımları kademeli şekilde yayımlandı.',
      'Müşteri ekipleri için yayın notları ve geçiş rehberleri düzenli duyuru takvimiyle paylaşılmaktadır.',
    ]),
    date: '2026-01-08',
    category: 'Duyuru',
    imageSrc: WEBSITE_IMAGES.blogCovers[2],
  },
  {
    id: '4',
    slug: 'kurumsal-entegrasyon-projelerinde-kritik-adimlar',
    title: 'Kurumsal entegrasyon çözümlerinde kritik adımlar',
    excerpt:
      'Sistem entegrasyonlarında riskleri azaltan planlama ve devreye alma yaklaşımı.',
    content: asContent([
      'Başarılı entegrasyon çözümleri için kaynak sistem analizi ve veri sözleşmeleri en başta netleştirilmelidir.',
      'Geçiş dönemlerinde paralel çalışma stratejisiyle iş sürekliliği korunur.',
      'Uçtan uca test planı ve rollback senaryoları devreye almada kritik rol oynar.',
    ]),
    date: '2026-02-14',
    category: 'Kurumsal dönüşüm',
    imageSrc: WEBSITE_IMAGES.blogCovers[3]!,
  },
]

export function getWebsiteBlogPostBySlug(slug: string): WebsiteBlogPost | null {
  return websiteBlogPosts.find((item) => item.slug === slug) ?? null
}
