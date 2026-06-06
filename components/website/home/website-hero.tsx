'use client'

import type { SliderType } from '@/lib/website/slider-hero-type'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import { WebsiteHeroByType } from './hero-variants/website-hero-by-type'

export function WebsiteHero({
  slides,
  type,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  type: SliderType
  autoplayInterval: number | null
}) {
  return (
    <WebsiteHeroByType
      slides={slides}
      type={type}
      autoplayInterval={autoplayInterval}
    />
  )
}
