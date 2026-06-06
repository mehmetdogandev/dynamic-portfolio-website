'use client'

import * as React from 'react'
import { useState } from 'react'
import { LoginForm } from './login-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import { AdminAuthShell } from '@/components/auth/admin-auth-shell'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const trpc = useTRPC()
  const { mutate: sendForgotPasswordEmail, isPending } = useMutation(
    trpc.user.sendForgotPasswordEmail.mutationOptions({
      onSuccess: () => {
        setDone(true)
        setMessage(null)
      },
      onError: (error) => {
        setMessage(error.message)
      },
    })
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Lütfen e-posta adresinizi girin.')
      return
    }
    setMessage(null)
    sendForgotPasswordEmail({ email: email.trim() })
  }

  return (
    <>
      {done ? (
        <p className="text-center text-sm text-muted-foreground">
          Kayıtlı adresinize şifre sıfırlama bağlantısı gönderildi. E-postanızı
          kontrol edin; gelen bağlantıyla yeni şifrenizi belirleyebilirsiniz.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kayıtlı e-posta adresinizi girin. Size şifre sıfırlama bağlantısı
            göndereceğiz.
          </p>

          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-posta</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="E-posta adresiniz"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setMessage(null)
              }}
              className="min-h-11"
            />
          </div>

          {message ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={!email.trim() || isPending}
          >
            {isPending ? 'Gönderiliyor…' : 'Bağlantı gönder'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={onBackToLogin}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Girişe dön
        </button>
      </p>
    </>
  )
}

interface LoginPageProps {
  showSignUpLink?: boolean
  onLoginSuccess?: () => void
}

export function LoginPage({
  showSignUpLink = true,
  onLoginSuccess,
}: LoginPageProps) {
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  const currentTitle = isForgotPassword
    ? 'Şifrenizi mi unuttunuz?'
    : 'Yönetim paneli'

  const currentSubtitle = isForgotPassword
    ? 'E-postanıza sıfırlama bağlantısı gönderilir.'
    : 'Hesabınıza e-posta ve şifre ile giriş yapın'

  const handleBackToLogin = () => setIsForgotPassword(false)

  const footerExtra =
    !isForgotPassword && showSignUpLink ? (
      <div className="mt-6 space-y-3 text-center text-sm">
        <p>
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Şifremi unuttum
          </button>
        </p>
      </div>
    ) : !isForgotPassword ? (
      <div className="mt-6 space-y-3 text-center text-sm">
        <p>
          <button
            type="button"
            onClick={() => setIsForgotPassword(true)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Şifremi unuttum
          </button>
        </p>
      </div>
    ) : undefined

  return (
    <AdminAuthShell
      title={currentTitle}
      subtitle={currentSubtitle}
      footerExtra={footerExtra}
    >
      {isForgotPassword ? (
        <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
      ) : (
        <LoginForm onSuccess={onLoginSuccess} />
      )}
    </AdminAuthShell>
  )
}

export default LoginPage
