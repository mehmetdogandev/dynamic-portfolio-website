'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function WebsiteShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      data-portfolio-site
      className={cn(
        'bg-background text-foreground relative flex min-h-dvh flex-col overflow-x-hidden',
        className
      )}
    >
      {children}
    </div>
  )
}
