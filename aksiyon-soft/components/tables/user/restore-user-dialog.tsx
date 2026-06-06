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

interface RestoreUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    lastName: string
    email: string
  } | null
}

export function RestoreUserDialog({
  open,
  onOpenChange,
  user,
}: RestoreUserDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutateAsync: restoreUser, isPending: isLoading } = useMutation(
    trpc.user.restore.mutationOptions({
      onSuccess: () => {
        toast.success('Kullanıcı başarıyla geri alındı')
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() })
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Kullanıcı geri alınırken bir hata oluştu')
      },
    })
  )

  if (!user) return null

  const handleRestore = async () => {
    await restoreUser({ id: user.id })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kullanıcıyı Geri Al</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              <strong>
                {user.name} {user.lastName}
              </strong>{' '}
              kullanıcısını geri almak istediğinizden emin misiniz?
            </span>
            <span className="block text-sm text-muted-foreground">
              E-posta: {user.email}
            </span>
            <span className="block text-sm text-muted-foreground">
              Bu işlemle kullanıcı yeniden aktif hale gelecektir.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Geri Al
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
