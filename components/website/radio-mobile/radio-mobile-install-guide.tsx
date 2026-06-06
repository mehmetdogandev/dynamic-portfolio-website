import { ListChecks } from 'lucide-react'
import type { RadioMobilePublicPageMeta } from '@/lib/radio-mobile/public-page-meta'

export function RadioMobileInstallGuide({
  meta,
}: {
  meta: RadioMobilePublicPageMeta
}) {
  return (
    <aside className="border-border/70 bg-card/50 rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="text-primary size-5 shrink-0" aria-hidden />
        <h2 className="text-foreground text-sm font-semibold tracking-tight">
          Kurulum rehberi
        </h2>
      </div>
      <ol className="text-muted-foreground space-y-3 text-sm leading-relaxed">
        {meta.installSteps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              aria-hidden
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
