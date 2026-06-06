import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit } from 'lucide-react'
import { type RoleFormData } from './types'
import { RoleForm } from './role-form'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId: string
  initialData?: Partial<RoleFormData> & { id?: string }
  onSuccess?: () => void
  onUpdate: (roleId: string, data: RoleFormData) => Promise<void>
}

export function EditRoleDialog({
  open,
  onOpenChange,
  roleId,
  initialData,
  onSuccess,
  onUpdate,
}: EditRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formInitialData, setFormInitialData] = useState<
    Partial<RoleFormData> | undefined
  >(initialData)
  const trpc = useTRPC()

  const { data: rawRole, isLoading: isLoadingRole } = useQuery({
    ...trpc.role.getById.queryOptions({ id: roleId }),
    enabled: open && !!roleId,
  })

  useEffect(() => {
    if (rawRole && typeof rawRole === 'object' && 'name' in rawRole) {
      const r = rawRole as Record<string, unknown>
      setFormInitialData({
        name: (r.name as string) || initialData?.name || '',
        scope:
          (r.scope as RoleFormData['scope']) ||
          initialData?.scope ||
          ('USER' as RoleFormData['scope']),
        permissions:
          (r.permissions as RoleFormData['permissions']) ||
          initialData?.permissions ||
          [],
      })
    } else if (initialData) {
      setFormInitialData(initialData)
    }
  }, [rawRole, initialData])

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true)
    try {
      await onUpdate(roleId, data)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-auto max-h-[95vh] p-0 w-full overflow-hidden">
        <div className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 shrink-0">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-lg sm:text-xl">
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Rol Düzenle</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {formInitialData?.name || 'Bu'} rolü ayarlarını güncelleyin.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 max-h-[calc(95vh-180px)] overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-4">
          {isLoadingRole ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-xs sm:text-sm">
                Rol bilgileri yükleniyor...
              </span>
            </div>
          ) : (
            <RoleForm
              initialData={formInitialData}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              submitLabel="Değişiklikleri Kaydet"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
