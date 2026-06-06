'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutTechnologyRow } from './types'

export function DetailTechnologyDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutTechnologyRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
          <DialogDescription>Hakkımda teknolojisi</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>Kategori: {row.category}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
