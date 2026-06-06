import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '@/components/website/ui/section-title'
import type { WebsiteHomeHighlight } from '@/lib/data/website-home-highlights'
import { resolveHomeHighlightIcon } from '@/lib/website/home-highlight-icons'
import { sitePath } from '@/lib/website/site-nav'

type HomeHighlightsProps = {
  highlights: WebsiteHomeHighlight[]
}

export function HomeHighlights({ highlights }: HomeHighlightsProps) {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Neler Yapıyorum"
        subtitle="Uzmanlık alanlarım ve odak noktalarım"
        className="mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => {
          const Icon = resolveHomeHighlightIcon(item.iconKey)
          return (
            <div
              key={item.title}
              className="group bg-card rounded-xl border p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </div>
              <h3 className="font-heading text-foreground font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={sitePath('hakkimda')}
          className="text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
        >
          Hakkımda sayfasında daha fazlası
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
