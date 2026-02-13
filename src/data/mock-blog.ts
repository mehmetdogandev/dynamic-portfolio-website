import type { BlogPost } from "./types";

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "online-egitimde-basari-ipuclari",
    title: "Online Eğitimde Başarı İpuçları",
    excerpt:
      "Evden çalışırken verimli ders çalışma ve sınavlara hazırlanma için pratik öneriler.",
    body: `
      <p>Online eğitim sürecinde düzenli çalışma ve doğru kaynak kullanımı başarının anahtarıdır. Bu yazıda ev ortamında verimli ders çalışma için birkaç ipucu paylaşıyoruz.</p>
      <h2>Çalışma Ortamınızı Düzenleyin</h2>
      <p>Masada sadece ders materyalleriniz olsun. Telefon ve dikkat dağıtıcı cihazları mümkün olduğunca uzak tutun. Işık ve havalandırma da odaklanmanıza yardımcı olacaktır.</p>
      <h2>Zaman Blokları Kullanın</h2>
      <p>Pomodoro tekniği gibi 25–30 dakikalık çalışma blokları ve kısa molalar, konsantrasyonu artırır. Molalarda ekrandan uzaklaşın, kısa bir yürüyüş yapın.</p>
      <h2>Videoları Not Alarak İzleyin</h2>
      <p>Ders videolarını pasif izlemek yerine not alarak izleyin. Önemli formül ve tanımları tekrar yazarak pekiştirin.</p>
      <p>Mimlevip ile tüm ders videolarınıza ve özel ders hocalarımıza tek platformdan ulaşabilirsiniz. Sorularınız için iletişime geçmekten çekinmeyin.</p>
    `,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    imageAlt: "Öğrenci bilgisayar başında ders çalışıyor",
    date: "2025-01-15",
  },
  {
    id: "2",
    slug: "ozel-dersin-onemi",
    title: "Bire Bir Özel Dersin Önemi",
    excerpt:
      "Bire bir özel dersin öğrenme hızına ve ihtiyaçlara göre nasıl fark yarattığını keşfedin.",
    body: `<p>İçerik yakında eklenecektir.</p>`,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    imageAlt: "Öğretmen ve öğrenci bire bir ders",
    date: "2025-01-20",
  },
  {
    id: "3",
    slug: "sinav-stresi-yonetimi",
    title: "Sınav Stresi Yönetimi",
    excerpt:
      "Sınav öncesi ve sırasında stresi azaltmak için basit ve etkili yöntemler.",
    body: `<p>İçerik yakında eklenecektir.</p>`,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    imageAlt: "Rahat çalışma ortamı",
    date: "2025-02-01",
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
