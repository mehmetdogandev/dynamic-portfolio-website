'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/index'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
)

Separator.displayName = 'Separator'

export { Separator }
