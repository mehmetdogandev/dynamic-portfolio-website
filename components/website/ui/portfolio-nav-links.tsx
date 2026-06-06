'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { PublicNavLink } from '@/lib/data/website-nav'

export function PortfolioNavLinks({
  navItems,
  className,
  onLinkClick,
}: {
  navItems: PublicNavLink[]
  className?: string
  onLinkClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Ana menü"
    >
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/' && pathname?.startsWith(`${item.href}/`))
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
            onClick={onLinkClick}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
