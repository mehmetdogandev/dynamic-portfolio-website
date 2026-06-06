'use client'

import type { ComponentType } from 'react'
import type { SliderType } from '@/lib/website/slider-hero-type'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import { WebsiteHeroCinematic } from './website-hero-cinematic'
import { WebsiteHeroDefault } from './website-hero-default'
import { WebsiteHeroMinimalDots } from './website-hero-minimal-dots'
import { WebsiteHeroPeekCards } from './website-hero-peek-cards'
import { WebsiteHeroSplitLeft } from './website-hero-split-left'
import { WebsiteHeroSplitRight } from './website-hero-split-right'
import { WebsiteHeroStack } from './website-hero-stack'
import { WebsiteHeroThumbStrip } from './website-hero-thumb-strip'

const REGISTRY: Record<
  SliderType,
  ComponentType<{
    slides: WebsiteHeroSlide[]
    autoplayInterval?: number | null
  }>
> = {
  DEFAULT: WebsiteHeroDefault,
  SPLIT_LEFT: WebsiteHeroSplitLeft,
  SPLIT_RIGHT: WebsiteHeroSplitRight,
  THUMB_STRIP: WebsiteHeroThumbStrip,
  MINIMAL_DOTS: WebsiteHeroMinimalDots,
  CINEMATIC: WebsiteHeroCinematic,
  PEEK_CARDS: WebsiteHeroPeekCards,
  STACK: WebsiteHeroStack,
}

export function WebsiteHeroByType({
  slides,
  type,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  type: SliderType
  autoplayInterval: number | null
}) {
  const C = REGISTRY[type] ?? REGISTRY.DEFAULT
  return <C slides={slides} autoplayInterval={autoplayInterval} />
}
