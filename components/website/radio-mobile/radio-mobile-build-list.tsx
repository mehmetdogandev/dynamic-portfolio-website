import Link from 'next/link'
import { Download, Package, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PublicBuildRow } from '@/lib/radio-mobile/public-builds'
import { formatBuildMetaLine } from '@/lib/radio-mobile/public-build-utils'
import type { RadioMobilePublicPageMeta } from '@/lib/radio-mobile/public-page-meta'
import { sitePath } from '@/lib/website/site-nav'
import { cn } from '@/lib/utils'

export function RadioMobileBuildList({
  builds,
  meta,
  excludeBuildId,
}: {
  builds: PublicBuildRow[]
  meta: RadioMobilePublicPageMeta
  excludeBuildId?: string | null
}) {
  const list = excludeBuildId
    ? builds.filter((b) => b.id !== excludeBuildId)
    : builds

  if (list.length === 0 && !excludeBuildId && builds.length === 0) {
    return <RadioMobileBuildListEmpty />
  }

  if (list.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="all-builds-heading">
      <h2
        id="all-builds-heading"
        className="text-foreground mb-4 text-lg font-semibold tracking-tight"
      >
        {excludeBuildId ? 'Diğer sürümler' : 'Yayınlanan sürümler'}
      </h2>
      <ul className="space-y-3">
        {list.map((build) => (
          <li
            key={build.id}
            className={cn(
              'border-border/70 bg-card/60 flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between',
              build.isStable && 'border-primary/35 bg-muted/40'
            )}
          >
            <div className="flex gap-4">
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-lg',
                  build.isStable
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
                aria-hidden
              >
                <Package className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-lg font-semibold">
                    v{build.versionName}
                  </span>
                  {build.isStable ? (
                    <Badge variant="secondary">Stabil</Badge>
                  ) : null}
                </div>
                {build.displayName ? (
                  <p className="text-muted-foreground text-sm">
                    {build.displayName}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-sm">
                  {formatBuildMetaLine(build)}
                </p>
              </div>
            </div>
            <Button asChild variant={build.isStable ? 'default' : 'outline'}>
              <Link
                href={`/api/radio-mobile/download/${build.id}`}
                className="gap-2"
                aria-label={`İndir — v${build.versionName} (${meta.downloadAriaSuffix})`}
              >
                <Download className="size-4" aria-hidden />
                İndir
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RadioMobileBuildListEmpty() {
  return (
    <div className="border-border/70 bg-muted/30 flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
      <Smartphone
        className="text-muted-foreground mb-4 size-12 opacity-60"
        aria-hidden
      />
      <p className="text-foreground text-lg font-medium">
        Henüz yayında sürüm yok
      </p>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        Bu kanal için henüz herkese açık bir build yayınlanmadı. Kurumsal
        dağıtım için{' '}
        <Link
          href={sitePath('iletisim')}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          iletişim
        </Link>{' '}
        sayfamızdan bize ulaşabilirsiniz.
      </p>
    </div>
  )
}
