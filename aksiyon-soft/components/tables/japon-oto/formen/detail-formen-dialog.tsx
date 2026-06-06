'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { JaponFormenRow } from './formen-data-table'

export function DetailJaponFormenDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponFormenRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const fullName = row.surname ? `${row.name} ${row.surname}` : row.name
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {fullName}
            <Badge variant={row.isActive ? 'default' : 'secondary'}>
              {row.isActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Telefon:</span>{' '}
            {row.phone ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Notlar:</span>{' '}
            {row.notes ?? '—'}
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
