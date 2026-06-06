import Link from 'next/link'
import { Download, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PublicBuildRow } from '@/lib/radio-mobile/public-builds'
import { formatBuildMetaLine } from '@/lib/radio-mobile/public-build-utils'
import type { RadioMobilePublicPageMeta } from '@/lib/radio-mobile/public-page-meta'

export function RadioMobileFeaturedBuild({
  build,
  meta,
}: {
  build: PublicBuildRow
  meta: RadioMobilePublicPageMeta
}) {
  return (
    <section
      aria-labelledby="featured-build-heading"
      className="border-primary/30 from-primary/5 via-card/90 to-card/90 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm sm:p-8"
    >
      <div
        className="bg-primary/10 pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p
            id="featured-build-heading"
            className="text-primary flex items-center gap-1.5 text-sm font-medium"
          >
            <Star className="size-4 fill-current" aria-hidden />
            {build.isStable ? 'Önerilen stabil sürüm' : 'En güncel sürüm'}
          </p>
          <p className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            v{build.versionName}
          </p>
          {build.displayName ? (
            <p className="text-muted-foreground text-sm">{build.displayName}</p>
          ) : null}
          <p className="text-muted-foreground text-sm">
            {formatBuildMetaLine(build)}
          </p>
          {build.isStable ? (
            <Badge variant="secondary" className="mt-1">
              Stabil
            </Badge>
          ) : null}
        </div>
        <Button asChild size="lg" className="shrink-0 gap-2">
          <Link
            href={`/api/radio-mobile/download/${build.id}`}
            aria-label={`İndir — v${build.versionName} (${meta.downloadAriaSuffix})`}
          >
            <Download className="size-4" aria-hidden />
            İndir
          </Link>
        </Button>
      </div>
    </section>
  )
}
