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
import type { AdminReferenceRow } from './reference-data-table'

export function DeleteReferenceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminReferenceRow
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    trpc.reference.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Referans silindi')
        queryClient.invalidateQueries({
          queryKey: trpc.reference.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (e) => toast.error(e.message),
    })
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Referansı sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{row.name}</strong> kaydını silmek istediğinizden emin
            misiniz? (Veritabanında yumuşak silinir.)
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sil
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
