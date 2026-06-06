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
import { Loader2, AlertTriangle } from 'lucide-react'
import type { RoleGroup } from '@/lib/db/schema/rbac'

interface DeleteRoleGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleGroup: RoleGroup & { userCount?: number; roleCount?: number }
  onConfirm: (id: string) => Promise<void>
}

export function DeleteRoleGroupDialog({
  open,
  onOpenChange,
  roleGroup,
  onConfirm,
}: DeleteRoleGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(roleGroup.id)
      onOpenChange(false)
    } catch (_error) {
      // Here you could show a toast notification
    } finally {
      setIsLoading(false)
    }
  }

  const hasUsers = (roleGroup.userCount || 0) > 0
  const hasRoles = (roleGroup.roleCount || 0) > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive dark:text-destructive-foreground" />
            <span>Rol Grubu Sil</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild className="text-center">
            <div className="space-y-4">
              <p>
                <strong>{roleGroup.title}</strong> rol grubunu silmek
                istediğinizden emin misiniz?
              </p>

              {roleGroup.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Açıklama:</strong> {roleGroup.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 sm:p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {roleGroup.roleCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Rol</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {roleGroup.userCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Kullanıcı</div>
                </div>
              </div>

              {hasUsers && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Uyarı:</strong> Bu rol grubuna atanmış{' '}
                      {roleGroup.userCount} kullanıcı var. Rol grubu
                      silindiğinde bu kullanıcılar bu gruptan çıkarılacak.
                    </p>
                  </div>
                </div>
              )}

              {hasRoles && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Bu rol grubundaki{' '}
                    {roleGroup.roleCount} rol silinmeyecek, sadece grup ilişkisi
                    kaldırılacak.
                  </p>
                </div>
              )}

              <p className="text-sm text-destructive font-medium">
                Bu işlem geri alınamaz!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center justify-center flex-row gap-2 sm:gap-4">
          <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rol Grubunu Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
