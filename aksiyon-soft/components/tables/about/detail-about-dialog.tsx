'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutRow } from './types'

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function DetailAboutDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const plain = htmlToText(row.content.html)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
          <DialogDescription>/{row.slug}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            Durum: <strong>{row.isPublished ? 'YAYINDA' : 'TASLAK'}</strong>
          </p>
          <p className="text-sm">SEO Başlığı: {row.seoTitle?.trim() || '—'}</p>
          <p className="text-sm">
            SEO Açıklaması: {row.seoDescription?.trim() || '—'}
          </p>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">İçerik özeti</p>
            <p className="mt-1 text-sm">
              {plain.length > 450 ? `${plain.slice(0, 447)}...` : plain || '—'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
