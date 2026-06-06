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
import type { AdminBlogRow } from './types'

export function DeleteBlogDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminBlogRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    trpc.blog.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Blog kaydı silindi')
        await queryClient.invalidateQueries({
          queryKey: trpc.blog.list.queryKey(),
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
          <AlertDialogTitle>Blog kaydını sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{row.title}</strong> kaydını silmek istediğinizden emin
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
