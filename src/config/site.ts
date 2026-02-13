export const siteConfig = {
  name: "Mimlevip",
  description:
    "Mimlevip Eğitim Kurumu – Kaliteli eğitim ve özel ders hizmetleri ile hedeflerinize ulaşın.",
  logo: "/logo.png",

  navLinks: [
    { label: "Ana Sayfa", href: "/" },
    { label: "Blog İçerikleri", href: "/blog" },
    { label: "Ders Videoları", href: "/ders-videolari" },
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "İletişim", href: "/iletisim" },
  ],

  socialLinks: {
    youtube: "https://www.youtube.com/",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
  },

  contact: {
    phone: "+90 212 555 00 00",
    phoneRaw: "902125550000",
    email: "info@mimlevip.com",
    whatsapp: "https://wa.me/902125550000",
    address: "Örnek Mahallesi, Eğitim Sokak No: 1, İstanbul",
  },

  hero: {
    title: "Mimlevip ile Öğrenmek Fark Yaratır",
    subtitle:
      "Uzman kadromuz ve zengin içeriklerimizle sınavlara ve hedeflerinize en iyi şekilde hazırlanın. Bire bir özel ders ve online videolarla yanınızdayız.",
    youtubeVideoId: "dQw4w9WgXcQ",
  },

  footer: {
    columns: [
      {
        title: "Kurumsal",
        links: [
          { label: "Hakkımızda", href: "/hakkimizda" },
          { label: "İletişim", href: "/iletisim" },
        ],
        icon: "building" as const,
      },
      {
        title: "Hızlı Linkler",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Ders Videoları", href: "/ders-videolari" },
        ],
        icon: "link" as const,
      },
      {
        title: "İletişim",
        items: ["Örnek Mah. Eğitim Sok. No: 1", "İstanbul", "info@mimlevip.com"],
        icon: "mail" as const,
      },
      {
        title: "Sosyal Medya",
        social: true,
        icon: "share" as const,
      },
    ],
    copyright: "Mimlevip",
    legalLinks: [
      { label: "Gizlilik Politikası", href: "/gizlilik" },
      { label: "Çerez Politikası", href: "/cerez" },
    ],
  },

  about: {
    sections: [
      {
        title: "Biz Kimiz",
        content:
          "Mimlevip Eğitim Kurumu olarak yıllardır öğrencilerimizin başarısı için çalışıyoruz. Alanında uzman eğitmen kadromuz ve güncel müfredata uygun içeriklerimizle sınavlara hazırlık ve okul derslerine takviye konusunda güvenilir bir adres olmayı hedefliyoruz.",
        icon: "users",
      },
      {
        title: "Misyonumuz",
        content:
          "Her öğrencinin kendi potansiyelini keşfetmesine ve hedeflerine ulaşmasına yardımcı olmak. Kaliteli, erişilebilir ve güncel eğitim içerikleri sunarak Türkiye'nin dört bir yanındaki öğrencilere ulaşmayı amaçlıyoruz.",
        icon: "target",
      },
      {
        title: "Neden Mimlevip?",
        content:
          "Uzman öğretmen kadrosu, bire bir özel ders imkânı, zengin video kütüphanesi ve öğrenci odaklı rehberlik hizmetlerimizle fark yaratıyoruz. Sadece sınav sonuçlarına değil, öğrencinin öğrenme sürecine de odaklanıyoruz.",
        icon: "award",
      },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
