'use client'

import Image from 'next/image'
import type { WebsitePublishedAboutBundle } from '@/lib/data/website-about'

function formatDate(dateStr: string | null) {
  if (!dateStr || dateStr === 'Devam') return 'Devam'
  const [year, month] = dateStr.split('-')
  const months: Record<string, string> = {
    '01': 'Oca',
    '02': 'Şub',
    '03': 'Mar',
    '04': 'Nis',
    '05': 'May',
    '06': 'Haz',
    '07': 'Tem',
    '08': 'Ağu',
    '09': 'Eyl',
    '10': 'Eki',
    '11': 'Kas',
    '12': 'Ara',
  }
  return `${months[month ?? ''] ?? month ?? '?'} ${year ?? ''}`
}

type Experience = WebsitePublishedAboutBundle['experiences'][number]

export function FishboneTimeline({
  experiences,
}: {
  experiences: Experience[]
}) {
  const sorted = [...experiences].sort((a, b) => {
    const dateA = !a.endDate || a.endDate === 'Devam' ? '9999-12' : a.endDate
    const dateB = !b.endDate || b.endDate === 'Devam' ? '9999-12' : b.endDate
    return dateB.localeCompare(dateA)
  })

  if (sorted.length === 0) return null

  return (
    <div className="relative w-full py-6">
      <div className="bg-primary/30 absolute top-1/2 right-0 left-0 z-0 h-0.5 -translate-y-1/2" />

      <div className="relative z-10 overflow-x-auto overflow-y-visible scroll-smooth pb-4 md:pb-6">
        <div className="flex min-w-max items-center justify-start gap-8 px-4 md:gap-12 md:px-8">
          {sorted.map((exp, i) => {
            const isTop = i % 2 === 0
            const imageSrc = exp.fileId ? `/api/files/${exp.fileId}/view` : null

            return (
              <div
                key={exp.id}
                className="flex shrink-0 flex-col items-center"
                style={{ width: 'min(300px, 80vw)' }}
              >
                {isTop ? (
                  <>
                    <div className="bg-card mb-2 w-full max-w-[260px] overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
                      {imageSrc ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={imageSrc}
                            alt={exp.company}
                            fill
                            className="object-cover"
                            sizes="260px"
                          />
                        </div>
                      ) : null}
                      <div className="p-3">
                        <span className="text-muted-foreground text-xs">
                          {formatDate(exp.startDate)} –{' '}
                          {formatDate(exp.endDate)}
                        </span>
                        <h3 className="font-heading text-foreground mt-1 font-semibold">
                          {exp.title}
                        </h3>
                        <p className="text-primary text-sm font-medium">
                          {exp.company}
                        </p>
                        {exp.location ? (
                          <p className="text-muted-foreground text-xs">
                            {exp.location}
                          </p>
                        ) : null}
                        {exp.description ? (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {exp.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="bg-primary/50 h-3 w-0.5" />
                  </>
                ) : null}

                <div className="border-primary bg-background size-3 shrink-0 rounded-full border-2" />

                {!isTop ? (
                  <>
                    <div className="bg-primary/50 mt-3 h-3 w-0.5" />
                    <div className="bg-card mt-2 w-full max-w-[260px] overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
                      {imageSrc ? (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={imageSrc}
                            alt={exp.company}
                            fill
                            className="object-cover"
                            sizes="260px"
                          />
                        </div>
                      ) : null}
                      <div className="p-3">
                        <span className="text-muted-foreground text-xs">
                          {formatDate(exp.startDate)} –{' '}
                          {formatDate(exp.endDate)}
                        </span>
                        <h3 className="font-heading text-foreground mt-1 font-semibold">
                          {exp.title}
                        </h3>
                        <p className="text-primary text-sm font-medium">
                          {exp.company}
                        </p>
                        {exp.location ? (
                          <p className="text-muted-foreground text-xs">
                            {exp.location}
                          </p>
                        ) : null}
                        {exp.description ? (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {exp.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
