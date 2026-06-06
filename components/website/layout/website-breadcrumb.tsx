'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getSiteBreadcrumbItems } from '@/lib/website/site-breadcrumbs'
import { isWebsiteHome } from '@/lib/website/site-nav'
import { cn } from '@/lib/utils'

export function WebsiteBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()
  if (!pathname || isWebsiteHome(pathname)) return null

  const items = getSiteBreadcrumbItems(pathname)
  if (!items?.length) return null

  return (
    <nav
      aria-label="Sayfa konumu"
      className={cn(
        'border-border/50 bg-card/20 text-muted-foreground supports-[backdrop-filter]:bg-card/15 border-b text-sm backdrop-blur-md',
        className
      )}
    >
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-3 sm:px-6">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
            >
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 opacity-60"
                  aria-hidden
                />
              ) : null}
              {isLast || !item.href ? (
                <span
                  className="text-foreground font-medium"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-foreground hover:text-primary font-medium transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
