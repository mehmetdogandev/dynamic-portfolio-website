'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutExperienceRow } from './types'

export function DetailExperienceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutExperienceRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
          <DialogDescription>{row.company}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>Konum: {row.location?.trim() || '—'}</p>
          <p>
            Tarih: {row.startDate}
            {row.endDate ? ` – ${row.endDate}` : ''}
          </p>
          {row.fileViewUrl ? (
            <div className="flex items-center gap-3">
              <span>Logo:</span>
              <img
                src={row.fileViewUrl}
                alt={row.company}
                className="h-12 w-12 rounded border object-contain"
              />
            </div>
          ) : null}
          {row.description ? (
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Açıklama</p>
              <p className="mt-1 whitespace-pre-wrap">{row.description}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
