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
import type { AdminSiteNavRow, SiteNavVariant } from './types'

export function DeleteSiteNavDialog({
  variant,
  row,
  open,
  onOpenChange,
}: {
  variant: SiteNavVariant
  row: AdminSiteNavRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const api = variant === 'header' ? trpc.headerNav : trpc.footerNav
  const { mutateAsync, isPending } = useMutation(
    api.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Menü öğesi silindi')
        await queryClient.invalidateQueries({ queryKey: api.list.queryKey() })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Menü öğesini sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{row.label}</strong> kaydını silmek istediğinizden emin
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
