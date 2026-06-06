'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AdminSolutionGroupRow } from './data-table'

export function DetailSolutionGroupDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSolutionGroupRow
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
            <span className="text-muted-foreground">Açıklama:</span>{' '}
            {row.description}
          </p>
        </div>
        <Button type="button" onClick={() => onOpenChange(false)}>
          Kapat
        </Button>
      </DialogContent>
    </Dialog>
  )
}
