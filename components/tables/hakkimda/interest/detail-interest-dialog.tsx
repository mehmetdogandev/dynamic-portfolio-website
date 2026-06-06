'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutInterestRow } from './types'

export function DetailInterestDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutInterestRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.label}</DialogTitle>
          <DialogDescription>İlgi alanı</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
