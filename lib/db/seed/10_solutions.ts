import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  solution,
  solutionGroup,
  solutionTechnology,
  solutionTechnologyLink,
} from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'

const TECH_SEED: { name: string; description: string }[] = [
  {
    name: 'Next.js',
    description:
      'React tabanlı tam yığın web uygulamaları için üretim framework’ü.',
  },
  {
    name: 'PostgreSQL',
    description: 'İlişkisel veri, güvenilir işlemler ve genişletilebilir SQL.',
  },
  {
    name: 'tRPC',
    description:
      'Uçtan uca tip güvenli API katmanı ve sunucu–istemci sözleşmesi.',
  },
  {
    name: 'React',
    description: 'Bileşen tabanlı kullanıcı arayüzü ve zengin ekosistem.',
  },
  {
    name: 'API',
    description:
      'REST veya benzeri servis entegrasyonları ve sözleşme yönetimi.',
  },
  {
    name: 'MinIO',
    description: 'S3 uyumlu nesne depolama ve dosya yaşam döngüsü.',
  },
  {
    name: 'TypeScript',
    description: 'Statik tipleme ile sürdürülebilir ve güvenli kod tabanı.',
  },
  {
    name: 'S3',
    description: 'Bulut nesne depolama ve içerik dağıtımı.',
  },
  {
    name: 'RBAC',
    description: 'Rol tabanlı erişim kontrolü ve denetlenebilir yetkilendirme.',
  },
  {
    name: 'Workflow',
    description: 'İş akışı motoru, onay adımları ve SLA takibi.',
  },
  {
    name: 'Mobile',
    description: 'Saha ve mobil kullanıcı deneyimi odaklı arayüzler.',
  },
  {
    name: 'Dashboard',
    description: 'Operasyonel KPI ve yönetim panoları.',
  },
]

const GROUP_SEED: { name: string; description: string }[] = [
  {
    name: 'Lojistik ve operasyon',
    description:
      'Dağıtık ekipler, planlama ve operasyonel görünürlük çözümleri.',
  },
  {
    name: 'Raporlama ve analitik',
    description: 'KPI, özet raporlar ve karar destek görünümleri.',
  },
  {
    name: 'Doküman ve uyumluluk',
    description: 'Belge yaşam döngüsü, arşiv ve uyumluluk süreçleri.',
  },
  {
    name: 'Saha operasyonları',
    description: 'Saha görevleri, mobil ekipler ve anlık durum takibi.',
  },
]

type SolutionSeedRow = {
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

/** Öncelik sırası: satırdaki URL, sonra diğer stok görseller; en sonda picsum. */
const SOLUTION_IMAGE_FALLBACK_POOL: readonly string[] = [
  ...WEBSITE_IMAGES.solutionCovers,
  ...WEBSITE_IMAGES.gallery,
  'https://picsum.photos/1200/800',
]

function dedupeUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

/**
 * Uzak görsel indirilemezse havuzdaki diğer adresleri dener; boş kayıt bırakılmaz.
 */
async function fetchSolutionImageWithFallbacks(
  primaryUrl: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const candidates = dedupeUrls([primaryUrl, ...SOLUTION_IMAGE_FALLBACK_POOL])
  const errors: string[] = []
  for (const url of candidates) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45_000) })
      if (!response.ok) {
        errors.push(`${url} → HTTP ${response.status}`)
        continue
      }
      const contentType =
        response.headers.get('content-type')?.split(';')[0]?.trim() || ''
      if (!contentType.startsWith('image/')) {
        errors.push(`${url} → not an image (${contentType || 'unknown'})`)
        continue
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length < 64) {
        errors.push(`${url} → empty or trivial body`)
        continue
      }
      return { buffer, contentType }
    } catch (e) {
      errors.push(`${url} → ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  throw new Error(
    `solution seed: could not fetch any cover image. Attempts:\n${errors.join('\n')}`
  )
}

const SOLUTION_ROWS: SolutionSeedRow[] = [
  {
    title: 'Kurumsal operasyon platformu',
    slug: 'kurumsal-operasyon-platformu',
    description:
      'Dağıtık ekipler için rol tabanlı yönetim, iş akışları ve denetim izi.',
    content: [
      'Kurumsal operasyon platformu; birden fazla ekibin tek panelde görev, yetki ve operasyon takip süreçlerini yürütmesi için tasarlandı.',
      'Modüler yapı sayesinde farklı departmanlar için özelleştirilebilir formlar, raporlar ve onay akışları desteklenir.',
      'Audit trail ve erişim kontrolleri ile denetlenebilirlik standartları korunur.',
    ],
    sector: 'Lojistik ve operasyon',
    tags: ['Next.js', 'PostgreSQL', 'tRPC'],
    imageUrl: WEBSITE_IMAGES.solutionCovers[0]!,
    isFeatured: true,
    seoTitle: 'Kurumsal operasyon platformu | Aksiyon Soft çözümleri',
    seoDescription:
      'Dağıtık ekipler için rol tabanlı yönetim, iş akışları ve denetim izi sunan kurumsal yazılım örneği.',
  },
  {
    title: 'Entegre raporlama',
    slug: 'entegre-raporlama',
    description:
      'Operasyonel KPI panoları ve e-posta özetleri ile şeffaf iletişim.',
    content: [
      'Yönetim ekipleri için günlük ve haftalık KPI özetleri otomatik olarak hazırlanır.',
      'Operasyon ve finans verileri tek veri modelinde birleştirilerek karar süreçleri hızlandırılır.',
      'Bildirim altyapısı ile kritik eşiklerde ilgili kişilere otomatik duyuru iletilir.',
    ],
    sector: 'Raporlama ve analitik',
    tags: ['React', 'API', 'MinIO'],
    imageUrl: WEBSITE_IMAGES.solutionCovers[1]!,
    isFeatured: false,
    seoTitle: 'KPI ve entegre raporlama paneli çözümü',
    seoDescription:
      'Operasyonel KPI duvarları ve e-posta özetleriyle şeffaf iletişim; kurumsal analitik yazılımı.',
  },
  {
    title: 'Güvenli belge yönetimi',
    slug: 'guvenli-belge-yonetimi',
    description:
      'Sürümleme, güvenlik ve yedekleme ile kurumsal arşiv standardı.',
    content: [
      'Belgeler klasör, etiket ve erişim kuralı bazında yönetilir.',
      'Her dosya revizyonu kayıt altına alınır; geri dönüş senaryoları güvenli şekilde desteklenir.',
      'Yedekleme ve arşivleme politikaları ile veri sürekliliği sağlanır.',
    ],
    sector: 'Doküman ve uyumluluk',
    tags: ['TypeScript', 'S3', 'RBAC'],
    imageUrl: WEBSITE_IMAGES.solutionCovers[2]!,
    isFeatured: false,
    seoTitle: 'Güvenli belge yönetimi ve kurumsal arşiv',
    seoDescription:
      'Sürümleme, erişim kuralları ve yedekleme ile uyumluluğa uygun doküman yaşam döngüsü yazılımı.',
  },
  {
    title: 'Saha iş akışı sistemi',
    slug: 'saha-is-akisi-sistemi',
    description:
      'Mobil ekiplerin saha görevlerini planlayan ve canlı durum takibi sunan yapı.',
    content: [
      'Saha görevleri lokasyon, öncelik ve ekip yetkinliklerine göre planlanır.',
      'Görev ilerleyişi gerçek zamanlı olarak merkeze raporlanır.',
      'Yönetim panelinde SLA uyumu ve gecikme nedenleri analiz edilir.',
    ],
    sector: 'Saha operasyonları',
    tags: ['Workflow', 'Mobile', 'Dashboard'],
    imageUrl: WEBSITE_IMAGES.solutionCovers[3]!,
    isFeatured: false,
    seoTitle: 'Saha iş akışı ve mobil görev yönetimi',
    seoDescription:
      'Mobil ekiplerin görev planlaması ve canlı durum takibi; saha operasyonları için kurumsal uygulama.',
  },
  {
    title: 'API ve veri entegrasyon katmanı',
    slug: 'api-ve-veri-entegrasyon-katmani',
    description:
      'Kurumsal sistemler arası güvenli köprüler, olay tabanlı senkron ve izlenebilir veri akışı.',
    content: [
      'Kaynak ve hedef sistemler için net alan eşlemesi ve hata toparlanabilirliği tanımlanır.',
      'Kuyruk veya olay bus ile gevşek bağlı entegrasyonlar ölçeklenebilirlik sağlar.',
      'Her entegrasyon adımı için yapılandırılmış log ve yeniden deneme politikaları uygulanır.',
    ],
    sector: 'Raporlama ve analitik',
    tags: ['API', 'PostgreSQL', 'TypeScript'],
    imageUrl: WEBSITE_IMAGES.gallery[4]!,
    isFeatured: false,
    seoTitle: 'Kurumsal API ve veri entegrasyonu çözümü',
    seoDescription:
      'Özel yazılım çözümlerinde sistemler arası güvenli veri aktarımı ve entegrasyon katmanı özeti.',
  },
  {
    title: 'Kurumsal self-servis portal',
    slug: 'kurumsal-self-servis-portal',
    description:
      'Müşteri ve iş ortakları için talep, belge ve durum takibinin tek çatıda toplanması.',
    content: [
      'Rol tabanlı menüler ve formlar ile her kullanıcı sınıfına uygun deneyim sunulur.',
      'Bildirim ve durum güncellemeleri e-posta veya uygulama içi kanalla iletilebilir.',
      'Denetim için tüm kritik aksiyonlar zaman damgası ve kullanıcı bilgisiyle kayıt altına alınır.',
    ],
    sector: 'Doküman ve uyumluluk',
    tags: ['Next.js', 'RBAC', 'React'],
    imageUrl: WEBSITE_IMAGES.gallery[5]!,
    isFeatured: false,
    seoTitle: 'Kurumsal self-servis portal geliştirme',
    seoDescription:
      'B2B müşteri portalı, talep yönetimi ve güvenli oturum ile kurumsal dijital kanal örneği.',
  },
]

export async function seed() {
  const [solutionCountRow] = await db
    .select({ n: count() })
    .from(solution)
    .where(isNull(solution.deletedAt))
  if ((solutionCountRow?.n ?? 0) > 0) {
    console.log('Skip solution seed: solutions table is not empty')
    return
  }

  const [techCountRow] = await db
    .select({ n: count() })
    .from(solutionTechnology)
    .where(isNull(solutionTechnology.deletedAt))
  if ((techCountRow?.n ?? 0) === 0) {
    for (const [index, item] of TECH_SEED.entries()) {
      await db.insert(solutionTechnology).values({
        name: item.name,
        description: item.description,
        sortOrder: index,
      })
    }
  }

  const [groupCountRow] = await db
    .select({ n: count() })
    .from(solutionGroup)
    .where(isNull(solutionGroup.deletedAt))
  if ((groupCountRow?.n ?? 0) === 0) {
    for (const [index, item] of GROUP_SEED.entries()) {
      await db.insert(solutionGroup).values({
        name: item.name,
        description: item.description,
        sortOrder: index,
      })
    }
  }

  const techRows = await db
    .select({ id: solutionTechnology.id, name: solutionTechnology.name })
    .from(solutionTechnology)
    .where(isNull(solutionTechnology.deletedAt))
  const techIdByName = new Map(techRows.map((t) => [t.name, t.id]))

  const groupRows = await db
    .select({ id: solutionGroup.id, name: solutionGroup.name })
    .from(solutionGroup)
    .where(isNull(solutionGroup.deletedAt))
  const groupIdByName = new Map(groupRows.map((g) => [g.name, g.id]))

  for (const [index, item] of SOLUTION_ROWS.entries()) {
    const groupId = groupIdByName.get(item.sector)
    if (!groupId) {
      throw new Error(`solution seed: group not found (${item.sector})`)
    }

    const { buffer, contentType } = await fetchSolutionImageWithFallbacks(
      item.imageUrl
    )
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const uploaded = await uploadFile(
      buffer,
      `${item.slug}.${extension}`,
      contentType,
      {
        prefix: 'seed/solution',
        isPublic: true,
        altText: `${item.title} kapak görseli`,
      }
    )

    const html = item.content.map((p) => `<p>${p}</p>`).join('')

    const [inserted] = await db
      .insert(solution)
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
      .returning({ id: solution.id })

    if (!inserted) {
      throw new Error(`solution seed: insert failed (${item.slug})`)
    }

    for (const tagName of item.tags) {
      const techId = techIdByName.get(tagName)
      if (!techId) {
        throw new Error(`solution seed: technology not found (${tagName})`)
      }
      await db.insert(solutionTechnologyLink).values({
        solutionId: inserted.id,
        technologyId: techId,
      })
    }
  }
}
