'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ProfileEditorForm } from '@/components/tables/hakkimda/profile/profile-editor-form'
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

export default function HakkimdaProfilePage() {
  const trpc = useTRPC()
  const { data: canAccess, isLoading: authLoading } = usePermission(
    SCOPES.ABOUT_PROFILE,
    PERMISSIONS.ACCESS
  )
  const { data: canUpdate } = usePermission(
    SCOPES.ABOUT_PROFILE,
    PERMISSIONS.UPDATE
  )
  const { data: canCreate } = usePermission(
    SCOPES.ABOUT_PROFILE,
    PERMISSIONS.CREATE
  )

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.aboutPageProfile.list.queryOptions({
      page: 1,
      limit: 1,
      search: '',
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      columnFilters: {},
    }),
    enabled: Boolean(canAccess),
  })

  const profile = data?.data?.[0]

  if (authLoading || (canAccess && isLoading)) {
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
              Bu sayfa için ABOUT_PROFILE kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden hakkımda sayfa metni yönetimi için rol ataması
              isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Yüklenemedi</CardTitle>
            <CardDescription>
              {error?.message ?? 'Sayfa metni yüklenemedi.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  const canEdit = profile ? canUpdate : canCreate

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Sayfa metni
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Hakkımda sayfasının özet, giriş paragrafları ve SEO alanlarını
              yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <ProfileEditorForm
                mode={profile ? 'edit' : 'create'}
                profileId={profile?.id}
                initialValues={
                  profile
                    ? {
                        lead: profile.lead,
                        intro: profile.intro,
                        introPart2: profile.introPart2,
                        introPart3: profile.introPart3,
                        introPart4: profile.introPart4,
                        seoTitle: profile.seoTitle,
                        seoDescription: profile.seoDescription,
                        robotsIndex: profile.robotsIndex,
                      }
                    : undefined
                }
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Bu içeriği düzenlemek için CREATE veya UPDATE izni gerekir.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
