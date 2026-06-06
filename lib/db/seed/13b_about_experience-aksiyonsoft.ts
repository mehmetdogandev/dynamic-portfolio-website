import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aboutExperience } from '@/lib/db/schema'
import { uploadFile } from '@/lib/s3/utils'
import { excludeDeleted } from '@/lib/db/utils'

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

const AKSIYON_SOFT_COMPANY = 'Aksiyon Soft'

async function fetchLogo() {
  const url = FAVICON('www.aksiyonsoft.com')
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) })
  if (!res.ok) {
    throw new Error(
      `about experience aksiyonsoft seed: failed to fetch logo (${res.status})`
    )
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  const ext = fileExtForImageContentType(contentType)
  return {
    buffer,
    contentType,
    fileName: `logo-aksiyon-soft-experience.${ext}`,
  }
}

export async function seed() {
  const existing = await db
    .select({ id: aboutExperience.id })
    .from(aboutExperience)
    .where(
      and(
        eq(aboutExperience.company, AKSIYON_SOFT_COMPANY),
        excludeDeleted(aboutExperience)
      )
    )
    .limit(1)
    .then((rows) => rows[0])

  if (existing) {
    console.log('Skip about experience Aksiyon Soft upsert: already exists')
    return
  }

  const { buffer, contentType, fileName } = await fetchLogo()
  const up = await uploadFile(buffer, fileName, contentType, {
    prefix: 'seed/about-experience',
    isPublic: true,
    altText: 'Aksiyon Soft kurum logosu',
  })

  await db.transaction(async (tx) => {
    await tx
      .update(aboutExperience)
      .set({ sortOrder: sql`${aboutExperience.sortOrder} + 1` })
      .where(excludeDeleted(aboutExperience))

    await tx.insert(aboutExperience).values({
      title: 'Kurucu Ortak ve CEO',
      company: AKSIYON_SOFT_COMPANY,
      location: 'Türkiye',
      startDate: '2026-05',
      endDate: 'Devam',
      description:
        'Aksiyon Soft bünyesinde kurumsal web uygulamaları, admin panelleri ve ölçeklenebilir yazılım altyapıları geliştirme.',
      fileId: up.id,
      sortOrder: 0,
    })
  })

  console.log('  Upserted about experience: Aksiyon Soft — Kurucu Ortak ve CEO')
}
