'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AdminSiteNavRow } from './types'

export function DetailSiteNavDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSiteNavRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Menü öğesi detayı</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Etiket</dt>
            <dd className="font-medium">{row.label}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Link</dt>
            <dd className="break-all font-medium">{row.href}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Aktif</dt>
            <dd>{row.isActive ? 'Evet' : 'Hayır'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Yeni sekmede aç</dt>
            <dd>{row.openInNewTab ? 'Evet' : 'Hayır'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sıra</dt>
            <dd>{row.sortOrder}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  )
}
