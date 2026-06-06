'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { translateChangePasswordError } from '@/lib/utils'

type AccountPasswordPanelProps = {
  /** Called after successful password change (e.g. close dialog). */
  onSuccess?: () => void
}

export function AccountPasswordPanel({ onSuccess }: AccountPasswordPanelProps) {
  const trpc = useTRPC()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const changePasswordMutation = useMutation(
    trpc.auth.changePassword.mutationOptions({
      onSuccess: () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success('Şifreniz başarıyla güncellendi')
        onSuccess?.()
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Şifre değiştirilirken bir hata oluştu'
        toast.error(translateChangePasswordError(errorMessage))
      },
    })
  )

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Mevcut şifre
        </Label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Mevcut şifrenizi girin"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border-border/60 bg-background pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={
              showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
            }
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Yeni şifre
          </Label>
          <div className="relative">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Yeni şifrenizi girin"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-border/60 bg-background pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Yeni şifre tekrar
          </Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Yeni şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-border/60 bg-background pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Şifre en az 6 karakter olmalıdır. Güncelleme sonrası diğer oturumlar
          kapatılır.
        </p>
        <Button
          type="button"
          onClick={handlePasswordChange}
          disabled={changePasswordMutation.isPending}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {changePasswordMutation.isPending
            ? 'Değiştiriliyor…'
            : 'Şifreyi güncelle'}
        </Button>
      </div>
    </div>
  )
}
