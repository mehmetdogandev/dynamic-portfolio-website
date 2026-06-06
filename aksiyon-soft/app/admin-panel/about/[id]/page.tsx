'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { AboutEditorForm } from '@/components/tables/about/about-editor-form'
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

type AboutEditPageParams = Promise<{ id: string }>

export default function EditAboutPage({
  params,
}: {
  params: AboutEditPageParams
}) {
  const { id } = use(params)
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.ABOUT,
    PERMISSIONS.UPDATE
  )
  const {
    data: aboutData,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.about.getById.queryOptions({ id }))

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
              Bu sayfa için ABOUT kapsamında UPDATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden hakkımızda düzenleme yetkisi isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (isError || !aboutData) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Hakkımızda kaydı bulunamadı
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
            Hakkımızda Kaydını Düzenle
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            İçeriği, SEO alanlarını ve yayın durumunu buradan
            güncelleyebilirsiniz.
          </p>
        </div>
        <AboutEditorForm
          mode="edit"
          aboutId={aboutData.id}
          initialValues={{
            title: aboutData.title,
            slug: aboutData.slug,
            content: aboutData.content,
            isPublished: aboutData.isPublished,
            publishedAt: aboutData.publishedAt,
            seoTitle: aboutData.seoTitle,
            seoDescription: aboutData.seoDescription,
            robotsIndex: aboutData.robotsIndex,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
