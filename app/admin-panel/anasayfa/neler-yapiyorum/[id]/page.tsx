'use client'

import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { HighlightEditorForm } from '@/components/tables/anasayfa/highlight/highlight-editor-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useTRPC } from '@/lib/trpc/client'

export default function EditHighlightPage() {
  const params = useParams<{ id: string }>()
  const trpc = useTRPC()
  const { data: canAccess, isLoading: permLoading } = usePermission(
    SCOPES.HOME_HIGHLIGHT,
    PERMISSIONS.UPDATE
  )

  const {
    data: row,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...trpc.homeHighlight.getById.queryOptions({ id: params.id }),
    enabled: Boolean(canAccess && params.id),
  })

  if (permLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Erişim reddedildi
            </CardTitle>
            <CardDescription>
              Bu sayfa için HOME_HIGHLIGHT kapsamında UPDATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden kart düzenleme yetkisi isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (isError || !row) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Kayıt bulunamadı
            </CardTitle>
            <CardDescription>
              {error?.message ?? 'Kart kaydı yüklenemedi.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kartı düzenle</h1>
          <p className="text-muted-foreground mt-1 text-sm">{row.title}</p>
        </div>
        <HighlightEditorForm
          mode="edit"
          highlightId={row.id}
          initialValues={{
            title: row.title,
            description: row.description,
            iconKey: row.iconKey,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
