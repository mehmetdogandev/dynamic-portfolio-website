'use client'

import { useMutation } from '@tanstack/react-query'
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
import type { BuildRow, RadioMobileRouterKey } from './types'
import { useChannelRouter } from './use-channel-router'
import { toast } from 'sonner'

export function DeleteBuildDialog({
  build,
  open,
  onOpenChange,
  routerKey,
  onSuccess,
}: {
  build: BuildRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  routerKey: RadioMobileRouterKey
  onSuccess: () => void
}) {
  const channelRouter = useChannelRouter(routerKey)
  const deleteMutation = useMutation(
    channelRouter.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Build silindi')
        onOpenChange(false)
        onSuccess()
      },
      onError: (e) => toast.error(e.message),
    })
  )

  if (!build) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Build silinsin mi?</AlertDialogTitle>
          <AlertDialogDescription>
            {build.versionName} ({build.displayName}) kalıcı olarak
            arşivlenecek.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id: build.id })}
            disabled={deleteMutation.isPending}
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
