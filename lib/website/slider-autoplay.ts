export const HERO_AUTOPLAY_DEFAULT_MS = 5000
export const HERO_AUTOPLAY_MIN_MS = 1000
export const HERO_AUTOPLAY_MAX_MS = 20000

export function normalizeAutoplayIntervalMs(
  value: number | null | undefined
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return HERO_AUTOPLAY_DEFAULT_MS
  }
  const rounded = Math.round(value)
  return Math.min(HERO_AUTOPLAY_MAX_MS, Math.max(HERO_AUTOPLAY_MIN_MS, rounded))
}
