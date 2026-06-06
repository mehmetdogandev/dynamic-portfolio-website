import Image from 'next/image'
import { Shield, Wrench } from 'lucide-react'
import type { RadioMobilePublicPageMeta } from '@/lib/radio-mobile/public-page-meta'
import { cn } from '@/lib/utils'

export function RadioMobilePublicHero({
  meta,
  isReleaseChannel,
}: {
  meta: RadioMobilePublicPageMeta
  isReleaseChannel: boolean
}) {
  const TrustIcon = isReleaseChannel ? Shield : Wrench

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(220px,320px)] lg:gap-10">
      <div className="max-w-2xl">
        <p className="text-primary mb-1.5 text-sm font-medium tracking-wide">
          {meta.subtitle}
        </p>
        <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {meta.title}
        </h1>
        <div className="bg-primary mt-4 h-0.5 w-16 rounded-full" aria-hidden />
        <p className="text-foreground/80 mt-5 text-base leading-relaxed">
          {meta.description}
        </p>
        <p
          className={cn(
            'mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
            isReleaseChannel
              ? 'border-primary/25 bg-primary/5 text-foreground'
              : 'border-amber-500/30 bg-amber-500/10 text-foreground'
          )}
        >
          <TrustIcon className="size-4 shrink-0" aria-hidden />
          {meta.trustBadge}
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-xs lg:max-w-none">
        <div
          className="bg-primary/10 pointer-events-none absolute -inset-4 rounded-3xl blur-2xl"
          aria-hidden
        />
        <div className="border-border/70 bg-card/80 relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
          <Image
            src={meta.heroImageSrc}
            alt=""
            width={280}
            height={320}
            className="mx-auto h-auto w-full max-w-[220px] dark:opacity-90"
            priority
          />
          <div className="border-border/60 bg-background/90 absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm">
            <Image
              src="/logo.png"
              alt="Aksiyon Soft"
              width={24}
              height={24}
              className="size-6 rounded-sm object-contain"
            />
            <span className="text-foreground text-xs font-medium">
              Radio Mobil
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
