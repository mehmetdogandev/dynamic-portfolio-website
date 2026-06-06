import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutExperience } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'

const FAVICON = (host: string) => {
  const u = `https://${host}`
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(u)}&size=128`
}

type ExperienceSeed = {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string | null
  description: string
  imageUrl?: string
  faviconHost?: string
  imageAlt?: string
}

/** referance/.../src/data/mock-experiences.ts */
const EXPERIENCE_ROWS: ExperienceSeed[] = [
  {
    title: 'Kurucu Ortak ve CEO',
    company: 'Aksiyon Soft',
    location: 'Türkiye',
    startDate: '2026-05',
    endDate: 'Devam',
    description:
      'Aksiyon Soft bünyesinde kurumsal web uygulamaları, admin panelleri ve ölçeklenebilir yazılım altyapıları geliştirme.',
    faviconHost: 'www.aksiyonsoft.com',
    imageAlt: 'Aksiyon Soft kurum logosu',
  },
  {
    title: 'Software Support Specialist',
    company: 'Anadolu Mikronize A.Ş.',
    location: 'Niğde, Türkiye',
    startDate: '2024-01',
    endDate: 'Devam',
    description:
      'ERP sistemi geliştirme ve şirket web sitesi altyapısı oluşturma. Dahili süreçleri verimlileştirme ve dijitalleştirme.',
    imageUrl:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80',
    imageAlt: 'ERP ve yazılım geliştirme',
  },
  {
    title: 'Software Engineer Intern',
    company: 'N2Mobile',
    location: 'Ankara, Türkiye',
    startDate: '2024-06',
    endDate: '2024-08',
    description:
      'Vue.js ve Django ile frontend/backend geliştirme. Yazılım geliştirme süreçlerinde pratik deneyim.',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
    imageAlt: 'Yazılım geliştirme',
  },
  {
    title: 'Software Engineer Intern',
    company: 'Kuzeyboru A.Ş.',
    location: 'Aksaray, Türkiye',
    startDate: '2023-09',
    endDate: '2024-09',
    description:
      "İç yazılım sistemlerini geliştirme ve sürdürme. Web uygulamaları, API'ler ve veritabanı sistemleri.",
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    imageAlt: 'Web uygulamaları ve API',
  },
  {
    title: 'Production Intern',
    company: 'Kuzeyboru A.Ş.',
    location: 'Aksaray, Türkiye',
    startDate: '2023-04',
    endDate: '2023-10',
    description:
      'Üretim veri takibi ve kalite standartları uyumu. Dahili yazılım için pratik çözümler.',
    imageUrl:
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80',
    imageAlt: 'Üretim ve veri takibi',
  },
  {
    title: 'Freelance Software Developer',
    company: 'MDKARE ~ SOFT',
    location: 'Aksaray, Türkiye',
    startDate: '2023-07',
    endDate: 'Devam',
    description:
      "Tam yığın web uygulamaları, backend API'leri ve veritabanı sistemleri. İhtiyaç analizi, geliştirme, dağıtım.",
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    imageAlt: 'Full-stack geliştirme',
  },
  {
    title: 'Mentor Instructor',
    company: 'T3 Vakfı',
    location: 'Aksaray, Türkiye',
    startDate: '2024-02',
    endDate: '2025-03',
    description:
      'Deneyap merkezinde teknik eğitim ve mentorluk. Genç bireylerin teknoloji alanında beceri geliştirmesine destek.',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
    imageAlt: 'Eğitim ve mentorluk',
  },
  {
    title: 'Volunteer',
    company: 'T3 Vakfı',
    location: 'Aksaray, Türkiye',
    startDate: '2024-01',
    endDate: '2025-01',
    description:
      'T3 Vakfı projelerinde gönüllü destek. Teknoloji ve yenilik odaklı topluluk faaliyetleri.',
    imageUrl:
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80',
    imageAlt: 'Gönüllü çalışma',
  },
  {
    title: 'Community Member',
    company: "T3 AI'LE",
    location: 'İstanbul, Türkiye',
    startDate: '2024-05',
    endDate: 'Devam',
    description:
      'Doğal dil işleme modeli üzerinde yapay zeka araştırması. Veri toplama ve ön işleme faaliyetleri.',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
    imageAlt: 'Yapay zeka araştırması',
  },
  {
    title: 'Software Development Project Leader',
    company: 'Gürman İnovasyon',
    location: 'Aksaray, Türkiye',
    startDate: '2024-01',
    endDate: '2024-11',
    description:
      'MOGA elektrikli araç projesi. Hey MOGA yapay zeka projesi ve araç veri dashboard geliştirme.',
    imageUrl:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80',
    imageAlt: 'Proje liderliği',
  },
  {
    title: 'Supervisory Board Member',
    company: 'ASÜ Teknoloji Atölyesi',
    location: 'Aksaray, Türkiye',
    startDate: '2023-12',
    endDate: '2024-10',
    description:
      'Teknoloji Atölyesi Topluluğu denetim kurulu üyesi. Teknoloji etkinlikleri ve proje organizasyonu.',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
    imageAlt: 'Teknoloji topluluğu',
  },
  {
    title: 'Community Presidency',
    company: 'ASÜ Teknoloji Atölyesi',
    location: 'Aksaray, Türkiye',
    startDate: '2022-10',
    endDate: '2023-11',
    description:
      "ASÜ Teknoloji Atölyesi'nin kurucu başkanı. Üniversitede teknoloji odaklı topluluk kurma ve yönetme.",
    imageUrl:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=80',
    imageAlt: 'Topluluk başkanlığı',
  },
  {
    title: 'Artificial Intelligence Course Instructor',
    company: 'TÜBİTAK - DENEYAP',
    location: 'Aksaray, Türkiye',
    startDate: '2023-10',
    endDate: '2024-01',
    description:
      'Ortaokul öğrencilerine yapay zeka dersi. Python programlama ve model eğitimi.',
    imageUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
    imageAlt: 'Yapay zeka eğitimi',
  },
  {
    title: 'undergraduate education, Software Engineering',
    company: 'Aksaray Üniversitesi',
    location: 'Aksaray, Türkiye',
    startDate: '2022-09',
    endDate: '2026-06',
    description: 'Yazılım Mühendisliği lisans eğitimi. GPA: 3.11',
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80',
    imageAlt: 'Üniversite eğitimi',
  },
]

export async function seed() {
  const [row] = await db
    .select({ n: count() })
    .from(aboutExperience)
    .where(isNull(aboutExperience.deletedAt))
  if ((row?.n ?? 0) > 0) {
    console.log('Skip about experience seed: table is not empty')
    return
  }

  for (const [index, item] of EXPERIENCE_ROWS.entries()) {
    let fileId: string | null = null
    const imageUrl =
      item.imageUrl ?? (item.faviconHost ? FAVICON(item.faviconHost) : null)
    if (imageUrl) {
      const res = await fetch(imageUrl, {
        signal: AbortSignal.timeout(45_000),
      })
      if (!res.ok) {
        throw new Error(
          `about experience seed: image fetch failed (${item.company}, ${res.status})`
        )
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.includes('png') ? 'png' : 'jpg'
      const slug = `${item.company}-${item.title}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 80)
      const uploaded = await uploadFile(buffer, `${slug}.${ext}`, contentType, {
        prefix: 'seed/about-experience',
        isPublic: true,
        altText: item.imageAlt ?? item.title,
      })
      fileId = uploaded.id
    }

    await db.insert(aboutExperience).values({
      title: item.title,
      company: item.company,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      fileId,
      sortOrder: index,
    })
    console.log(`  Seeded about experience: ${item.company} — ${item.title}`)
  }
}
