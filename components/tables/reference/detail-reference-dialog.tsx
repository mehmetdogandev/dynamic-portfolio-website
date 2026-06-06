'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { AdminReferenceRow } from './reference-data-table'

export function DetailReferenceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminReferenceRow
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {row.logoViewUrl ? (
            <div className="relative h-20 w-32">
              <Image
                src={row.logoViewUrl}
                alt=""
                fill
                unoptimized
                className="object-contain"
                sizes="128px"
              />
            </div>
          ) : null}
          <p>
            <span className="text-muted-foreground">Sektör:</span> {row.sector}
          </p>
          {row.description ? (
            <p>
              <span className="text-muted-foreground">Kısa açıklama:</span>{' '}
              {row.description}
            </p>
          ) : null}
          {row.summary ? (
            <p>
              <span className="text-muted-foreground">Özet:</span> {row.summary}
            </p>
          ) : null}
          {row.websiteUrl ? (
            <p>
              <span className="text-muted-foreground">Web:</span>{' '}
              <a
                href={row.websiteUrl}
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.websiteUrl}
              </a>
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
