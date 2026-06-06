'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ProjectEditorForm } from '@/components/tables/project/project-editor-form'
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

export default function EditProjectPage({
  params,
}: {
  params: SolutionEditPageParams
}) {
  const { id } = use(params)
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.PROJECT,
    PERMISSIONS.UPDATE
  )
  const {
    data: projectData,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.project.getById.queryOptions({ id }))

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
              Bu sayfa için PROJECT kapsamında UPDATE izni gerekir.
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

  if (isError || !projectData) {
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
        <ProjectEditorForm
          mode="edit"
          projectId={projectData.id}
          initialValues={{
            title: projectData.title,
            slug: projectData.slug,
            excerpt: projectData.excerpt,
            content: projectData.content,
            groupId: projectData.groupId,
            technologyIds: projectData.technologyIds,
            fileId: projectData.fileId,
            isPublished: projectData.isPublished,
            isFeatured: projectData.isFeatured,
            publishedAt: projectData.publishedAt,
            seoTitle: projectData.seoTitle,
            seoDescription: projectData.seoDescription,
            robotsIndex: projectData.robotsIndex,
            coverImageAlt: projectData.coverImageAlt,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
