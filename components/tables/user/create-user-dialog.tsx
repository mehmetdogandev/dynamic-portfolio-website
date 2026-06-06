'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  UserForm,
  CreateUserFormValues,
  EditUserFormValues,
  type UserFormRef,
} from '@/components/tables/user/user-form'
import { useTRPC } from '@/lib/trpc/client'
import { invalidateAuthRbacQueries } from '@/lib/trpc/invalidate-auth-rbac'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const userFormRef = useRef<UserFormRef>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  // Handle profile photo upload after user is created
  useEffect(() => {
    if (pendingUserId && userFormRef.current) {
      const uploadPhoto = async () => {
        try {
          await userFormRef.current!.uploadProfilePhoto(pendingUserId)
        } catch (error) {
          // Error is already handled in uploadProfilePhoto
          console.error('Profile photo upload failed:', error)
        } finally {
          setPendingUserId(null)
        }
      }
      uploadPhoto()
    }
  }, [pendingUserId])

  const createUserMutation = useMutation({
    ...trpc.user.create.mutationOptions(),
    onSuccess: async (data) => {
      const userId = data.id
      if (!userId) {
        toast.error('Kullanıcı oluşturuldu ancak ID alınamadı')
        return
      }

      if (userFormRef.current?.getProfilePhotoFile()) {
        setPendingUserId(userId)
      }

      toast.success('Kullanıcı başarıyla oluşturuldu')
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: trpc.user.list.queryKey(),
      })
      invalidateAuthRbacQueries(queryClient, trpc)
    },
    onError: (error) => {
      toast.error(error.message || 'Kullanıcı oluşturulurken bir hata oluştu')
    },
  })

  const handleSubmit = async (
    data: CreateUserFormValues | EditUserFormValues
  ): Promise<void> => {
    try {
      // Type guard: password is required for create mode
      if (
        !('password' in data) ||
        typeof data.password !== 'string' ||
        data.password.length === 0
      ) {
        toast.error('Şifre gereklidir')
        return
      }

      // Now TypeScript knows data has a required password field
      const createData: CreateUserFormValues = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        roleIds: data.roleIds,
      }

      await createUserMutation.mutateAsync(createData)
    } catch (_error) {
      // Error is already handled in onError callback
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir kullanıcı oluşturun ve rol atamalarını yapın
          </DialogDescription>
        </DialogHeader>

        <UserForm
          ref={userFormRef}
          onSubmit={handleSubmit}
          isLoading={createUserMutation.isPending}
          submitLabel="Kullanıcı Oluştur"
          isCreateMode={true}
        />
      </DialogContent>
    </Dialog>
  )
}
