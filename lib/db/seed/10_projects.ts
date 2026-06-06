import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  project,
  projectGroup,
  projectTechnology,
  projectTechnologyLink,
} from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'

const TECH_SEED: { name: string; description: string }[] = [
  {
    name: 'Next.js',
    description:
      "React tabanlı tam yığın web uygulamaları için üretim framework'ü.",
  },
  {
    name: 'Django',
    description: 'Python ile hızlı backend ve REST API geliştirme.',
  },
  {
    name: 'Vue.js',
    description: 'Bileşen tabanlı frontend ve reaktif arayüzler.',
  },
  {
    name: 'PostgreSQL',
    description: 'İlişkisel veri, güvenilir işlemler ve genişletilebilir SQL.',
  },
  {
    name: 'Python',
    description: 'Yapay zeka, otomasyon ve backend geliştirme.',
  },
  {
    name: 'ESP32',
    description: 'IoT ve gömülü sistemler için Wi-Fi/Bluetooth MCU.',
  },
  {
    name: 'RFID',
    description: 'Personel ve varlık takibi için kimlik okuma.',
  },
  {
    name: 'TypeScript',
    description: 'Statik tipleme ile sürdürülebilir kod tabanı.',
  },
  {
    name: 'React',
    description: 'Bileşen tabanlı kullanıcı arayüzü.',
  },
  {
    name: 'REST API',
    description: 'Servis entegrasyonları ve sözleşme yönetimi.',
  },
  {
    name: 'GetCody',
    description: "Veri odaklı sohbet botu ve müşteri etkileşimi API'si.",
  },
  {
    name: 'Docker',
    description: 'Konteyner tabanlı dağıtım ve geliştirme ortamları.',
  },
]

const GROUP_SEED: { name: string; description: string }[] = [
  {
    name: 'Kurumsal yazılım',
    description: 'ERP, iş süreçleri ve kurumsal web uygulamaları.',
  },
  {
    name: 'IoT ve otomasyon',
    description: 'ESP32, RFID ve gerçek zamanlı veri toplama projeleri.',
  },
  {
    name: 'Yapay zeka',
    description: 'NLP, sohbet botları ve model eğitimi uygulamaları.',
  },
  {
    name: 'Web uygulamaları',
    description: 'Full-stack portfolyo ve sektörel web çözümleri.',
  },
  {
    name: 'Finans teknolojileri',
    description: 'Bankacılık simülasyonu ve performans takip sistemleri.',
  },
]

type ProjectSeedRow = {
  title: string
  slug: string
  description: string
  content: string[]
  sector: string
  tags: string[]
  imageUrl: string
  isFeatured: boolean
  seoTitle: string
  seoDescription: string
}

/** referance/.../src/lib/db/seed.ts — SEED_PROJECTS */
const PROJECT_ROWS: ProjectSeedRow[] = [
  {
    title: 'Sales Marketing Bot',
    slug: 'sales-marketing-bot',
    description:
      'GetCody API kullanarak veri odaklı müşteri etkileşimlerini destekleyen satış ve pazarlama botu.',
    content: [
      'Kuzeyboru A.Ş. için GetCody API kullanarak satış ve pazarlama süreçlerini otomatize eden bir bot geliştirdim.',
      'Sistem canlı olarak kullanılmaktadır ve veri odaklı müşteri etkileşimlerini desteklemektedir.',
    ],
    sector: 'Yapay zeka',
    tags: ['GetCody', 'Python', 'REST API'],
    imageUrl:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80',
    isFeatured: true,
    seoTitle: 'Sales Marketing Bot | GetCody entegrasyonu',
    seoDescription:
      'GetCody API ile satış ve pazarlama süreçlerini otomatize eden veri odaklı müşteri etkileşim botu.',
  },
  {
    title: 'Sınav Sistemi',
    slug: 'exam-system',
    description:
      'Yazılım ve mühendislik dersleri için güvenli değerlendirmeleri destekleyen bilgisayar tabanlı sınav sistemi.',
    content: [
      'MDKARE ~ SOFT için yazılım ve mühendislik derslerinde güvenli değerlendirmeleri destekleyecek şekilde tasarlanmış bilgisayar tabanlı bir sınav sistemi geliştirdim.',
      'Sistem online olarak kullanılmaktadır.',
    ],
    sector: 'Web uygulamaları',
    tags: ['Next.js', 'PostgreSQL', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
    isFeatured: true,
    seoTitle: 'Bilgisayar tabanlı sınav sistemi',
    seoDescription:
      'Yazılım ve mühendislik dersleri için güvenli online değerlendirme platformu.',
  },
  {
    title: 'Emlak ve İnşaat Web Sitesi',
    slug: 'real-estate-website',
    description:
      'Emlak ve müteahhit platformu için web sitesi tasarımı ve geliştirmesi.',
    content: [
      'MDKARE ~ SOFT için emlak ve müteahhit web platformu tasarlayıp geliştirdim.',
      'Detaylı proje dokümantasyonu GitHub üzerinde mevcuttur.',
    ],
    sector: 'Web uygulamaları',
    tags: ['Next.js', 'React', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'Emlak ve inşaat web platformu',
    seoDescription:
      'Emlak ve müteahhit firmaları için modern web sitesi tasarımı ve geliştirmesi.',
  },
  {
    title: 'Kişiselleştirilmiş QR Kod Sistemi',
    slug: 'personalized-qr-code-system',
    description:
      'Çalışanlar için kişiselleştirilmiş sayfalar ve tarama analitiği üreten QR kod sistemi.',
    content: [
      'Anadolu Mikronize A.Ş. için çalışan QR kodu sistemi geliştirdim.',
      'Her çalışan için kişiselleştirilmiş sayfalar oluşturulur ve tarama verileri analiz edilir.',
    ],
    sector: 'Kurumsal yazılım',
    tags: ['Next.js', 'PostgreSQL', 'REST API'],
    imageUrl:
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80',
    isFeatured: true,
    seoTitle: 'Kişiselleştirilmiş QR kod sistemi',
    seoDescription:
      'Çalışanlar için kişiselleştirilmiş sayfalar ve tarama analitiği sunan QR kod çözümü.',
  },
  {
    title: 'Personel Giriş-Çıkış Sistemi',
    slug: 'personnel-entry-exit-system',
    description:
      'ESP32 ve RFID cihazları kullanan, Next.js API ile iletişim kuran IoT tabanlı personel giriş-çıkış sistemi.',
    content: [
      'Anadolu Mikronize A.Ş. için ESP32 ve RFID cihazları kullanan IoT tabanlı personel giriş-çıkış sistemi geliştirdim.',
      'Gerçek zamanlı devam verileri Next.js tabanlı API üzerinden iletilir ve şirket veritabanında güvenli şekilde saklanır.',
    ],
    sector: 'IoT ve otomasyon',
    tags: ['ESP32', 'RFID', 'Next.js'],
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'IoT personel giriş-çıkış sistemi',
    seoDescription:
      'ESP32, RFID ve Next.js API ile gerçek zamanlı personel devam takibi.',
  },
  {
    title: 'Kurumsal Kaynak Planlaması (ERP)',
    slug: 'erp-system',
    description:
      'İnsan kaynakları ve dahili operasyonel süreçleri dijitalleştiren ERP sistemi.',
    content: [
      'Anadolu Mikronize A.Ş. için insan kaynakları ve dahili operasyonel süreçleri dijitalleştiren bir ERP sistemi geliştirdim.',
      'İş verilerini merkezileştirerek süreç kontrolü ve veri tutarlılığını artırdım.',
    ],
    sector: 'Kurumsal yazılım',
    tags: ['Django', 'PostgreSQL', 'REST API'],
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    isFeatured: true,
    seoTitle: 'Kurumsal ERP sistemi',
    seoDescription:
      'İnsan kaynakları ve operasyonel süreçleri dijitalleştiren özelleştirilmiş ERP çözümü.',
  },
  {
    title: 'Bina Yönetim Sistemi',
    slug: 'building-management-system',
    description:
      'Canlı demo erişimli bina yönetim sistemi tasarımı ve geliştirmesi.',
    content: [
      'MDKARE ~ SOFT için bina yönetim sistemi tasarlayıp geliştirdim.',
      'Kullanım dokümantasyonu, canlı demo erişimi ve genel sistem özeti mevcuttur.',
    ],
    sector: 'Web uygulamaları',
    tags: ['Next.js', 'PostgreSQL', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'Bina yönetim sistemi',
    seoDescription:
      'Site ve bina yönetimi için web tabanlı yönetim paneli ve canlı demo.',
  },
  {
    title: 'MIRELLO',
    slug: 'mirello',
    description:
      'Trello platformunu referans alan, eşdeğer temel özellikler sunan full-stack proje yönetim uygulaması.',
    content: [
      'Trello platformunu referans alarak MIRELLO adlı full-stack proje yönetim uygulaması geliştirdim.',
      "Eşdeğer temel özellikler sunar. Kaynak kodu ve tam proje dokümantasyonu GitHub'da mevcuttur.",
    ],
    sector: 'Web uygulamaları',
    tags: ['Next.js', 'PostgreSQL', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'MIRELLO — proje yönetim uygulaması',
    seoDescription:
      'Trello benzeri kanban ve görev yönetimi sunan full-stack proje yönetim uygulaması.',
  },
  {
    title: 'Danışman Performans Takip Sistemi',
    slug: 'consultant-performance-tracking',
    description:
      'Danışmanlık firması için günlük görev ve performans verilerini takip eden merkezi sistem.',
    content: [
      'Softanalytic danışmanlık firması için danışmanların günlük görevlerini ve performans verilerini takip eden merkezi bir sistem geliştirdim.',
      'Manuel raporlamayı azalttım ve yönetim ekiplerine ölçülebilir, veri odaklı karar desteği sağladım.',
    ],
    sector: 'Kurumsal yazılım',
    tags: ['Django', 'Vue.js', 'PostgreSQL'],
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'Danışman performans takip sistemi',
    seoDescription:
      'Danışmanlık ekipleri için görev ve performans verilerini merkezi olarak izleyen yazılım.',
  },
  {
    title: 'Çekirdek Bankacılık Yönetim Sistemi',
    slug: 'core-banking-system',
    description:
      'Hesap yönetimi, para transferi ve işlem takibini simüle eden uçtan uca bankacılık uygulaması.',
    content: [
      'MDKARE ~ SOFT için çekirdek mali operasyonları simüle eden uçtan uca bir bankacılık uygulaması geliştiriyorum.',
      'Hesap yönetimi, para transferleri ve işlem takibi içerir.',
    ],
    sector: 'Finans teknolojileri',
    tags: ['Next.js', 'PostgreSQL', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200&q=80',
    isFeatured: false,
    seoTitle: 'Çekirdek bankacılık yönetim sistemi',
    seoDescription:
      'Hesap yönetimi, transfer ve işlem takibi sunan uçtan uca bankacılık simülasyonu.',
  },
]

async function fetchProjectImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) })
  if (!res.ok) {
    throw new Error(`project seed: image fetch failed (${res.status})`)
  }
  const contentType =
    res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new Error(`project seed: not an image (${contentType})`)
  }
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType }
}

export async function seed() {
  const [projectCountRow] = await db
    .select({ n: count() })
    .from(project)
    .where(isNull(project.deletedAt))
  if ((projectCountRow?.n ?? 0) > 0) {
    console.log('Skip project seed: projects table is not empty')
    return
  }

  const [techCountRow] = await db
    .select({ n: count() })
    .from(projectTechnology)
    .where(isNull(projectTechnology.deletedAt))
  if ((techCountRow?.n ?? 0) === 0) {
    for (const [index, item] of TECH_SEED.entries()) {
      await db.insert(projectTechnology).values({
        name: item.name,
        description: item.description,
        sortOrder: index,
      })
    }
  }

  const [groupCountRow] = await db
    .select({ n: count() })
    .from(projectGroup)
    .where(isNull(projectGroup.deletedAt))
  if ((groupCountRow?.n ?? 0) === 0) {
    for (const [index, item] of GROUP_SEED.entries()) {
      await db.insert(projectGroup).values({
        name: item.name,
        description: item.description,
        sortOrder: index,
      })
    }
  }

  const techRows = await db
    .select({ id: projectTechnology.id, name: projectTechnology.name })
    .from(projectTechnology)
    .where(isNull(projectTechnology.deletedAt))
  const techIdByName = new Map(techRows.map((t) => [t.name, t.id]))

  const groupRows = await db
    .select({ id: projectGroup.id, name: projectGroup.name })
    .from(projectGroup)
    .where(isNull(projectGroup.deletedAt))
  const groupIdByName = new Map(groupRows.map((g) => [g.name, g.id]))

  for (const [index, item] of PROJECT_ROWS.entries()) {
    const groupId = groupIdByName.get(item.sector)
    if (!groupId) {
      throw new Error(`project seed: group not found (${item.sector})`)
    }

    const { buffer, contentType } = await fetchProjectImage(item.imageUrl)
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const uploaded = await uploadFile(
      buffer,
      `${item.slug}.${extension}`,
      contentType,
      {
        prefix: 'seed/project',
        isPublic: true,
        altText: `${item.title} kapak görseli`,
      }
    )

    const html = item.content.map((p) => `<p>${p}</p>`).join('')

    const [inserted] = await db
      .insert(project)
      .values({
        title: item.title,
        slug: item.slug,
        excerpt: item.description,
        content: {
          type: 'doc',
          version: 1,
          html,
          imageFileIds: [],
          videoFileIds: [],
        },
        groupId,
        fileId: uploaded.id,
        isPublished: true,
        isFeatured: item.isFeatured,
        publishedAt: new Date(),
        sortOrder: index,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        robotsIndex: true,
      })
      .returning({ id: project.id })

    if (!inserted) {
      throw new Error(`project seed: insert failed (${item.slug})`)
    }

    for (const tagName of item.tags) {
      const techId = techIdByName.get(tagName)
      if (!techId) {
        throw new Error(`project seed: technology not found (${tagName})`)
      }
      await db.insert(projectTechnologyLink).values({
        projectId: inserted.id,
        technologyId: techId,
      })
    }
    console.log(`  Seeded project: ${item.title}`)
  }
}
