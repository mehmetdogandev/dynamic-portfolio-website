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
import type { AdminMediaGroupRow } from './media-group-data-table'

export function DeleteMediaGroupDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminMediaGroupRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    trpc.mediaGroup.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Medya grubu silindi')
        queryClient.invalidateQueries({
          queryKey: trpc.mediaGroup.list.queryKey(),
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
          <AlertDialogTitle>Medya grubunu sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{row.name}</strong> kaydını silmek istediğinizden emin
            misiniz?
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
