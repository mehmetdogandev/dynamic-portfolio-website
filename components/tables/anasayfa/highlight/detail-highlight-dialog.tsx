'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  HOME_HIGHLIGHT_ICON_LABELS,
  type HomeHighlightIconKey,
} from '@/lib/website/home-highlight-icons'
import type { AdminHomeHighlightRow } from './types'

export function DetailHighlightDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminHomeHighlightRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const iconLabel =
    row.iconKey in HOME_HIGHLIGHT_ICON_LABELS
      ? HOME_HIGHLIGHT_ICON_LABELS[row.iconKey as HomeHighlightIconKey]
      : row.iconKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Açıklama</p>
            <p>{row.description}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">İkon</p>
            <p>{iconLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Sıra</p>
            <p>{row.sortOrder + 1}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
