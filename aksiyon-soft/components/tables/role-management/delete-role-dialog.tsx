'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId: string
  roleName: string
  userCount?: number
  onSuccess?: () => void
  onDelete: (roleId: string) => Promise<void>
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  roleId,
  roleName,
  userCount = 0,
  onSuccess,
  onDelete,
}: DeleteRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDelete(roleId)
      onOpenChange(false)
      onSuccess?.()
    } catch (_error) {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 sm:p-6 max-h-[95vh]">
        <AlertDialogHeader className="pb-2 sm:pb-4">
          <AlertDialogTitle className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-lg sm:text-xl">
            <span>Rolü Sil</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-sm sm:text-base">
                <strong>{roleName}</strong> rolünü silmek istediğinizden emin
                misiniz?
              </div>
              {userCount > 0 && (
                <div className="text-destructive font-medium text-xs sm:text-sm">
                  ⚠️ Bu rol şu anda {userCount} kullanıcı tarafından
                  kullanılıyor. Rol silinirse bu kullanıcıların rol atamaları da
                  kaldırılacak.
                </div>
              )}
              <div className="text-xs text-center text-red-500 sm:text-sm">
                Bu işlem geri alınamaz!!!
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center justify-center flex-row gap-2 sm:gap-4">
          {' '}
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-8 text-xs sm:h-10 sm:px-6  text-white sm:text-sm"
          >
            {isLoading && (
              <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            )}
            Sil
          </AlertDialogAction>
          <AlertDialogCancel
            disabled={isLoading}
            className="h-9 px-6 text-xs sm:h-10 sm:px-6 sm:text-sm"
          >
            İptal
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
