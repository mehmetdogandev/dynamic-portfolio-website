'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import type { AdminHomeStatSetRow } from './types'

export function DeleteStatSetDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminHomeStatSetRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    trpc.homeStatSet.delete.mutationOptions({
      onSuccess: () => {
        toast.success('İstatistik seti silindi')
        void queryClient.invalidateQueries({
          queryKey: trpc.homeStatSet.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>İstatistik setini sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{row.name}</strong> silinecek (geri alınabilir kayıt).
            {row.status === 'PUBLISHED'
              ? ' Yayındaki setler silinemez; önce yayından kaldırın.'
              : ' Devam etmek istiyor musunuz?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || row.status === 'PUBLISHED'}
            onClick={async () => {
              await mutateAsync({ id: row.id })
            }}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sil
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
