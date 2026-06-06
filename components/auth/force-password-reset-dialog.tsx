'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/client'
import { translateChangePasswordError } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
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

const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Şifre en az 6 karakter olmalıdır')
      .max(100, 'Şifre 100 karakterden az olmalıdır'),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  })

type PasswordResetFormData = z.infer<typeof passwordResetSchema>

interface ForcePasswordResetDialogProps {
  open: boolean
  loginEmail: string
  oldPassword: string
  onPasswordChanged: () => void
  onClose?: () => void
}

export function ForcePasswordResetDialog({
  open,
  loginEmail,
  oldPassword,
  onPasswordChanged,
  onClose,
}: ForcePasswordResetDialogProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] =
    React.useState(false)

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const changePasswordMutation = useMutation(
    trpc.auth.changePassword.mutationOptions({
      onSuccess: async () => {
        try {
          // Logout yap
          await authClient.signOut()

          // Yeni şifre ile tekrar giriş yap
          const result = await authClient.signIn.email({
            email: loginEmail.trim(),
            password: form.getValues('newPassword'),
          })

          if (!result.error) {
            toast.success('Şifreniz başarıyla değiştirildi')
            form.reset()
            onPasswordChanged()
            router.push(ADMIN_PANEL_PATH)
          } else {
            toast.error(
              result.error.message ||
                'Şifre değiştirildi ancak giriş yapılamadı. Lütfen tekrar giriş yapın.'
            )
            router.push(ADMIN_PANEL_PATH)
          }
        } catch (_error) {
          toast.error(
            'Şifre değiştirildi ancak giriş yapılamadı. Lütfen tekrar giriş yapın.'
          )
          router.push(ADMIN_PANEL_PATH)
        } finally {
          setIsChangingPassword(false)
        }
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Şifre değiştirilirken bir hata oluştu'
        const translatedMessage = translateChangePasswordError(errorMessage)
        toast.error(translatedMessage)
        setIsChangingPassword(false)
      },
    })
  )

  const onSubmit = async (data: PasswordResetFormData) => {
    if (
      data.newPassword.trim().toLowerCase() === loginEmail.trim().toLowerCase()
    ) {
      form.setError('newPassword', {
        type: 'manual',
        message: 'Yeni şifre e-posta adresiniz ile aynı olamaz',
      })
      return
    }

    setIsChangingPassword(true)

    changePasswordMutation.mutate({
      currentPassword: oldPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    })
  }

  const handleConfirmClose = () => {
    // Kullanıcı çıkış yapmayı onayladı
    setShowCloseConfirmDialog(false)
    if (onClose) {
      onClose()
    }
  }

  const handleCancelClose = () => {
    // Kullanıcı iptal etti, dialog açık kalacak
    setShowCloseConfirmDialog(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={false}
        confirmOnClose={false}
        onInteractOutside={(e) => {
          // Dialog'un kapanmasını engelle
          e.preventDefault()
          // AlertDialog zaten açıksa hiçbir şey yapma
          if (!showCloseConfirmDialog) {
            // AlertDialog'u aç
            setShowCloseConfirmDialog(true)
          }
        }}
        onEscapeKeyDown={(e) => {
          // Dialog'un kapanmasını engelle
          e.preventDefault()
          e.stopPropagation()
          // AlertDialog zaten açıksa hiçbir şey yapma
          if (showCloseConfirmDialog) {
            return
          }
          // AlertDialog'u aç
          setShowCloseConfirmDialog(true)
        }}
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold">
                  Şifre Değiştirme Zorunlu
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Güvenlik nedeniyle şifrenizi değiştirmeniz gerekmektedir
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCloseConfirmDialog(true)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Kapat</span>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              E-posta adresiniz ile şifreniz aynı olduğu için güvenlik nedeniyle
              şifrenizi değiştirmeniz zorunludur.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Eski Şifre (Disabled) */}
              <div className="space-y-2">
                <FormLabel className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  E-posta (girişte kullanılan)
                </FormLabel>
                <Input
                  type="text"
                  value={loginEmail}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Yeni Şifre */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Yeni Şifre
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Yeni şifrenizi girin"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          aria-label={
                            showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Yeni Şifre Tekrar */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Yeni Şifre Tekrar
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Yeni şifrenizi tekrar girin"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          aria-label={
                            showConfirmPassword
                              ? 'Şifreyi gizle'
                              : 'Şifreyi göster'
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isChangingPassword || changePasswordMutation.isPending
                  }
                >
                  {isChangingPassword || changePasswordMutation.isPending
                    ? 'Değiştiriliyor...'
                    : 'Şifreyi Değiştir'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>

      {/* Onay Dialog&apos;u - Dialog kapatılmaya çalışıldığında gösterilir */}
      <AlertDialog
        open={showCloseConfirmDialog}
        onOpenChange={(isOpen) => {
          // AlertDialog kapatılmaya çalışılırsa (ESC veya dışarı tıklama) iptal et
          if (!isOpen) {
            handleCancelClose()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Kapatmak İstediğinize Emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Şifre değiştirme işlemini tamamlamadan dialog&apos;u kapatırsanız,
              sistemden otomatik olarak çıkış yapılacaktır. Devam etmek istiyor
              musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Evet, Çıkış Yap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
