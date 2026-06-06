'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ExportConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isExporting?: boolean
  entityName?: string
}

export function ExportConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isExporting = false,
  entityName = 'veriler',
}: ExportConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Dışa Aktar
          </DialogTitle>
          <DialogDescription>
            {entityName} Excel dosyası olarak dışa aktarılacak. Devam etmek
            istiyor musunuz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={isExporting}>
            {isExporting ? 'Dışa Aktarılıyor...' : 'Dışa Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
