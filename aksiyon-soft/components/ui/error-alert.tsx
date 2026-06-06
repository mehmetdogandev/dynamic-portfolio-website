'use client'

import * as React from 'react'
import { AlertCircle, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  title?: string
  message: string
  onClose?: () => void
  className?: string
  variant?: 'default' | 'destructive'
  dismissible?: boolean
}
export function ErrorAlert({
  title = 'Hata',
  message,
  onClose,
  className,
  variant = 'destructive',
  dismissible = true,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Mount olduğunda animasyonu tetikle
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // Animasyon bitince callback'i çağır
    setTimeout(() => {
      onClose?.()
    }, 200)
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-10001 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={dismissible ? handleClose : undefined}
      />

      {/* Popup Alert */}
      <div className="fixed inset-0 z-10001 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'relative max-w-md w-full pointer-events-auto bg-card rounded-lg shadow-2xl border-2',
            'transition-all duration-200 ease-out p-6',
            variant === 'destructive'
              ? 'border-destructive/50'
              : 'border-border',
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4',
            className
          )}
        >
          {/* Icon ve başlık */}
          <div className="flex items-start gap-3">
            {variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={cn(
                  'text-lg font-semibold',
                  variant === 'destructive'
                    ? 'text-destructive'
                    : 'text-foreground'
                )}
              >
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            </div>
          </div>

          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-7 w-7 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Kapat</span>
            </Button>
          )}

          {/* Tamam butonu - Alt kısım */}
          <div className="mt-6 flex justify-end">
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              onClick={handleClose}
              className="min-w-20"
            >
              Tamam
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export function SuccessAlert(props: Omit<ErrorAlertProps, 'variant'>) {
  return <ErrorAlert {...props} variant="default" title="Başarılı" />
}
