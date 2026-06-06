import Link from 'next/link'
import { ArrowRight, Bot, Code2, Cpu, Database } from 'lucide-react'
import { SectionTitle } from '@/components/website/ui/section-title'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import { sitePath } from '@/lib/website/site-nav'

const ICONS = [Code2, Database, Cpu, Bot] as const

export function HomeHighlights() {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Neler Yapıyorum"
        subtitle="Uzmanlık alanlarım ve odak noktalarım"
        className="mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PORTFOLIO_CONFIG.highlights.map((item, index) => {
          const Icon = ICONS[index] ?? Code2
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
                {item.desc}
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
