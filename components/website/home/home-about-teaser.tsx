import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { sitePath } from '@/lib/website/site-nav'

export function HomeAboutTeaser({ lead }: { lead: string }) {
  if (!lead.trim()) return null

  return (
    <section className="border-t bg-muted/10 pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-8 lg:pb-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-foreground text-2xl font-bold md:text-3xl">
            Yazılım benim için sadece bir meslek değil
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {lead}
          </p>
          <Link
            href={sitePath('hakkimda')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-colors"
          >
            Hakkımda
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
