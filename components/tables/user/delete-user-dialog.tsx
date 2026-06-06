'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    lastName: string
    email: string
    roles?: Array<{
      id: string
      name: string
    }>
  }
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutateAsync: deleteUser, isPending: isLoading } = useMutation(
    trpc.user.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Kullanıcı başarıyla silindi')
        queryClient.invalidateQueries({
          queryKey: trpc.user.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Kullanıcı silinirken bir hata oluştu')
      },
    })
  )

  // Don't render if user data is not available
  if (!user) {
    return null
  }

  const handleDelete = async () => {
    await deleteUser({ id: user.id })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kullanıcı Sil</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              <strong>
                {user.name} {user.lastName}
              </strong>{' '}
              kullanıcısını silmek istediğinizden emin misiniz?
            </span>

            <span className="block text-sm font-bold text-destructive">
              Bu işlem geri alınamaz!!!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row items-center justify-center">
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90 w-1/3"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sil
          </AlertDialogAction>
          <AlertDialogCancel disabled={isLoading} className="w-1/3">
            İptal
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
