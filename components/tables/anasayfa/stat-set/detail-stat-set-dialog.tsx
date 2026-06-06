'use client'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminHomeStatSetRow } from './types'

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
    { value: row.stat1Value, label: row.stat1Label },
    { value: row.stat2Value, label: row.stat2Label },
    { value: row.stat3Value, label: row.stat3Label },
    { value: row.stat4Value, label: row.stat4Label },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {row.name}
            <Badge variant={row.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {row.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-semibold">{stat.value}</span>
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
