'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserForm, EditUserFormValues } from './user-form'
import { useTRPC } from '@/lib/trpc/client'
import { invalidateAuthRbacQueries } from '@/lib/trpc/invalidate-auth-rbac'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useMemo } from 'react'

type UserWithRoles = {
  id: string
  name: string
  lastName: string
  email: string
  username: string | null
  createdAt: Date
  updatedAt: Date
  roles: Array<{
    id: string | null
    name: string | null
    scope: string | null
  }>
}

type Role = {
  id: string
  name?: string | null
  scope?: string | null
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithRoles
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
}: EditUserDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutateAsync: editUser, isPending: isLoading } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        toast.success('Kullanıcı başarıyla güncellendi')
        onOpenChange(false)
        // Invalidate both list and getById queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: trpc.user.list.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.user.getById.queryKey({ id: user.id }),
        })
        invalidateAuthRbacQueries(queryClient, trpc)
      },
      onError: (error) => {
        toast.error(error.message || 'Kullanıcı güncellenirken bir hata oluştu')
      },
    })
  )

  const { mutateAsync: setUserPassword, isPending: isSettingPassword } =
    useMutation(
      trpc.user.setUserPassword.mutationOptions({
        onSuccess: () => {
          toast.success('Şifre başarıyla güncellendi')
        },
        onError: (error) => {
          toast.error(error.message || 'Şifre güncellenirken bir hata oluştu')
        },
      })
    )
  // Fetch fresh user details (include direct/group role split) so the edit form
  // uses only direct roles when saving — this prevents re-assigning group-derived roles.
  const { data: userDetails } = useQuery({
    ...trpc.user.getById.queryOptions({ id: user.id }),
    enabled: !!user?.id,
  })

  const initialData = useMemo(() => {
    if (!user) return null
    // Get email from userDetails if available, otherwise fall back to email
    const email = (userDetails as { email?: string })?.email || user.email
    return {
      firstName: user.name,
      lastName: user.lastName,
      email,
      id: user.id,
      username: user.username || '',
      // Initialize roleIds with direct role assignments only, if available from
      // the fresh `user.getById` response; otherwise fall back to the provided `user.roles`.
      roleIds:
        // Safely extract direct role ids if the fetched shape includes them.
        (Array.isArray(
          (userDetails as unknown as { directRoles?: Role[] })?.directRoles
        )
          ? (userDetails as unknown as { directRoles?: Role[] })
              .directRoles!.filter((r) => !!r.id)
              .map((r) => r.id)
          : undefined) ||
        user.roles
          ?.filter((role) => role.id !== null)
          .map((role) => role.id!) ||
        [],
    }
  }, [user, userDetails])

  if (!user || !initialData) {
    return null
  }

  const handleSubmit = async (data: EditUserFormValues) => {
    const updateData = {
      id: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      // Use the form-provided roleIds — the form will be initialized with direct roles
      // (see initialData below). This prevents re-adding roles that are only granted
      // through role groups.
      roleIds: data.roleIds,
    }
    try {
      await editUser(updateData)

      // If password is provided and not empty, update it
      if (data.password && data.password.trim().length >= 6) {
        try {
          await setUserPassword({
            userId: user.id,
            newPassword: data.password.trim(),
          })
        } catch (passwordError) {
          // Password update error is already handled by the mutation's onError
          throw passwordError
        }
      }
    } catch (_error) {}
  }

  return (
    <Dialog key={user.id} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Kullanıcı Düzenle
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {user.name} {user.lastName} kullanıcısının bilgilerini düzenleyin
          </DialogDescription>
        </DialogHeader>

        <UserForm
          onSubmit={handleSubmit}
          isLoading={isLoading || isSettingPassword}
          submitLabel="Değişiklikleri Kaydet"
          initialData={initialData!}
          userId={user.id}
        />
      </DialogContent>
    </Dialog>
  )
}
