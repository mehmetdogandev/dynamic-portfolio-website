export const siteConfig = {
  name: "Mehmet Doğan",
  domain: "mehmetdogandev.com",
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
    intro:
      "Aksaray Üniversitesi Yazılım Mühendisliği bölümünde lisans eğitimime devam ederken, sektörde hem kurumsal hem de girişimci tarafında deneyim kazanıyorum. Anadolu Mikronize'de Yazılım Destek Uzmanı olarak çalışıyorum; şirketin dijital dönüşümü için ERP sistemi ve web altyapısı geliştiriyorum. Daha önce N2Mobile ve Kuzeyboru gibi firmalarda staj ve tam zamanlı roller üstlendim. Bu süreçte Vue.js, Django, web uygulamaları, API tasarımı ve veritabanı sistemleri üzerinde pratik deneyim edindim.",
    introPart2:
      "Teknolojiye olan tutkum sadece iş hayatıyla sınırlı değil. ASÜ Teknoloji Atölyesi'nin kurucu başkanı olarak üniversitede teknoloji topluluğu kurdum ve yönettim; etkinlikler düzenledim, proje organizasyonlarına liderlik ettim. T3 Vakfı bünyesinde Deneyap merkezinde mentorluk yapıyorum; gençlere yazılım ve yapay zeka alanında eğitim veriyorum. T3 AI'LE topluluğunda doğal dil işleme üzerine araştırma faaliyetlerine katılıyorum. Gürman İnovasyon'da proje lideri olarak elektrikli araç projelerinde ve yapay zeka entegrasyonlarında çalıştım. Ayrıca MDKARE ~ SOFT adıyla freelance olarak tam yığın web uygulamaları ve backend sistemleri geliştiriyorum.",
    introPart3:
      "TÜBİTAK DENEYAP kapsamında ortaokul öğrencilerine yapay zeka dersi verdim; Python programlama ve model eğitimi konularında içerik hazırladım. Teknoloji ve yenilik odaklı projelerde çalışmak, sürekli öğrenmek ve başkalarının bu alanda gelişmesine katkı sağlamak benim için motive edici bir unsur. ERP, web geliştirme, yapay zeka ve veritabanı sistemleri konularında hem teorik hem pratik birikimimi projelerde kullanmaya devam ediyorum.",
    introPart4:
      "İleride daha karmaşık sistemler tasarlamak, açık kaynak projelere katkıda bulunmak ve teknoloji alanında sürdürülebilir bir kariyer inşa etmek hedeflerim arasında. İş birlikleri, proje fırsatları veya sadece sohbet etmek için benimle iletişime geçmekten çekinmeyin.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
