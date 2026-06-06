'use client'

import { Loader2 } from 'lucide-react'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { SliderGroupDataTable } from '@/components/tables/slider/slider-group-data-table'

export function SliderManagement() {
  const { data: canAccess, isLoading: permLoading } = usePermission(
    SCOPES.SLIDER,
    PERMISSIONS.ACCESS
  )

  if (permLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <p className="text-muted-foreground text-sm">
        Bu sayfayı görüntülemek için yetkiniz yok.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Slider</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Grupları ve slaytları yönetin; sıralamayı sürükleyip kaydedin.
        </p>
      </div>
      <SliderGroupDataTable />
    </div>
  )
}
