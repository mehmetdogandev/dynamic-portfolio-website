'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutExpertiseRow } from './types'

export function DetailExpertiseDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutExpertiseRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
          <DialogDescription>Uzmanlık alanı</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">Açıklama</p>
            <p className="mt-1 whitespace-pre-wrap">{row.description}</p>
          </div>
          {row.keywords.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                Anahtar kelimeler
              </p>
              <p>{row.keywords.join(', ')}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
