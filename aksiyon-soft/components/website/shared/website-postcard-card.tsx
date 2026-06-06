import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'error' | 'neutral'

const strip: Record<Variant, string> = {
  success: 'bg-primary',
  error: 'bg-destructive',
  neutral: 'bg-muted-foreground/40',
}

export function WebsitePostcardCard({
  title,
  children,
  className,
  variant = 'neutral',
}: {
  title: string
  children: ReactNode
  className?: string
  variant?: Variant
}) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground border-border max-w-md overflow-hidden rounded-lg border shadow-md',
        className
      )}
    >
      <div className={cn('h-1 w-full', strip[variant])} aria-hidden />
      <div className="p-5 sm:p-6">
        <h3 className="text-foreground font-serif text-lg font-semibold">
          {title}
        </h3>
        <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
