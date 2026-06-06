'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type RoleFormData } from './types'
import { RoleForm } from './role-form'

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onCreate: (data: RoleFormData) => Promise<void>
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSuccess,
  onCreate,
}: CreateRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true)
    try {
      await onCreate(data)
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
            <DialogTitle className="flex items-center justify-center space-x-1 sm:space-x-2 text-lg sm:text-xl">
              <span>Yeni Rol Oluştur</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-center">
              Sistem için yeni bir rol oluşturun. Kapsam ve izinleri belirleyin.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 max-h-[calc(95vh-180px)] overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-4">
          <RoleForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Rol Oluştur"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
