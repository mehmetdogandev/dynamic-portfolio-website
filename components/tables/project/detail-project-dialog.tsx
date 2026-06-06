'use client'

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AdminSolutionRow } from './types'

export function DetailSolutionDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSolutionRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {row.fileViewUrl ? (
            <div className="border-border relative aspect-video w-full overflow-hidden rounded-lg border">
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
            <span className="text-muted-foreground">Slug:</span> {row.slug}
          </p>
          <p>
            <span className="text-muted-foreground">Grup:</span>{' '}
            {row.groupName ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Teknolojiler:</span>{' '}
            {row.technologyNames.length > 0
              ? row.technologyNames.join(', ')
              : '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Durum:</span>{' '}
            {row.isPublished ? 'Yayında' : 'Taslak'}
          </p>
          <p>
            <span className="text-muted-foreground">Özet:</span>{' '}
            {row.excerpt ?? '—'}
          </p>
          <div className="space-y-1.5">
            <p className="text-muted-foreground">İçerik:</p>
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-3"
              dangerouslySetInnerHTML={{ __html: row.content.html }}
            />
          </div>
        </div>
        <Button type="button" onClick={() => onOpenChange(false)}>
          Kapat
        </Button>
      </DialogContent>
    </Dialog>
  )
}
