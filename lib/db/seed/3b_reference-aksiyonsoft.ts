import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reference } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'

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

const AKSIYON_SOFT_NAME = 'Aksiyon Soft'

async function fetchLogo() {
  const url = FAVICON('www.aksiyonsoft.com')
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) })
  if (!res.ok) {
    throw new Error(
      `reference aksiyonsoft seed: failed to fetch logo (${res.status})`
    )
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  const ext = fileExtForImageContentType(contentType)
  return { buffer, contentType, fileName: `logo-aksiyon-soft.${ext}` }
}

export async function seed() {
  const existing = await db
    .select({ id: reference.id, sortOrder: reference.sortOrder })
    .from(reference)
    .where(eq(reference.name, AKSIYON_SOFT_NAME))
    .limit(1)
    .then((rows) => rows[0])

  if (existing) {
    console.log('Skip reference Aksiyon Soft upsert: already exists')
    return
  }

  const maxSort = await db
    .select({ sortOrder: reference.sortOrder })
    .from(reference)
    .orderBy(desc(reference.sortOrder))
    .limit(1)
    .then((rows) => rows[0]?.sortOrder ?? -1)

  const { buffer, contentType, fileName } = await fetchLogo()
  const up = await uploadFile(buffer, fileName, contentType, {
    prefix: 'seed/references',
    isPublic: true,
    altText: 'Aksiyon Soft kurum logosu',
  })

  await db.insert(reference).values({
    name: AKSIYON_SOFT_NAME,
    sector: 'Yazılım ve teknoloji',
    description: 'Kurucu Ortak ve CEO',
    summary:
      'Aksiyon Soft; kurumsal web uygulamaları, admin panelleri ve ölçeklenebilir yazılım altyapıları geliştiren teknoloji şirketi.',
    websiteUrl: 'https://www.aksiyonsoft.com',
    logoId: up.id,
    logoAlt: 'Aksiyon Soft kurum logosu',
    sortOrder: maxSort + 1,
  })

  console.log('  Upserted reference: Aksiyon Soft')
}
