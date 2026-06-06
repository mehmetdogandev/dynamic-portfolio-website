'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { JaponServiceRow } from './service-data-table'

export function DetailJaponServiceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponServiceRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {row.name}
            <Badge variant={row.isActive ? 'default' : 'secondary'}>
              {row.isActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Açıklama:</span>{' '}
            {row.description ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Oluşturulma:</span>{' '}
            {new Date(row.createdAt).toLocaleString('tr-TR')}
          </p>
        </div>
        <Button type="button" onClick={() => onOpenChange(false)}>
          Kapat
        </Button>
      </DialogContent>
    </Dialog>
  )
}
