import { sliderTypeEnum } from '@/lib/db/schema'

export type SliderType = (typeof sliderTypeEnum.enumValues)[number]

/** Admin / UI: Turkish labels for slider_type enum. */
export const SLIDER_TYPE_LABELS: Record<SliderType, string> = {
  DEFAULT: 'Varsayılan (tam ekran)',
  SPLIT_LEFT: 'Bölünmüş: metin solda',
  SPLIT_RIGHT: 'Bölünmüş: metin sağda',
  THUMB_STRIP: 'Ana alan + alt küçük resim',
  MINIMAL_DOTS: 'Minimal merkez',
  CINEMATIC: 'Sinematik (koyu + ilerleme çubuğu)',
  PEEK_CARDS: 'Yan komşu görünür (peek)',
  STACK: 'Kart yığını (stack)',
}

export function sliderTypeLabel(t: SliderType): string {
  return SLIDER_TYPE_LABELS[t] ?? t
}
