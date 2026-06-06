'use client'

import { Loader2 } from 'lucide-react'
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

export default function NewHighlightPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.HOME_HIGHLIGHT,
    PERMISSIONS.CREATE
  )

  if (isLoading) {
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
              Bu sayfa için HOME_HIGHLIGHT kapsamında CREATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden kart oluşturma yetkisi isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yeni kart</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Neler Yapıyorum bölümüne yeni bir kart ekleyin.
          </p>
        </div>
        <HighlightEditorForm mode="create" />
      </div>
    </DashboardLayout>
  )
}
