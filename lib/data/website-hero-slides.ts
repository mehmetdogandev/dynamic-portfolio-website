import 'server-only'

import { and, asc, eq } from 'drizzle-orm'
import { getDbConnection } from '@/lib/db'
import { file, slider, sliderGroup } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import type { SliderType } from '@/lib/website/slider-hero-type'

/**
 * Home hero: the single `PUBLISHED` `slider_group` (if any), with ordered slides.
 * Design variant comes from that row's `type` (no `SITE_HERO_TYPE` or env).
 */
export async function getPublicHomeHeroData(): Promise<{
  slides: WebsiteHeroSlide[]
  type: SliderType
  autoplayInterval: number | null
}> {
  const db = getDbConnection()

  const [g] = await db
    .select({
      id: sliderGroup.id,
      type: sliderGroup.type,
      autoplayInterval: sliderGroup.autoplayInterval,
    })
    .from(sliderGroup)
    .where(
      and(eq(sliderGroup.status, 'PUBLISHED'), excludeDeleted(sliderGroup))
    )
    .orderBy(asc(sliderGroup.sortOrder), asc(sliderGroup.createdAt))
    .limit(1)

  if (!g) {
    return { slides: [], type: 'DEFAULT', autoplayInterval: null }
  }

  const rows = await db
    .select({
      id: slider.id,
      title: slider.title,
      subtitle: slider.subtitle,
      imageAlt: slider.imageAlt,
      fileId: slider.fileId,
      mimeType: file.mimeType,
      showPrimaryButton: slider.showPrimaryButton,
      showSecondaryButton: slider.showSecondaryButton,
      primaryLabel: slider.primaryLabel,
      primaryHref: slider.primaryHref,
      secondaryLabel: slider.secondaryLabel,
      secondaryHref: slider.secondaryHref,
    })
    .from(slider)
    .innerJoin(file, eq(slider.fileId, file.id))
    .where(
      and(
        eq(slider.groupId, g.id),
        excludeDeleted(slider),
        eq(file.isDeleted, false)
      )
    )
    .orderBy(asc(slider.sortOrder), asc(slider.createdAt))

  return {
    type: g.type,
    autoplayInterval: g.autoplayInterval,
    slides: rows.map(
      (r): WebsiteHeroSlide => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        imageAlt: r.imageAlt,
        mediaSrc: `/api/files/${r.fileId}/view`,
        mimeType: r.mimeType,
        showPrimaryButton: r.showPrimaryButton,
        showSecondaryButton: r.showSecondaryButton,
        primaryLabel: r.primaryLabel,
        primaryHref: r.primaryHref,
        secondaryLabel: r.secondaryLabel,
        secondaryHref: r.secondaryHref,
      })
    ),
  }
}
