'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SheetClose } from '@/components/ui/sheet'
import type { PublicNavLink } from '@/lib/data/website-nav'

export function WebsiteMobileNavLinks({
  pathname,
  navItems,
}: {
  pathname: string
  navItems: PublicNavLink[]
}) {
  return (
    <nav className="flex flex-col gap-1 py-2" aria-label="Mobil menü">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <SheetClose key={`${item.href}-${item.label}`} asChild>
            <Link
              href={item.href}
              target={item.openInNewTab ? '_blank' : undefined}
              rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
              className={cn(
                'hover:bg-muted/80 rounded-lg px-3 py-3 text-base font-medium tracking-tight transition-colors',
                active && 'bg-muted text-primary'
              )}
            >
              {item.label}
            </Link>
          </SheetClose>
        )
      })}
    </nav>
  )
}
