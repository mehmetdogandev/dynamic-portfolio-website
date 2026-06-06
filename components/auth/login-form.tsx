'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/client'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

const loginSchema = z.object({
  email: z.email('Geçerli bir e-posta adresi giriniz'),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre 100 karakterden az olmalıdır'),
  rememberMe: z.boolean(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = loginSchema.safeParse({ email, password, rememberMe })
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg =
        first.email?.[0] ?? first.password?.[0] ?? 'Bilgilerinizi kontrol edin'
      setErrorMessage(msg)
      return
    }
    const data: LoginFormData = parsed.data

    try {
      setIsPending(true)
      setErrorMessage(null)

      const result = await authClient.signIn.email({
        email: data.email.trim(),
        password: data.password,
      })

      if (!result.error) {
        if (data.email.trim().toLowerCase() === data.password.toLowerCase()) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('forcePasswordReset', 'true')
            localStorage.setItem('forcePasswordResetEmail', data.email.trim())
            localStorage.setItem('forcePasswordResetOldPassword', data.password)
          }
        }

        onSuccess?.()
        await queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        })
        router.push(ADMIN_PANEL_PATH)
      } else {
        const msg = result.error.message?.toLowerCase() ?? ''
        const st = result.error.status
        if (
          st === 401 ||
          msg.includes('invalid') ||
          msg.includes('password') ||
          msg.includes('credential')
        ) {
          setErrorMessage('Şifre hatalı. Lütfen şifrenizi kontrol edin.')
        } else if (msg.includes('not found') || msg.includes('user')) {
          setErrorMessage(
            'Kullanıcı bulunamadı. E-posta adresinizi kontrol edin.'
          )
        } else {
          setErrorMessage(
            result.error.message ||
              'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
          )
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)

      if (
        errMsg.includes('Invalid password') ||
        errMsg.includes('incorrect password')
      ) {
        setErrorMessage('Şifre hatalı. Lütfen şifrenizi kontrol edin.')
      } else if (
        errMsg.includes('User not found') ||
        errMsg.includes('user not found')
      ) {
        setErrorMessage(
          'Kullanıcı bulunamadı. E-posta adresinizi kontrol edin.'
        )
      } else if (errMsg.includes('Network') || errMsg.includes('network')) {
        setErrorMessage(
          'Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.'
        )
      } else {
        setErrorMessage(
          'Giriş yapılamadı. E-posta ve şifrenizi kontrol edip tekrar deneyin.'
        )
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-email">E-posta</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMessage(null)
          }}
          placeholder="E-posta adresinizi giriniz."
          className="min-h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Şifre</Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorMessage(null)
            }}
            placeholder="Şifrenizi girin."
            className="min-h-11 pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-row items-center space-x-3 space-y-0">
        <Checkbox
          id="admin-remember"
          checked={rememberMe}
          onCheckedChange={(v) => setRememberMe(v === true)}
        />
        <Label
          htmlFor="admin-remember"
          className="cursor-pointer text-sm font-normal text-foreground"
        >
          Beni hatırla
        </Label>
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} className="min-h-11 w-full">
        {isPending ? 'Giriş yapılıyor...' : 'Giriş yap'}
      </Button>
    </form>
  )
}
