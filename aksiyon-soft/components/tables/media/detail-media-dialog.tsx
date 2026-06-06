'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminMediaRow } from './types'

export function DetailMediaDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminMediaRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {row.fileViewUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-md border">
              <Image
                src={row.fileViewUrl}
                alt={row.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}
          <p>
            <span className="text-muted-foreground">Grup:</span>{' '}
            {row.mediaGroupName ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Durum tipi:</span>{' '}
            {row.type}
          </p>
          <p>
            <span className="text-muted-foreground">Üst medya:</span>{' '}
            {row.parentMediaTitle ?? 'Yok'}
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
