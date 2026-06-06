import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AdminDataSurfaceProps = {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
}

export function AdminDataSurface({
  children,
  className,
  padding = 'md',
}: AdminDataSurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
