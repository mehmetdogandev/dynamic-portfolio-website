'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminMediaGroupRow } from './media-group-data-table'

export function DetailMediaGroupDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminMediaGroupRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Üst grup:</span>{' '}
            {row.parentName ?? 'Yok (kök grup)'}
          </p>
          {row.description ? (
            <p>
              <span className="text-muted-foreground">Açıklama:</span>{' '}
              {row.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Kapat
        </Button>
      </DialogContent>
    </Dialog>
  )
}
