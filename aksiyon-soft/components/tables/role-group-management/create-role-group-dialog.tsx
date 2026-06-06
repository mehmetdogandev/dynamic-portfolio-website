'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RoleGroupForm, type RoleGroupFormValues } from './role-group-form'
import type { Role } from '@/lib/db/schema/rbac'
import { toast } from 'sonner'

interface CreateRoleGroupDialogProps {
  availableRoles: Role[]
  onSubmit: (data: RoleGroupFormValues) => Promise<void>
  trigger?: React.ReactNode
}

export function CreateRoleGroupDialog({
  availableRoles,
  onSubmit,
  trigger,
}: CreateRoleGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: RoleGroupFormValues) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      setOpen(false)
    } catch (_error) {
      toast.error('Failed to create role group')
      // Here you could show a toast notification
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Rol Grubu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className=" max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Rol Grubu Oluştur</DialogTitle>
          <DialogDescription>
            Birden fazla rolü bir araya getiren bir title/unvan oluşturun. Bu
            sayede kullanıcılara tek seferde birden çok rol atayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <RoleGroupForm
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Rol Grubu Oluştur"
        />
      </DialogContent>
    </Dialog>
  )
}
