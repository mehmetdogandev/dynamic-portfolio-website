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
      "Aksaray Üniversitesi'nde yazılım mühendisliği alanında lisans eğitimime devam ederken, Anadolu Mikronize'de Yazılım Destek Personeli olarak çalışıyorum. Şirketin iç süreçlerini daha verimli hale getirecek bir Kurumsal Kaynak Planlaması (ERP) sistemi geliştirmede önemli rol oynuyorum. T3 AI'LE topluluğunda yapay zeka araştırması yaparken, doğal dil işleme modeli üzerinde çalışmalar yürütüyorum.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
