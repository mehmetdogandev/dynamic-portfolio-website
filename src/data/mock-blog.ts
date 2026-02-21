import type { BlogPost } from "./types";

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "full-stack-gelistirmeye-baslarken",
    title: "Full-Stack Geliştirmeye Başlarken",
    excerpt:
      "Frontend ve backend teknolojilerini bir arada öğrenmek isteyenler için pratik öneriler ve önerilen teknoloji yığınları.",
    body: `
      <p>Full-stack geliştirici olmak hem frontend hem backend konularında bilgi sahibi olmayı gerektirir. Bu yazıda nereden başlayacağınız ve hangi teknolojilere odaklanmanız gerektiği hakkında pratik öneriler paylaşıyorum.</p>
      <h2>Frontend Temelleri</h2>
      <p>HTML, CSS ve JavaScript ile başlayın. Ardından React veya Vue.js gibi bir framework öğrenin. Tailwind CSS ile stil verme konusunda hız kazanabilirsiniz.</p>
      <h2>Backend ve Veritabanı</h2>
      <p>Node.js + Express veya Next.js API Routes ile backend deneyimi kazanın. PostgreSQL veya MongoDB ile veritabanı modelleme öğrenin.</p>
      <h2>T3 Stack Önerisi</h2>
      <p>TypeScript, tRPC, Prisma ve Next.js kombinasyonu modern full-stack projeler için güçlü bir seçenektir. Type-safety ve geliştirici deneyimi açısından oldukça verimlidir.</p>
    `,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    imageAlt: "Kod yazma",
    date: "2025-01-15",
  },
  {
    id: "2",
    slug: "erp-sistemleri-nedir-ve-neden-onemli",
    title: "ERP Sistemleri Nedir ve Neden Önemli?",
    excerpt:
      "Kurumsal Kaynak Planlaması (ERP) sistemlerinin işletmeler için önemi ve yazılım geliştirici perspektifinden ERP projeleri.",
    body: `
      <p>ERP (Enterprise Resource Planning) sistemleri, bir işletmenin tüm temel süreçlerini tek bir platformda birleştiren yazılımlardır. Finans, insan kaynakları, üretim, satın alma gibi departmanların verileri merkezileştirilir.</p>
      <h2>ERP'nin Faydaları</h2>
      <p>Veri tutarlılığı, süreç otomasyonu, raporlama kolaylığı ve maliyet tasarrufu sağlar. Özellikle KOBİ'ler için özelleştirilebilir ERP çözümleri büyük değer katabilir.</p>
      <h2>Geliştirici Perspektifi</h2>
      <p>ERP projelerinde modüler mimari, rol tabanlı erişim kontrolü ve esnek veritabanı modellemesi önemlidir. Kullanıcı gereksinimlerini iyi anlamak başarının anahtarıdır.</p>
    `,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    imageAlt: "ERP ve veri analizi",
    date: "2025-01-20",
  },
  {
    id: "3",
    slug: "yapay-zeka-ve-dogal-dil-isleme",
    title: "Yapay Zeka ve Doğal Dil İşleme",
    excerpt:
      "NLP (Natural Language Processing) alanına giriş ve T3 AI'LE topluluğundaki deneyimlerim.",
    body: `
      <p>Doğal dil işleme, bilgisayarların insan dilini anlamasını ve üretmesini sağlayan yapay zeka alt alanıdır. Chatbot'lar, çeviri sistemleri ve metin analizi gibi uygulamalarda kullanılır.</p>
      <h2>Veri Ön İşleme</h2>
      <p>NLP projelerinde veri toplama ve ön işleme kritik öneme sahiptir. Tokenization, stemming ve temizleme adımları model performansını doğrudan etkiler.</p>
      <h2>Topluluk Deneyimi</h2>
      <p>T3 AI'LE topluluğunda doğal dil işleme modeli üzerinde çalışırken veri toplama ve ön işleme faaliyetlerinde bulundum. Açık kaynak araçlar ve iş birlikçi ortam bu süreçte çok değerli.</p>
    `,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    imageAlt: "Yapay zeka",
    date: "2025-02-01",
  },
  {
    id: "4",
    slug: "universite-toplulugu-kurmak",
    title: "Üniversitede Teknoloji Topluluğu Kurmak",
    excerpt:
      "ASÜ Teknoloji Atölyesi'ni kurarken edindiğim deneyimler ve genç geliştiricilere öneriler.",
    body: `
      <p>Üniversitede teknoloji odaklı bir topluluk kurmak hem kişisel gelişim hem de network açısından benzersiz fırsatlar sunar. Ben 2022'de Aksaray Üniversitesi'nde ASÜ Teknoloji Atölyesi'ni kurdum.</p>
      <h2>Adım Adım Kurulum</h2>
      <p>Önce benzer ilgi alanına sahip arkadaşlarınızla bir çekirdek ekip oluşturun. Üniversite yönetimiyle iletişime geçin ve resmi onay alın. Düzenli etkinlikler planlayın.</p>
      <h2>Etkinlik Fikirleri</h2>
      <p>Workshop'lar, hackathon'lar, konuk konuşmacılar ve proje günleri topluluğu canlı tutar. Deneyap ve T3 Vakfı gibi kurumlarla iş birliği yapmak da değer katar.</p>
    `,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    imageAlt: "Topluluk etkinliği",
    date: "2025-02-10",
  },
  {
    id: "5",
    slug: "staj-deneyimleri-ve-kariyer-ipuclari",
    title: "Staj Deneyimleri ve Kariyer İpuçları",
    excerpt:
      "Kuzeyboru ve N2Mobile stajlarında edindiğim deneyimler ve yazılım kariyerine hazırlananlar için öneriler.",
    body: `
      <p>Staj, teoriyi pratiğe dönüştürmenin en iyi yoludur. Kuzeyboru ve N2Mobile'da geçirdiğim sürelerde gerçek projelerde çalışma, ekip dinamikleri ve sektör standartları hakkında çok şey öğrendim.</p>
      <h2>Başvuru Önerileri</h2>
      <p>GitHub profilinizi güncel tutun, kişisel projeler ekleyin ve LinkedIn'de aktif olun. Staj ilanlarını erkenden takip edin ve özelleştirilmiş başvuru metinleri yazın.</p>
      <h2>Staj Sırasında</h2>
      <p>Sorular sorun, kod review'larına katılın ve dokümantasyon yazma alışkanlığı edinin. Geri bildirim almak için açık olun ve her gün yeni bir şey öğrenmeye odaklanın.</p>
    `,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    imageAlt: "Takım çalışması",
    date: "2025-02-18",
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
