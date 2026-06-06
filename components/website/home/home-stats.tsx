import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'

export function HomeStats() {
  return (
    <section className="border-y bg-muted/20 py-10 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {PORTFOLIO_CONFIG.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center text-center"
            >
              <span className="font-heading text-primary text-3xl font-bold md:text-4xl">
                {stat.value}
              </span>
              <span className="text-muted-foreground mt-1 text-sm font-medium md:text-base">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
