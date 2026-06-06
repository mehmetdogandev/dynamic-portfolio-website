'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { useTRPC } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type SettingsState = {
  stickyHeaderEnabled: boolean
  scrollProgressBarEnabled: boolean
}

export function HeaderGlobalSettingsCard() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: canUpdate } = usePermission(
    SCOPES.HEADER_NAV,
    PERMISSIONS.UPDATE
  )

  const { data, isLoading, isError, error } = useQuery(
    trpc.headerSettings.get.queryOptions()
  )

  const [settings, setSettings] = useState<SettingsState>({
    stickyHeaderEnabled: false,
    scrollProgressBarEnabled: false,
  })
  const [savingKey, setSavingKey] = useState<'sticky' | 'progress' | null>(null)

  useEffect(() => {
    if (!data) return
    setSettings({
      stickyHeaderEnabled: data.stickyHeaderEnabled,
      scrollProgressBarEnabled: data.scrollProgressBarEnabled,
    })
  }, [data])

  const { mutateAsync: upsertAsync } = useMutation(
    trpc.headerSettings.upsert.mutationOptions({
      onSuccess: async (result) => {
        setSettings({
          stickyHeaderEnabled: result.stickyHeaderEnabled,
          scrollProgressBarEnabled: result.scrollProgressBarEnabled,
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.headerSettings.get.queryKey(),
        })
        toast.success('Ayarlar kaydedildi')
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const save = async (
    patch: Partial<SettingsState>,
    key: 'sticky' | 'progress',
    rollback: SettingsState
  ) => {
    if (!canUpdate) return
    setSavingKey(key)
    try {
      await upsertAsync(patch)
    } catch {
      setSettings(rollback)
    } finally {
      setSavingKey(null)
    }
  }

  const onStickyChange = (checked: boolean) => {
    const rollback = settings
    const next: SettingsState = {
      stickyHeaderEnabled: checked,
      scrollProgressBarEnabled: checked
        ? settings.scrollProgressBarEnabled
        : false,
    }
    setSettings(next)
    void save(
      {
        stickyHeaderEnabled: checked,
        scrollProgressBarEnabled: next.scrollProgressBarEnabled,
      },
      'sticky',
      rollback
    )
  }

  const onProgressChange = (checked: boolean) => {
    const rollback = settings
    const next = { ...settings, scrollProgressBarEnabled: checked }
    setSettings(next)
    void save({ scrollProgressBarEnabled: checked }, 'progress', rollback)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Header ayarları</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[120px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Header ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {error?.message ?? 'Ayarlar yüklenemedi'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const switchesDisabled = !canUpdate || savingKey !== null
  const progressDisabled = switchesDisabled || !settings.stickyHeaderEnabled

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header ayarları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="sticky-header-enabled">Sabit Header Aktif</Label>
            <p className="text-muted-foreground text-xs">
              Sayfa kaydırılırken üst menü ekranın üstünde sabit kalır.
            </p>
          </div>
          <Switch
            id="sticky-header-enabled"
            checked={settings.stickyHeaderEnabled}
            disabled={switchesDisabled}
            onCheckedChange={onStickyChange}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="scroll-progress-enabled">
              Scroll Progress Bar Aktif
            </Label>
            <p className="text-muted-foreground text-xs">
              Header altında, kaydırmaya göre dolan ince ilerleme çubuğu
              gösterilir.
            </p>
            {!settings.stickyHeaderEnabled ? (
              <p className="text-muted-foreground text-xs italic">
                Önce sabit header&apos;ı açın.
              </p>
            ) : null}
          </div>
          <Switch
            id="scroll-progress-enabled"
            checked={settings.scrollProgressBarEnabled}
            disabled={progressDisabled}
            onCheckedChange={onProgressChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
