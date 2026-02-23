export const siteConfig = {
  name: "Mehmet Doğan",
  domain: "mehmetdogandev.com",

  headerBranding: {
    logotype: "MD",
    tagline: "Software Engineer",
  },
  description:
    "Mehmet Doğan – Software Engineer. Yazılım mühendisliği, full-stack geliştirme ve teknoloji odaklı projeler.",
  logo: "/logo.png",

  navLinks: [
    { label: "Anasayfa", href: "/" },
    { label: "Hakkımda", href: "/hakkimda" },
    { label: "Projeler", href: "/projeler" },
    { label: "Blog", href: "/blog" },
    { label: "Galeri", href: "/galeri" },
    { label: "İletişim", href: "/iletisim" },
  ],

  socialLinks: {
    linkedin: "https://www.linkedin.com/in/mehmetdogandev",
    github: "https://github.com/mehmetdogandev",
    medium: "https://medium.com/@mehmetdogan.dev",
  },

  contact: {
    phone: "0553 657 84 02",
    phoneRaw: "905536578402",
    email: "mehmetdogan.dev@gmail.com",
    whatsapp: "https://wa.me/905536578402",
  },

  hero: {
    title: "Merhaba, ben Mehmet Doğan",
    subtitle:
      "Software Engineer. Yazılım mühendisliği alanında çalışıyorum; ERP sistemleri, web uygulamaları ve yapay zeka projeleri üzerinde deneyimim var.",
    youtubeVideoId: "dQw4w9WgXcQ",
    quote:
      "Teknoloji ve yenilik alanlarında genç bireylerin becerilerini geliştirmelerine yardımcı olmak benim için motive edici bir unsur.",
  },

  footer: {
    columns: [
      {
        title: "Sayfalar",
        links: [
          { label: "Hakkımda", href: "/hakkimda" },
          { label: "Projeler", href: "/projeler" },
          { label: "Blog", href: "/blog" },
          { label: "Galeri", href: "/galeri" },
          { label: "İletişim", href: "/iletisim" },
        ],
        icon: "link" as const,
      },
      {
        title: "İletişim",
        items: [
          "0553 657 84 02",
          "mehmetdogan.dev@gmail.com",
        ],
        icon: "mail" as const,
      },
      {
        title: "Sosyal Medya",
        social: true,
        icon: "share" as const,
      },
    ],
    copyright: "Mehmet Doğan",
  },

  about: {
    lead:
      "Yazılım, benim için sadece bir meslek değil; problemleri çözmek, sistemleri tasarlamak ve insanların işini kolaylaştırmak anlamına geliyor. Bu tutkuyla yola çıkarak hem kurumsal dünyada hem de topluluk ve girişim tarafında deneyim kazanmaya devam ediyorum.",
    intro:
      "Aksaray Üniversitesi Yazılım Mühendisliği bölümünde lisans eğitimime devam ederken, Anadolu Mikronize'de Yazılım Destek Uzmanı olarak çalışıyorum. Şirketin dijital dönüşümü için ERP sistemi ve web altyapısı geliştiriyorum. N2Mobile ve Kuzeyboru'da edindiğim staj ve tam zamanlı deneyimlerle Vue.js, Django, API tasarımı ve veritabanı sistemleri konusunda sağlam bir temel oluşturdum.",
    introPart2:
      "Teknoloji tutkum ofis duvarlarının ötesine uzanıyor. ASÜ Teknoloji Atölyesi'nin kurucu başkanı olarak üniversitede bir teknoloji topluluğu kurdum; etkinlikler düzenledim, projelere liderlik ettim. T3 Vakfı Deneyap merkezinde mentorluk yapıyorum, gençlere yazılım ve yapay zeka eğitimi veriyorum. T3 AI'LE topluluğunda doğal dil işleme araştırmalarına katılıyorum. Gürman İnovasyon'da proje lideri olarak elektrikli araç ve yapay zeka entegrasyonları üzerinde çalıştım. MDKARE ~ SOFT ile freelance tam yığın projeler geliştiriyorum.",
    introPart3:
      "TÜBİTAK DENEYAP'ta ortaokul öğrencilerine yapay zeka dersi verdim. Sürekli öğrenmek ve başkalarının gelişimine katkıda bulunmak benim için güçlü bir motivasyon. ERP, web geliştirme, yapay zeka ve veritabanı sistemleri alanındaki birikimimi hem iş projelerinde hem de topluluk çalışmalarında kullanıyorum.",
    introPart4:
      "Gelecekte daha karmaşık sistemler tasarlamak, açık kaynağa katkı sağlamak ve teknoloji alanında anlamlı bir iz bırakmak istiyorum. Proje fırsatları, iş birlikleri veya sadece sohbet için benimle iletişime geçebilirsiniz.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
