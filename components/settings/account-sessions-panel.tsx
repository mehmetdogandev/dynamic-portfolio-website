'use client'

import { useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Monitor,
  Globe,
  Clock,
  AlertCircle,
  Smartphone,
  Laptop,
  Tablet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AccountSessionsPanel() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: sessions, isLoading: isLoadingSessions } = useQuery(
    trpc.auth.getSessionsWithDeviceInfo.queryOptions()
  )

  const revokeSessionMutation = useMutation(
    trpc.auth.revokeSession.mutationOptions({
      onSuccess: () => {
        toast.success('Oturum başarıyla sonlandırıldı')
        queryClient.invalidateQueries({
          queryKey: trpc.auth.getSessionsWithDeviceInfo.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.auth.getSessions.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Oturum sonlandırılırken bir hata oluştu'
        )
      },
    })
  )

  const getDeviceDetails = useCallback((userAgent?: string | null) => {
    if (!userAgent) {
      return {
        deviceType: 'unknown' as const,
        deviceName: 'Bilinmeyen cihaz',
        browser: 'Bilinmiyor',
        os: 'Bilinmiyor',
        icon: Monitor,
      }
    }

    const normalized = userAgent.toLowerCase()
    const isMobile = /mobile|iphone|android/.test(normalized)
    const isTablet = /ipad|tablet/.test(normalized)
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'
    const icon =
      deviceType === 'mobile'
        ? Smartphone
        : deviceType === 'tablet'
          ? Tablet
          : Laptop

    const browserMatch = /chrome|safari|firefox|edge|opera|brave/.exec(
      normalized
    )
    const osMatch =
      /windows nt [\d.]+|mac os x [\d_]+|android [\d.]+|iphone os [\d_]+|ipad os [\d_]+|linux/.exec(
        normalized
      )

    const browser = /aksiyonsoft.com\/[\d.]+/.test(normalized)
      ? 'Aksiyon Soft'
      : browserMatch
        ? browserMatch[0]
            .replace('chrome', 'Chrome')
            .replace('safari', 'Safari')
            .replace('firefox', 'Firefox')
            .replace('edge', 'Edge')
            .replace('opera', 'Opera')
            .replace('brave', 'Brave')
        : 'Bilinmiyor'

    const os = osMatch
      ? osMatch[0]
          .replace('windows nt', 'Windows')
          .replace(
            /mac os x ([\d_]+)/,
            (_, v) => `macOS ${v.replace(/_/g, '.')}`
          )
          .replace(/android ([\d.]+)/, (_, v) => `Android ${v}`)
          .replace(
            /iphone os ([\d_]+)/,
            (_, v) => `iOS ${v.replace(/_/g, '.')}`
          )
          .replace(
            /ipad os ([\d_]+)/,
            (_, v) => `iPadOS ${v.replace(/_/g, '.')}`
          )
          .replace('linux', 'Linux')
      : 'Bilinmiyor'

    return {
      deviceType,
      deviceName:
        deviceType === 'desktop'
          ? 'Bilgisayar'
          : deviceType === 'mobile'
            ? 'Mobil Cihaz'
            : 'Tablet',
      browser,
      os,
      icon,
    }
  }, [])

  const resolveOfficeLabel = useCallback(
    (session: {
      deviceGlobalIp?: string | null
      ipAddress?: string | null
      deviceLocalIp?: string | null
    }) => {
      const publicMap: Record<string, string> = {
        '78.186.219.133': 'Aksaray Ofis',
        '88.248.113.143': 'İstanbul Ofis',
        '46.221.60.165': 'İstanbul Ofis',
        '88.250.14.151': 'Niğde Ofis',
        '31.141.206.152': 'Niğde Sazlıca Ofis',
      }

      const publicLabel = session.deviceGlobalIp
        ? publicMap[session.deviceGlobalIp]
        : undefined
      if (publicLabel) return publicLabel

      const fallbackIp = session.ipAddress || session.deviceLocalIp
      if (fallbackIp) {
        const localMatch = /^192\.168\.(\d+)\./.exec(fallbackIp)
        if (localMatch) {
          const octet = localMatch[1]
          const localMap: Record<string, string> = {
            '6': 'Aksaray Ofis',
            '2': 'İstanbul Ofis',
            '3': 'Niğde Ofis',
            '4': 'Niğde Sazlıca Ofis',
          }
          const localLabel = localMap[octet]
          if (localLabel) return localLabel
        }
        return fallbackIp
      }

      return 'Bilgi yok'
    },
    []
  )

  const sessionItems = useMemo(() => {
    return (
      sessions?.map((session) => {
        const details = getDeviceDetails(session.userAgent)
        return {
          id: session.id,
          token: session.token,
          isCurrent: session.isCurrent,
          deviceName: details.deviceName,
          browser: details.browser,
          os: details.os,
          icon: details.icon,
          officeLabel: resolveOfficeLabel({
            deviceGlobalIp: session.deviceGlobalIp,
            ipAddress: session.ipAddress,
            deviceLocalIp: session.deviceLocalIp,
          }),
          lastActive: session.updatedAt,
        }
      }) ?? []
    )
  }, [sessions, getDeviceDetails, resolveOfficeLabel])

  const handleRevokeSession = (token: string) => {
    revokeSessionMutation.mutate({ token })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Badge
          variant="secondary"
          className="border border-border/60 bg-background/80 font-medium tabular-nums"
        >
          {sessionItems.length} oturum
        </Badge>
      </div>

      <div className="max-h-[min(420px,55vh)] space-y-2 overflow-y-auto pr-1">
        {isLoadingSessions &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[4.75rem] animate-pulse rounded-xl bg-muted"
            />
          ))}

        {!isLoadingSessions && sessionItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-10 text-center">
            <AlertCircle className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Aktif oturum bulunamadı
            </p>
          </div>
        )}

        {!isLoadingSessions &&
          sessionItems.length > 0 &&
          sessionItems.map((session) => {
            const Icon = session.icon
            return (
              <div
                key={session.id}
                className={cn(
                  'rounded-xl border p-3.5 transition-colors md:p-4',
                  session.isCurrent
                    ? 'border-emerald-500/35 bg-emerald-500/[0.06] dark:bg-emerald-500/10'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/35'
                )}
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                      session.isCurrent
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {session.deviceName}
                          </span>
                          {session.isCurrent ? (
                            <Badge className="border-0 bg-emerald-600/15 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                              Bu oturum
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {session.browser} · {session.os}
                        </p>
                      </div>
                      {!session.isCurrent ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(session.token)}
                          disabled={revokeSessionMutation.isPending}
                          className="h-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Sonlandır
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-border/50 pt-3 text-xs sm:grid-cols-2">
                      <div className="flex min-w-0 items-start gap-1.5 text-muted-foreground">
                        <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-words">
                          <span className="font-medium text-foreground/80">
                            Konum:{' '}
                          </span>
                          {session.officeLabel}
                        </span>
                      </div>
                      <div className="flex min-w-0 items-start gap-1.5 text-muted-foreground sm:justify-end">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-words text-left sm:text-right">
                          <span className="font-medium text-foreground/80">
                            Son aktivite:{' '}
                          </span>
                          {new Date(session.lastActive).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-muted-foreground dark:border-amber-500/30 dark:bg-amber-500/10">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p>
          Tanımadığınız bir oturum görüyorsanız hemen sonlandırın ve şifrenizi
          değiştirin.
        </p>
      </div>
    </div>
  )
}
