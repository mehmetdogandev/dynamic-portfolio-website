'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HERO_AUTOPLAY_DEFAULT_MS } from '@/lib/website/slider-autoplay'
import { sliderTypeLabel } from '@/lib/website/slider-hero-type'
import type { AdminSliderGroupRow } from './types'

export function DetailSliderGroupDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSliderGroupRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
        </DialogHeader>
        <div className="text-muted-foreground space-y-2 text-sm">
          <p>
            <span className="text-foreground font-medium">Tip:</span>{' '}
            {sliderTypeLabel(row.type)}
          </p>
          <p>
            <span className="text-foreground font-medium">Durum:</span>{' '}
            {row.status === 'DRAFT' ? 'Taslak' : 'Yayında'}
          </p>
          {row.description ? (
            <p>
              <span className="text-foreground font-medium">Açıklama:</span>{' '}
              {row.description}
            </p>
          ) : null}
          <p>
            <span className="text-foreground font-medium">
              Autoplay interval:
            </span>{' '}
            {row.autoplayInterval ?? HERO_AUTOPLAY_DEFAULT_MS} ms
          </p>
          <p>
            <span className="text-foreground font-medium">Slayt sayısı:</span>{' '}
            {row.slides.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
