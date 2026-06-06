'use client'

import { useScrollProgress } from '@/lib/hooks/use-scroll-progress'
import { cn } from '@/lib/utils'

export function WebsiteScrollProgress({ enabled }: { enabled: boolean }) {
  const { progress, progressPercent, hasScrollableContent } =
    useScrollProgress(enabled)

  if (!enabled) return null

  return (
    <div
      className={cn(
        'bg-muted/80 h-1 w-full overflow-hidden',
        !hasScrollableContent && 'hidden'
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPercent}
      aria-label="Sayfa ilerlemesi"
    >
      <div
        className="bg-primary h-full origin-left transition-[transform] duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
