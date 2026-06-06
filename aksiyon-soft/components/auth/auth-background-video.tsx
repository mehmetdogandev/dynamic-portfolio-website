'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const BLACK = '/black-background.mp4'
const WHITE = '/white-background.mp4'

export function AuthBackgroundVideo({
  className,
  videoClassName,
}: {
  /** Dış sarmalayıcı (örn. absolute inset-0) */
  className?: string
  /** `<video>` öğesi — opacity, blend vb. */
  videoClassName?: string
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const src = mounted && resolvedTheme === 'light' ? WHITE : BLACK

  return (
    <div
      className={cn('pointer-events-none overflow-hidden', className)}
      aria-hidden
    >
      <video
        key={src}
        className={cn('h-full w-full object-cover', videoClassName)}
        autoPlay
        loop
        muted
        playsInline
        src={src}
      />
    </div>
  )
}
