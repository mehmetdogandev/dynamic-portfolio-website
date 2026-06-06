'use client'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HOME_STAT_SOURCE_LABELS } from '@/lib/website/home-stat-config'
import type { AdminHomeStatSetRow } from './types'

function formatValue(
  row: AdminHomeStatSetRow,
  kind: 'experience' | 'company',
  value: string,
  label: string,
  href: string | null
) {
  const source =
    kind === 'experience'
      ? row.experienceCountSource
      : row.companyCountSource
  const sourceLabel =
    source !== 'MANUAL' ? HOME_STAT_SOURCE_LABELS[source] : null

  return {
    label,
    value: sourceLabel ? `${sourceLabel}` : value,
    href,
  }
}

export function DetailStatSetDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminHomeStatSetRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const stats = [
    {
      label: row.yearsExperienceLabel,
      value: row.yearsExperienceValue,
      href: row.yearsExperienceHref,
    },
    formatValue(
      row,
      'experience',
      row.experienceCountValue,
      row.experienceCountLabel,
      row.experienceCountHref
    ),
    formatValue(
      row,
      'company',
      row.companyCountValue,
      row.companyCountLabel,
      row.companyCountHref
    ),
    {
      label: row.studentsTaughtLabel,
      value: row.studentsTaughtValue,
      href: row.studentsTaughtHref,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {row.name}
            <Badge
              variant={row.status === 'PUBLISHED' ? 'default' : 'secondary'}
            >
              {row.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
              {stat.href ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  Bağlantı: {stat.href}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {row.publishedAt ? (
          <p className="text-muted-foreground text-xs">
            Yayın: {row.publishedAt.toLocaleString('tr-TR')}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
