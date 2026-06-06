'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Eye, EyeOff } from 'lucide-react'
import { AdminAuthShell } from '@/components/auth/admin-auth-shell'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

function ChangePasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }
    setIsPending(true)
    const result = await authClient.resetPassword({
      token,
      newPassword,
    })
    if (result.error) {
      setError(result.error.message ?? 'Şifre güncellenemedi')
      setIsPending(false)
    } else {
      setIsPending(false)
      router.push(ADMIN_PANEL_PATH)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="npw">Yeni şifre</Label>
        <div className="relative">
          <Input
            id="npw"
            type={show ? 'text' : 'password'}
            className="min-h-11 pr-10"
            value={newPassword}
            placeholder="Yeni şifrenizi girin"
            onChange={(e) => {
              setNewPassword(e.target.value)
              setError(null)
            }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="npc">Yeni şifre (tekrar)</Label>
        <Input
          id="npc"
          type={show ? 'text' : 'password'}
          className="min-h-11"
          value={confirmPassword}
          placeholder="Yeni şifrenizi tekrar girin"
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError(null)
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Şifre politikası sunucu tarafında doğrulanır (uzunluk ve karmaşıklık).
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
        {isPending ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
      </Button>
    </form>
  )
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <AdminAuthShell
        title="Bağlantı geçersiz"
        subtitle="Şifre sıfırlama için e-postadaki bağlantıyı kullanın"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Bu sayfaya doğrudan gidildi veya bağlantının süresi doldu.
          </p>
          <Button variant="outline" className="min-h-11 w-full" asChild>
            <Link href={ADMIN_PANEL_PATH}>Girise don</Link>
          </Button>
        </div>
      </AdminAuthShell>
    )
  }

  return (
    <AdminAuthShell
      title="Şifre sıfırlama"
      subtitle="Yeni şifrenizi belirleyin"
      footerExtra={
        <p className="mt-6 text-center text-sm">
          <Link
            href={ADMIN_PANEL_PATH}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Girise don
          </Link>
        </p>
      }
    >
      <ChangePasswordForm token={token} />
    </AdminAuthShell>
  )
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
          Yükleniyor…
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}
