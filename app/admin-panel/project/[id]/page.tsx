'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SolutionEditorForm } from '@/components/tables/solution/solution-editor-form'
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

type SolutionEditPageParams = Promise<{ id: string }>

export default function EditSolutionPage({
  params,
}: {
  params: SolutionEditPageParams
}) {
  const { id } = use(params)
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.SOLUTION,
    PERMISSIONS.UPDATE
  )
  const {
    data: solutionData,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.solution.getById.queryOptions({ id }))

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
              Bu sayfa için SOLUTION kapsamında UPDATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden çözüm düzenleme yetkisi isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (isError || !solutionData) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Çözüm bulunamadı
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
          <h1 className="text-2xl font-bold tracking-tight">Çözüm düzenle</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Başlığı, grubu, teknolojileri ve içeriği bu sayfadan güncelleyin.
          </p>
        </div>
        <SolutionEditorForm
          mode="edit"
          solutionId={solutionData.id}
          initialValues={{
            title: solutionData.title,
            slug: solutionData.slug,
            excerpt: solutionData.excerpt,
            content: solutionData.content,
            groupId: solutionData.groupId,
            technologyIds: solutionData.technologyIds,
            fileId: solutionData.fileId,
            isPublished: solutionData.isPublished,
            isFeatured: solutionData.isFeatured,
            publishedAt: solutionData.publishedAt,
            seoTitle: solutionData.seoTitle,
            seoDescription: solutionData.seoDescription,
            robotsIndex: solutionData.robotsIndex,
            coverImageAlt: solutionData.coverImageAlt,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
