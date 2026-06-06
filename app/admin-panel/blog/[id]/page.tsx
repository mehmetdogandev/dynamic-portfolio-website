'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { BlogEditorForm } from '@/components/tables/blog/blog-editor-form'
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

type BlogEditPageParams = Promise<{ id: string }>

export default function EditBlogPage({
  params,
}: {
  params: BlogEditPageParams
}) {
  const { id } = use(params)
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.BLOG,
    PERMISSIONS.UPDATE
  )
  const {
    data: blogData,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.blog.getById.queryOptions({ id }))

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
              Bu sayfa için BLOG kapsamında UPDATE izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden blog düzenleme yetkisi isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (isError || !blogData) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Blog bulunamadı
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
          <h1 className="text-2xl font-bold tracking-tight">Blog Düzenle</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Blog başlığını, kapak görselini ve içeriğini bu sayfadan
            güncelleyin.
          </p>
        </div>
        <BlogEditorForm
          mode="edit"
          blogId={blogData.id}
          initialValues={{
            title: blogData.title,
            slug: blogData.slug,
            excerpt: blogData.excerpt,
            content: blogData.content,
            categoryId: blogData.categoryId,
            fileId: blogData.fileId,
            isPublished: blogData.isPublished,
            isFeatured: blogData.isFeatured,
            publishedAt: blogData.publishedAt,
            seoTitle: blogData.seoTitle,
            seoDescription: blogData.seoDescription,
            robotsIndex: blogData.robotsIndex,
            coverImageAlt: blogData.coverImageAlt,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
