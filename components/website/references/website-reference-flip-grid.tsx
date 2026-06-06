'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { WebsiteReference } from '@/lib/website/types'

export function WebsiteReferenceFlipGrid({
  references,
}: {
  references: WebsiteReference[]
}) {
  const reduceMotion = useReducedMotion()
  const [openId, setOpenId] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState<Record<string, boolean>>({})
  const baseId = useId()

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {references.map((r, index) => {
        const expanded = openId === r.id
        const monogram = r.logoText ?? r.name.slice(0, 2).toUpperCase()
        const grad = r.monogramClass ?? 'from-primary to-primary/80'
        const showLogo = Boolean(r.logoSrc) && !logoFailed[r.id]
        const logoAlt = r.logoAlt?.trim() || `${r.name.trim()} firması logosu`

        return (
          <motion.article
            key={r.id}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.45,
              delay: reduceMotion ? 0 : index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="perspective-[1000px] relative"
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`${baseId}-${r.id}-panel`}
              id={`${baseId}-${r.id}-btn`}
              onClick={() => setOpenId(expanded ? null : r.id)}
              className={cn(
                'group border-border/70 relative w-full overflow-hidden rounded-2xl border bg-card text-left shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                'hover:shadow-xl',
                expanded && 'ring-ring ring-2'
              )}
            >
              <div
                className={cn(
                  'relative aspect-[4/3] w-full',
                  !reduceMotion &&
                    'transition-transform duration-500 ease-out sm:group-hover:-translate-y-1'
                )}
              >
                {/* Ön yüz */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  {showLogo && r.logoSrc ? (
                    <div className="relative size-20 shrink-0">
                      <Image
                        src={r.logoSrc}
                        alt={logoAlt}
                        fill
                        unoptimized
                        className="object-contain p-0.5"
                        sizes="80px"
                        onError={() =>
                          setLogoFailed((f) => ({ ...f, [r.id]: true }))
                        }
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-bold tracking-tight text-white shadow-inner',
                        grad
                      )}
                    >
                      {monogram}
                    </div>
                  )}
                  <div className="text-center">
                    <h2 className="text-foreground font-serif text-lg font-semibold leading-snug">
                      {r.name}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {r.sector}
                    </p>
                  </div>
                  <p className="text-muted-foreground/80 text-center text-xs sm:hidden">
                    Ayrıntı için dokunun
                  </p>
                </div>

                {/* Arkası / overlay bilgi */}
                <div
                  id={`${baseId}-${r.id}-panel`}
                  role="region"
                  aria-labelledby={`${baseId}-${r.id}-btn`}
                  className={cn(
                    'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/95 to-transparent p-6 pt-16 transition-opacity duration-300',
                    expanded
                      ? 'opacity-100'
                      : 'opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
                  )}
                >
                  <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                    İş ortaklığı
                  </p>
                  <p className="text-foreground mt-2 text-sm leading-relaxed font-medium">
                    {r.summary ?? r.description}
                  </p>
                  {r.websiteUrl ? (
                    <span className="text-muted-foreground mt-3 text-xs break-all">
                      {r.websiteUrl.replace(/^https?:\/\//, '')}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          </motion.article>
        )
      })}
    </div>
  )
}
