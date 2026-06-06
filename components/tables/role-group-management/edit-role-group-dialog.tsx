'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RoleGroupForm, type RoleGroupFormValues } from './role-group-form'
import type { Role, RoleGroup } from '@/lib/db/schema/rbac'

interface EditRoleGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleGroup: RoleGroup & { roles?: { id: string }[] }
  availableRoles: Role[]
  onSubmit: (id: string, data: RoleGroupFormValues) => Promise<void>
}

export function EditRoleGroupDialog({
  open,
  onOpenChange,
  roleGroup,
  availableRoles,
  onSubmit,
}: EditRoleGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: RoleGroupFormValues) => {
    setIsLoading(true)
    try {
      await onSubmit(roleGroup.id, data)
      onOpenChange(false)
    } catch (_error) {
      // Here you could show a toast notification
    } finally {
      setIsLoading(false)
    }
  }

  const initialData = {
    id: roleGroup.id,
    title: roleGroup.title,
    description: roleGroup.description || undefined,
    roleIds: roleGroup.roles?.map((role) => role.id) || [],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-[100vw] sm:max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            Rol Grubu Düzenle
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-base">
            <strong>{roleGroup.title}</strong> rol grubunun bilgilerini ve
            içerdiği rolleri güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-hidden">
          <RoleGroupForm
            initialData={initialData}
            availableRoles={availableRoles}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Değişiklikleri Kaydet"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
