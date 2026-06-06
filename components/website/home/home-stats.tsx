import Link from 'next/link'
import type { WebsiteHomeStat } from '@/lib/data/website-home-stats'
import { cn } from '@/lib/utils'

type HomeStatsProps = {
  stats: WebsiteHomeStat[]
}

function StatBox({ stat }: { stat: WebsiteHomeStat }) {
  const content = (
    <>
      <span className="font-heading text-primary text-3xl font-bold md:text-4xl">
        {stat.value}
      </span>
      <span className="text-muted-foreground mt-1 text-sm font-medium md:text-base">
        {stat.label}
      </span>
    </>
  )

  if (stat.href?.trim()) {
    return (
      <Link
        href={stat.href}
        className={cn(
          'group flex flex-col items-center justify-center rounded-xl border border-transparent px-3 py-4 text-center transition-all',
          'hover:border-primary/30 hover:bg-card/60 hover:shadow-sm'
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {content}
    </div>
  )
}

export function HomeStats({ stats }: HomeStatsProps) {
  return (
    <section className="border-y bg-muted/20 py-10 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <StatBox key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
