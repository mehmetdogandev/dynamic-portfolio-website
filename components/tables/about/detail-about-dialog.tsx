'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminAboutProfileRow } from './types'

export function DetailAboutDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminAboutProfileRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row.lead}</DialogTitle>
          <DialogDescription>Hakkımda sayfa profili</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">SEO Başlığı: {row.seoTitle?.trim() || '—'}</p>
          <p className="text-sm">
            SEO Açıklaması: {row.seoDescription?.trim() || '—'}
          </p>
          <p className="text-sm">
            İndeks: {row.robotsIndex ? 'Açık' : 'Kapalı (noindex)'}
          </p>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">Giriş</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{row.intro}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
