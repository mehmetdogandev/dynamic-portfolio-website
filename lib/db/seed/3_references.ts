import { reference } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { count } from 'drizzle-orm'
import { uploadFile } from '@/lib/s3/utils'

/** S3 `uploadFile` uzantı + MIME eşleşmesi ister. */
function fileExtForImageContentType(contentType: string): string {
  const base = (contentType.split(';')[0] ?? '').trim().toLowerCase()
  if (base === 'image/png') return 'png'
  if (base === 'image/jpeg' || base === 'image/jpg') return 'jpg'
  if (base === 'image/webp') return 'webp'
  if (base === 'image/gif') return 'gif'
  if (base === 'image/x-icon' || base === 'image/vnd.microsoft.icon') {
    return 'ico'
  }
  return 'png'
}

const FAVICON = (host: string) => {
  const u = `https://${host}`
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(u)}&size=128`
}

type ReferenceSeedRow = {
  name: string
  sector: string
  description: string
  summary: string
  logoUrl?: string
  faviconHost?: string
  logoAlt: string
}

/** Kurum + rol özeti (description); summary = LinkedIn tarzı kurum açıklaması. */
const SEED_ROWS: ReferenceSeedRow[] = [
  {
    name: 'Anadolu Mikronize A.Ş.',
    sector: 'Madencilik ve mineral işleme',
    description: 'Anadolu Mikronize — Yazılım Destek Uzmanı',
    summary:
      "Türkiye'nin önde gelen mikronize mineral üreticilerinden biri olan Anadolu Mikronize'de ERP sistemi, kurumsal web altyapısı ve IoT tabanlı personel takip çözümleri geliştiriyorum. Dijital dönüşüm ve operasyonel verimlilik odaklı yazılım projeleri yürütüyorum.",
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQEHfXMFr2NONQ/company-logo_100_100/company-logo_100_100/0/1712250698120/anadolu_mikro_logo?e=1782345600&v=beta&t=-f178UUT3VMKfWF1ZJ-fH7csmf9F_unpWUruYtO6jWY',
    logoAlt: 'Anadolu Mikronize kurum logosu',
  },
  {
    name: "T3 AI'LE",
    sector: 'Yapay zeka ve yazılım geliştirme',
    description: "T3 AI'LE — Topluluk Üyesi (NLP araştırması)",
    summary:
      "Türkiye'nin büyük dil modeli ve agentic AI girişimlerini destekleyen T3AI topluluğunda doğal dil işleme modeli üzerinde araştırma yapıyorum. Veri toplama, ön işleme ve model geliştirme süreçlerine katkı sağlıyorum.",
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQFc0DENDm9-3w/company-logo_200_200/company-logo_200_200/0/1708694516541/t3aile_logo?e=2147483647&v=beta&t=TFjZIg4PXErJ79GFiHTfoydJEp3Jw2D71BwWTTHpK3g',
    logoAlt: "T3 AI'LE topluluk logosu",
  },
  {
    name: 'T3 Vakfı',
    sector: 'Teknoloji eğitimi ve sosyal sorumluluk',
    description: 'T3 Vakfı — Mentor Eğitmen (Deneyap)',
    summary:
      'Türkiye Teknoloji Takımı Vakfı; TEKNOFEST, Deneyap ve ulusal teknoloji hamlesi kapsamında gençlere teknoloji eğitimi sunan bir sivil toplum kuruluşudur. Deneyap merkezinde mentorluk ve teknik eğitim veriyorum.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/C4D0BAQGJZD3KpUFfJQ/company-logo_200_200/company-logo_200_200/0/1680025199327/t3_vakfi_logo?e=2147483647&v=beta&t=GrtFhCEeg6TWwKSK3bhS2Vnmdj-M4A8_2oWGu2-UR-g',
    logoAlt: 'T3 Vakfı kurum logosu',
  },
  {
    name: 'Gürman İnovasyon',
    sector: 'Mühendislik ve mobilite teknolojileri',
    description: 'Gürman İnovasyon — Yazılım Geliştirme Proje Lideri',
    summary:
      'Aksaray merkezli Gürman İnovasyon; MOGA elektrikli araç ve Hey MOGA yapay zeka projeleriyle mobilite alanında yenilikçi çözümler geliştirir. Proje lideri olarak araç veri dashboard ve AI entegrasyonları üzerinde çalıştım.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQEgMvaR2Nc8gw/company-logo_200_200/company-logo_200_200/0/1708367884327?e=2147483647&v=beta&t=w8-4NeX2GRVlhqoRUHemuVM7EUctHGrWwPvupm07ZK4',
    logoAlt: 'Gürman İnovasyon kurum logosu',
  },
  {
    name: 'ASÜ Teknoloji Atölyesi',
    sector: 'Üniversite teknoloji topluluğu',
    description: 'ASÜ Teknoloji Atölyesi — Kurucu Başkan',
    summary:
      "Aksaray Üniversitesi bünyesinde kurduğum teknoloji topluluğu; etkinlikler, workshop'lar ve proje organizasyonlarıyla öğrencilerin yazılım ve donanım becerilerini geliştirmeyi hedefler. Kurucu başkan ve denetim kurulu üyesi olarak görev yaptım.",
    faviconHost: 'aksaray.edu.tr',
    logoAlt: 'ASÜ Teknoloji Atölyesi logosu',
  },
  {
    name: 'Kuzeyboru A.Ş.',
    sector: 'Altyapı ve boru sistemleri',
    description: 'Kuzeyboru — Yazılım Mühendisi Stajyer',
    summary:
      'Kuzeyboru; altyapı ve süper yapı boru çözümlerinde global ölçekte üretim yapan bir markadır. İç yazılım sistemleri, web uygulamaları ve API geliştirme süreçlerinde staj ve tam zamanlı deneyim kazandım.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQFJB1rJqBgkuw/company-logo_200_200/B4DZ4hIcWHHoAE-/0/1778672322637/kuzeyboru_plastic_pipes_logo?e=2147483647&v=beta&t=Plhrwv_FFkhXGXUxyK3KxLmkCSqof-ryohvgle9jo0Y',
    logoAlt: 'Kuzeyboru kurum logosu',
  },
  {
    name: 'N2Mobile',
    sector: 'IoT ve mobil takip sistemleri',
    description: 'N2Mobile — Yazılım Mühendisi Stajyer',
    summary:
      'N2Mobil Takip Sistemleri; %100 yerli yazılım ve donanım ile araç takip, IoT ve akıllı teknoloji çözümleri sunar. Vue.js ve Django ile frontend/backend geliştirme stajı yaptım.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/C560BAQH0_aQxF7ZUFg/company-logo_200_200/company-logo_200_200/0/1630588652858/n2mobil_logo?e=2147483647&v=beta&t=Qkd-5NFGnoassFzfptMue8Q6nUv0jmOHOakECnZ0Jmk',
    logoAlt: 'N2Mobile kurum logosu',
  },
  {
    name: 'Özgelecek',
    sector: 'İnsan kaynakları teknolojileri',
    description: 'Özgelecek — Kariyer ve yetenek platformu',
    summary:
      'Özgelecek; geleneksel CV yerine kişilik, beceri ve motivasyon odaklı eşleştirme sunan bir işe alım ve kariyer platformudur. Teknoloji etkinlikleri ve kariyer vizyonu oturumlarına katıldım.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQHUHG_xdB-0dw/company-logo_200_200/company-logo_200_200/0/1720974204740/ozgelecek_logo?e=2147483647&v=beta&t=GGQ2qqEXTNORqsTweHidzVMtYE2VOTuDR7atvGJ0x4s',
    logoAlt: 'Özgelecek kurum logosu',
  },
  {
    name: 'Deneyap Türkiye',
    sector: 'Teknoloji eğitimi',
    description: 'Deneyap Türkiye — Yapay Zeka Eğitmeni',
    summary:
      'Deneyap Makers atölyeleri; gençleri yüksek teknoloji üretiminde yetiştirmeyi hedefleyen ulusal bir eğitim girişimidir. TÜBİTAK DENEYAP kapsamında ortaokul öğrencilerine yapay zeka ve Python dersleri verdim.',
    logoUrl:
      'https://media.licdn.com/dms/image/v2/D4D0BAQF237Z2KTTvjw/company-logo_200_200/company-logo_200_200/0/1721134885516?e=2147483647&v=beta&t=M2YNygbnujN15_MzP5m35qosEgc3l9MEpGzZI0q6IaE',
    logoAlt: 'Deneyap Türkiye kurum logosu',
  },
]

async function fetchLogo(
  row: ReferenceSeedRow
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const url = row.logoUrl ?? (row.faviconHost ? FAVICON(row.faviconHost) : null)
  if (!url) {
    throw new Error(`reference seed: no logo source for ${row.name}`)
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) })
  if (!res.ok) {
    throw new Error(
      `reference seed: failed to fetch logo ${row.name} (${res.status})`
    )
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  const ext = fileExtForImageContentType(contentType)
  const slug = row.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return { buffer, contentType, fileName: `logo-${slug}.${ext}` }
}

export async function seed() {
  const [row] = await db.select({ n: count() }).from(reference)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip reference seed: reference table is not empty')
    return
  }

  for (let i = 0; i < SEED_ROWS.length; i++) {
    const seedRow = SEED_ROWS[i]!
    const { buffer, contentType, fileName } = await fetchLogo(seedRow)
    const up = await uploadFile(buffer, fileName, contentType, {
      prefix: 'seed/references',
      isPublic: true,
      altText: seedRow.logoAlt,
    })
    await db.insert(reference).values({
      name: seedRow.name,
      sector: seedRow.sector,
      description: seedRow.description,
      summary: seedRow.summary,
      websiteUrl: null,
      logoId: up.id,
      logoAlt: seedRow.logoAlt,
      sortOrder: i,
    })
    console.log(`  Seeded reference: ${seedRow.name}`)
  }
}
