'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ExpertiseEditorForm } from '@/components/tables/hakkimda/expertise/expertise-editor-form'
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

type EditPageParams = Promise<{ id: string }>

export default function EditExpertisePage({
  params,
}: {
  params: EditPageParams
}) {
  const { id } = use(params)
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.ABOUT_EXPERTISE,
    PERMISSIONS.UPDATE
  )
  const {
    data: row,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.aboutExpertise.getById.queryOptions({ id }))

  if (authLoading || isLoading) {
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
              Bu sayfa için ABOUT_EXPERTISE kapsamında UPDATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden uzmanlık alanı düzenleme yetkisi isteyin.
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
              Uzmanlık alanı bulunamadı
            </CardTitle>
            <CardDescription>
              {error?.message ?? 'Kayıt yüklenemedi.'}
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
          <h1 className="text-2xl font-bold tracking-tight">
            Uzmanlık alanı düzenle
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{row.title}</p>
        </div>
        <ExpertiseEditorForm
          mode="edit"
          expertiseId={row.id}
          initialValues={{
            title: row.title,
            description: row.description,
            keywords: row.keywords ?? [],
          }}
        />
      </div>
    </DashboardLayout>
  )
}
