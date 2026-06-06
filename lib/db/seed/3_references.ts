import { reference } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { count } from 'drizzle-orm'
import { uploadFile } from '@/lib/s3/utils'

const FAVICON = (host: string) => {
  const u = `https://${host}`
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(u)}&size=128`
}

/** S3 `uploadFile` uzantı + MIME eşleşmesi ister; gstatic bazen JPEG, bazen PNG/ICO döner. */
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

/** Eski statik referans listesi ile aynı içerik (görseller MinIO’ya yüklenir). */
const SEED_ROWS: Array<{
  name: string
  sector: string
  description: string
  summary: string
  faviconHost: string
  logoAlt: string
}> = [
  {
    name: 'Anadolu Taşımacılık ve Depolama A.Ş.',
    sector: 'Lojistik ve tedarik zinciri',
    description: 'Operasyon paneli ve filo entegrasyonu.',
    summary:
      'Çok şubeli lojistik ağı için merkezi izleme, SLA raporları ve mobil saha uygulaması ile dijital operasyon.',
    faviconHost: 'dhl.com',
    logoAlt: 'Anadolu Taşımacılık lojistik ortaklık logosu',
  },
  {
    name: 'Ege Finans Yatırım Holding',
    sector: 'Finansal hizmetler',
    description: 'Uyumluluk odaklı raporlama.',
    summary:
      'Düzenleyici raporlama paketleri, onay zincirleri ve e-posta bildirimleri ile denetlenebilir süreçler.',
    faviconHost: 'jpmorgan.com',
    logoAlt: 'Ege Finans kurumsal finans referans logosu',
  },
  {
    name: 'Marmara Metal İşleme San. Tic.',
    sector: 'İmalat',
    description: 'Üretim ve kalite verilerinin dijitalleşmesi.',
    summary:
      'İş emri takibi, kalite kontrol formları ve ERP köprüleri ile sahadan üretime tek veri modeli.',
    faviconHost: 'siemens.com',
    logoAlt: 'Marmara Metal imalat sektörü iş ortağı amblemi',
  },
  {
    name: 'Karadeniz Enerji Dağıtım A.Ş.',
    sector: 'Enerji',
    description: 'Saha operasyonları ve iş emirleri.',
    summary:
      'Bakım planlama, varlık yönetimi ve acil müdahale koordinasyonu için rol tabanlı mobil iş akışları.',
    faviconHost: 'schneider-electric.com',
    logoAlt: 'Karadeniz Enerji dağıtım şirketi logosu',
  },
  {
    name: 'İstanbul Perakende Zinciri A.Ş.',
    sector: 'Perakende',
    description: 'Mağaza ve merkez entegrasyonu.',
    summary:
      'Stok uyarıları, kampanya yönetimi ve bölge müdürü panoları ile çok kanallı operasyon görünürlüğü.',
    faviconHost: 'carrefour.com',
    logoAlt: 'İstanbul Perakende zinciri marka logosu',
  },
  {
    name: 'Akdeniz Sağlık Teknolojileri Ltd. Şti.',
    sector: 'Sağlık teknolojisi',
    description: 'Güvenli veri ve erişim.',
    summary:
      'Hasta verisi sınıflandırması, denetim izi ve çok faktörlü erişim ile regülasyon uyumlu platform.',
    faviconHost: 'medtronic.com',
    logoAlt: 'Akdeniz Sağlık Teknolojileri sağlık IT logosu',
  },
  {
    name: 'Boğaziçi İnşaat ve Proje Yönetimi',
    sector: 'İnşaat',
    description: 'Şantiye ve sözleşme takibi.',
    summary:
      'Hakediş, alt yüklenici onayları ve belge arşivi tek çatı altında; yönetim kurulu özet raporları.',
    faviconHost: 'skanska.com',
    logoAlt: 'Boğaziçi İnşaat proje yönetimi referans işareti',
  },
  {
    name: 'Trakya Gıda İşletmeleri A.Ş.',
    sector: 'Gıda ve içecek',
    description: 'İzlenebilir tedarik.',
    summary:
      'Parti/lot takibi, tedarikçi denetim formları ve soğuk zincir uyarıları ile izlenebilirlik.',
    faviconHost: 'nestle.com',
    logoAlt: 'Trakya Gıda izlenebilir tedarik ortağı logosu',
  },
]

export async function seed() {
  const [row] = await db.select({ n: count() }).from(reference)
  if ((row?.n ?? 0) > 0) {
    console.log('Skip reference seed: reference table is not empty')
    return
  }

  for (let i = 0; i < SEED_ROWS.length; i++) {
    const seedRow = SEED_ROWS[i]!
    const url = FAVICON(seedRow.faviconHost)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(
        `reference seed: failed to fetch favicon ${seedRow.faviconHost} (${res.status})`
      )
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/png'
    const ext = fileExtForImageContentType(contentType)
    const up = await uploadFile(
      buf,
      `logo-${seedRow.faviconHost}.${ext}`,
      contentType,
      {
        prefix: 'seed/references',
        isPublic: true,
        altText: seedRow.logoAlt,
      }
    )
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
