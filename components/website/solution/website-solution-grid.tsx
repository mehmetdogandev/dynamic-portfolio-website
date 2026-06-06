import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SolutionCoverDotReveal } from '@/components/website/solution/solution-cover-dot-reveal'
import type { WebsiteSolution } from '@/lib/website/types'
import { sitePath } from '@/lib/website/site-nav'

export function WebsiteSolutionGrid({
  solutions,
}: {
  solutions: WebsiteSolution[]
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {solutions.map((solution) => (
        <Card
          key={solution.id}
          className="group border-border/80 overflow-hidden bg-card/95 shadow-sm transition-all hover:shadow-md"
        >
          <Link href={sitePath(`solution/${solution.slug}`)} className="block">
            <div className="border-border/50 relative aspect-video w-full overflow-hidden border-b">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]">
                <SolutionCoverDotReveal
                  src={solution.imageSrc}
                  alt={solution.coverImageAlt?.trim() || solution.title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={solution.imageSrc.startsWith('/api/files/')}
                  imageClassName="object-cover"
                />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                {solution.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {solution.description}
              </p>
              <div className="text-primary text-xs font-semibold tracking-wide uppercase">
                {solution.sector}
              </div>
              <div className="flex flex-wrap gap-2">
                {solution.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
}
