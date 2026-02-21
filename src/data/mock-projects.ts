import type { Project } from "./types";

export const projects: Project[] = [
  {
    id: "1",
    slug: "sales-marketing-bot",
    title: "Sales Marketing Bot",
    description: "GetCody API kullanarak veri odaklı müşteri etkileşimlerini destekleyen satış ve pazarlama botu geliştirildi.",
    longDescription:
      "Kuzeyboru A.Ş. için GetCody API kullanarak satış ve pazarlama süreçlerini otomatize eden bir bot geliştirdim. Sistem canlı olarak kullanılmaktadır ve veri odaklı müşteri etkileşimlerini desteklemektedir.",
    images: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    ],
    imageAlt: "Sales Marketing Bot",
    stack: ["Python", "MsSql", "GetCody-API"],
    links: [{ label: "Canlı Sistem", url: "https://widget.getcody.ai/public/9a23ccab-c621-4ef1-a2a2-a0ad03af88f6" }],
    date: "2023-07",
    featured: true,
  },
  {
    id: "2",
    slug: "exam-system",
    title: "Sınav Sistemi",
    description: "Yazılım ve mühendislik dersleri için güvenli değerlendirmeleri destekleyen bilgisayar tabanlı sınav sistemi.",
    longDescription:
      "MDKARE ~ SOFT için yazılım ve mühendislik derslerinde güvenli değerlendirmeleri destekleyecek şekilde tasarlanmış bilgisayar tabanlı bir sınav sistemi geliştirdim. Sistem online olarak kullanılmaktadır.",
    images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"],
    imageAlt: "Exam System",
    stack: ["Judge0", "T3stack", "Docker", "PostgreSQL"],
    date: "2024-10",
    featured: true,
  },
  {
    id: "3",
    slug: "real-estate-website",
    title: "Emlak ve İnşaat Web Sitesi",
    description: "Emlak ve müteahhit platformu için web sitesi tasarımı ve geliştirmesi.",
    longDescription:
      "MDKARE ~ SOFT için emlak ve müteahhit web platformu tasarlayıp geliştirdim. Detaylı proje dokümantasyonu GitHub üzerinde mevcuttur.",
    images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"],
    imageAlt: "Real Estate Website",
    stack: ["PHP", "MySQL"],
    links: [{ label: "GitHub", url: "https://github.com/mehmetdogandev" }],
    date: "2024-03",
  },
  {
    id: "4",
    slug: "personalized-qr-code-system",
    title: "Kişiselleştirilmiş QR Kod Sistemi",
    description: "Çalışanlar için kişiselleştirilmiş sayfalar ve tarama analitiği üreten QR kod sistemi.",
    longDescription:
      "Anadolu Mikronize A.Ş. için çalışan QR kodu sistemi geliştirdim. Her çalışan için kişiselleştirilmiş sayfalar oluşturulur ve tarama verileri analiz edilir.",
    images: ["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80"],
    imageAlt: "QR Code System",
    stack: ["Next.js", "PostgreSQL", "Docker"],
    date: "2025-04",
    featured: true,
  },
  {
    id: "5",
    slug: "personnel-entry-exit-system",
    title: "Personel Giriş-Çıkış Sistemi",
    description: "ESP32 ve RFID cihazları kullanan, Next.js API ile iletişim kuran IoT tabanlı personel giriş-çıkış sistemi.",
    longDescription:
      "Anadolu Mikronize A.Ş. için ESP32 ve RFID cihazları kullanan IoT tabanlı personel giriş-çıkış sistemi geliştirdim. Gerçek zamanlı devam verileri Next.js tabanlı API üzerinden iletilir ve şirket veritabanında güvenli şekilde saklanır.",
    images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"],
    imageAlt: "IoT Personnel System",
    stack: ["C++", "ESP32", "RFID", "Next.js", "PostgreSQL"],
    date: "2025-04",
  },
  {
    id: "6",
    slug: "erp-system",
    title: "Kurumsal Kaynak Planlaması (ERP)",
    description: "İnsan kaynakları ve dahili operasyonel süreçleri dijitalleştiren ERP sistemi.",
    longDescription:
      "Anadolu Mikronize A.Ş. için insan kaynakları ve dahili operasyonel süreçleri dijitalleştiren bir ERP sistemi geliştirdim. İş verilerini merkezileştirerek süreç kontrolü ve veri tutarlılığını artırdım.",
    images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"],
    imageAlt: "ERP System",
    stack: ["Next.js", "PostgreSQL", "Docker", "tRPC"],
    date: "2025-04",
    featured: true,
  },
  {
    id: "7",
    slug: "building-management-system",
    title: "Bina Yönetim Sistemi",
    description: "Canlı demo erişimli bina yönetim sistemi tasarımı ve geliştirmesi.",
    longDescription:
      "MDKARE ~ SOFT için bina yönetim sistemi tasarlayıp geliştirdim. Kullanım dokümantasyonu, canlı demo erişimi ve genel sistem özeti mevcuttur.",
    images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80"],
    imageAlt: "Building Management System",
    stack: ["Next.js", "PostgreSQL", "Docker", "tRPC"],
    links: [{ label: "Canlı Demo", url: "#" }],
    date: "2025-11",
  },
  {
    id: "8",
    slug: "mirello",
    title: "MIRELLO",
    description: "Trello platformunu referans alan, eşdeğer temel özellikler sunan full-stack proje yönetim uygulaması.",
    longDescription:
      "Trello platformunu referans alarak MIRELLO adlı full-stack proje yönetim uygulaması geliştirdim. Eşdeğer temel özellikler sunar. Kaynak kodu ve tam proje dokümantasyonu GitHub'da mevcuttur.",
    images: ["https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80"],
    imageAlt: "MIRELLO Project Management",
    stack: ["Next.js", "PostgreSQL", "Docker", "tRPC"],
    links: [{ label: "GitHub", url: "https://github.com/mehmetdogandev" }],
    date: "2025-12",
  },
  {
    id: "9",
    slug: "consultant-performance-tracking",
    title: "Danışman Performans Takip Sistemi",
    description: "Softanalytic danışmanlık firması için günlük görev ve performans verilerini takip eden merkezi sistem.",
    longDescription:
      "Softanalytic danışmanlık firması için danışmanların günlük görevlerini ve performans verilerini takip eden merkezi bir sistem geliştirdim. Manuel raporlamayı azalttım ve yönetim ekiplerine ölçülebilir, veri odaklı karar desteği sağladım.",
    images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"],
    imageAlt: "Consultant Performance Tracking",
    stack: ["PHP", "MySQL"],
    date: "2025-07",
  },
  {
    id: "10",
    slug: "core-banking-system",
    title: "Çekirdek Bankacılık Yönetim Sistemi",
    description: "Hesap yönetimi, para transferi ve işlem takibini simüle eden uçtan uca bankacılık uygulaması.",
    longDescription:
      "MDKARE ~ SOFT için çekirdek mali operasyonları simüle eden uçtan uca bir bankacılık uygulaması geliştiriyorum. Hesap yönetimi, para transferleri ve işlem takibi içerir.",
    images: ["https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200&q=80"],
    imageAlt: "Core Banking System",
    stack: ["Next.js", "PostgreSQL", "Docker", "tRPC"],
    date: "2026-01",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}
