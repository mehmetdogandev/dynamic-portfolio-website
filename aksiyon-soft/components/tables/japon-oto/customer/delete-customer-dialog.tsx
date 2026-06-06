'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { JaponCustomerRow } from './customer-data-table'

export function DeleteJaponCustomerDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
}: {
  row: JaponCustomerRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    try {
      setIsPending(true)
      await onConfirm()
    } finally {
      setIsPending(false)
    }
  }

  const fullName = `${row.name} ${row.surname}`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Müşteriyi sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{fullName}</strong> kaydını silmek istediğinizden emin
            misiniz?
            <br />
            {row.carCount > 0 ? (
              <>
                Bu müşteriye ait <strong>{row.carCount}</strong> araç ve
                ilişkili kayıtlar birlikte silinecektir.{' '}
              </>
            ) : null}
            Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleClick}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sil
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
