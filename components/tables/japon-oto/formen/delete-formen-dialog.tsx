'use client'

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
import { useTRPC } from '@/lib/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { JaponFormenRow } from './formen-data-table'

export function DeleteJaponFormenDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponFormenRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const fullName = row.surname ? `${row.name} ${row.surname}` : row.name
  const { mutateAsync, isPending } = useMutation(
    trpc.japonFormen.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Formen silindi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonFormen.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Formeni sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{fullName}</strong> kaydını silmek istediğinizden emin
            misiniz? Bu formene atanan geçmiş servis kayıtları korunur, sadece
            formen bağlantısı kaldırılır.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={async () => {
              await mutateAsync({ id: row.id })
            }}
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
