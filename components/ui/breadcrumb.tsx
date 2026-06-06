'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getBreadcrumbs } from '@/lib/breadcrumbs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useBreadcrumbLabelSafe } from '@/lib/contexts/breadcrumb-label-context'

export function Breadcrumb() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const breadcrumbContext = useBreadcrumbLabelSafe()

  // Stabilize labelOverrides to prevent infinite loops by serializing it
  const labelOverridesSerialized = useMemo(() => {
    return JSON.stringify(breadcrumbContext?.labelOverrides ?? {})
  }, [breadcrumbContext?.labelOverrides])

  const labelOverrides = useMemo(() => {
    try {
      return JSON.parse(labelOverridesSerialized) as Record<string, string>
    } catch {
      return {}
    }
  }, [labelOverridesSerialized])

  const uuidRegex = useMemo(
    () => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    []
  )

  const updatedBreadcrumbs = useMemo(() => {
    const filtered = breadcrumbs.filter((item, index, arr) => {
      return arr.findIndex((i) => i.href === item.href) === index
    })

    let result = filtered.map((item) => {
      const segments = item.href.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1]

      if (lastSegment && labelOverrides[lastSegment]) {
        return { ...item, label: labelOverrides[lastSegment] }
      }
      return item
    })

    const last = result[result.length - 1]
    if (
      result.length > 1 &&
      last &&
      uuidRegex.test(last.href.split('/').filter(Boolean).pop() ?? '')
    ) {
      const lastSegment = last.href.split('/').filter(Boolean).pop()
      if (lastSegment && !labelOverrides[lastSegment]) {
        result = result.slice(0, -1)
      }
    }

    return result
  }, [breadcrumbs, labelOverrides, uuidRegex])

  // Mobil için sadece mevcut sayfa başlığı
  const currentPage = updatedBreadcrumbs[updatedBreadcrumbs.length - 1]

  return (
    <TooltipProvider>
      {/* Mobil görünüm - sadece mevcut sayfa */}
      <div className="flex sm:hidden items-center space-x-2 h-full">
        {currentPage.icon && (
          <currentPage.icon className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <h1 className="text-lg font-semibold leading-none m-0">
          {currentPage.label}
        </h1>
      </div>

      {/* Desktop görünüm - tam breadcrumb */}
      {updatedBreadcrumbs.length <= 1 ? (
        // Sadece ana sayfa varsa
        <div className="hidden sm:flex items-center space-x-2 h-full">
          {currentPage.icon && (
            <currentPage.icon className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <h1 className="text-lg font-semibold leading-none m-0">
            {currentPage.label}
          </h1>
        </div>
      ) : (
        // Tam breadcrumb
        <div className="hidden sm:flex items-center space-x-1 text-sm h-full">
          {updatedBreadcrumbs.map((item, index) => {
            const isLast = index === updatedBreadcrumbs.length - 1
            const IconComponent = item.icon

            return (
              <div
                key={`${item.href}-${index}`}
                className="flex items-center space-x-1 h-full"
              >
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}

                <div className="flex items-center space-x-1">
                  {isLast ? (
                    // Son eleman - icon + text
                    <>
                      {IconComponent && (
                        <IconComponent className="h-4 w-4 text-foreground shrink-0" />
                      )}
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    // Ara elemanlarda icon + yazı (link)
                    <Link
                      href={item.href}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded-sm hover:bg-muted"
                    >
                      {IconComponent && (
                        <IconComponent className="h-4 w-4 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </TooltipProvider>
  )
}
