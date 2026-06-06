'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function parseSameAsLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function SiteSeoSettings() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: canRead, isLoading: readLoading } = usePermission(
    SCOPES.SITE_SEO,
    PERMISSIONS.READ
  )
  const { data: canUpdate } = usePermission(SCOPES.SITE_SEO, PERMISSIONS.UPDATE)

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.siteSeo.get.queryOptions(),
    enabled: Boolean(canRead),
  })

  const [defaultMetaDescription, setDefaultMetaDescription] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [sameAsLines, setSameAsLines] = useState('')
  const [twitterSite, setTwitterSite] = useState('')
  const [googleSiteVerification, setGoogleSiteVerification] = useState('')
  const [defaultOgImageFileId, setDefaultOgImageFileId] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!data) return
    setDefaultMetaDescription(data.defaultMetaDescription ?? '')
    setOrganizationName(data.organizationName ?? '')
    setSameAsLines((data.sameAs ?? []).join('\n'))
    setTwitterSite(data.twitterSite ?? '')
    setGoogleSiteVerification(data.googleSiteVerification ?? '')
    setDefaultOgImageFileId(data.defaultOgImageFileId)
  }, [data])

  const upsert = useMutation(
    trpc.siteSeo.upsert.mutationOptions({
      onSuccess: async () => {
        toast.success('Site SEO kaydedildi')
        await queryClient.invalidateQueries({
          queryKey: trpc.siteSeo.get.queryKey(),
        })
      },
      onError: (e) => toast.error(e.message),
    })
  )

  if (readLoading || isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  if (!canRead) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Erişim reddedildi</CardTitle>
          <CardDescription>
            Site SEO için SITE_SEO kapsamında READ izni gerekir.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Veri yüklenemedi</CardTitle>
          <CardDescription>{error?.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const onOgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    fd.append('prefix', 'site/og')
    try {
      const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
      const j = (await res.json()) as {
        fileId?: string
        error?: string
        details?: string
      }
      if (!res.ok || !j.fileId) {
        throw new Error(j.details || j.error || 'Yükleme başarısız')
      }
      setDefaultOgImageFileId(j.fileId)
      toast.success('OG görseli seçildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme hatası')
    }
  }

  const submit = async () => {
    if (!canUpdate) {
      toast.error('Güncelleme izniniz yok')
      return
    }
    const sameAs = parseSameAsLines(sameAsLines)
    for (const u of sameAs) {
      try {
        void new URL(u)
      } catch {
        toast.error(`Geçersiz URL: ${u}`)
        return
      }
    }
    await upsert.mutateAsync({
      defaultMetaDescription: defaultMetaDescription.trim() || null,
      organizationName: organizationName.trim() || null,
      sameAs,
      twitterSite: twitterSite.trim() || null,
      googleSiteVerification: googleSiteVerification.trim() || null,
      defaultOgImageFileId,
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site SEO</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Varsayılan meta açıklama, OG görseli ve kurumsal JSON-LD alanları.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Kurum / site adı</Label>
          <Input
            id="org-name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Örn. Aksiyon Soft"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="default-desc">Varsayılan meta açıklama</Label>
          <Textarea
            id="default-desc"
            value={defaultMetaDescription}
            onChange={(e) => setDefaultMetaDescription(e.target.value)}
            rows={4}
            placeholder="Statik sayfalar ve şablon için kullanılır"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="same-as">
            Sosyal / harici profiller (satır başına URL)
          </Label>
          <Textarea
            id="same-as"
            value={sameAsLines}
            onChange={(e) => setSameAsLines(e.target.value)}
            rows={4}
            placeholder="https://www.linkedin.com/company/..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tw-site">Twitter @site (opsiyonel)</Label>
            <Input
              id="tw-site"
              value={twitterSite}
              onChange={(e) => setTwitterSite(e.target.value)}
              placeholder="@sirket"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gsc">Google site verification (opsiyonel)</Label>
            <Input
              id="gsc"
              value={googleSiteVerification}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="og-file">Varsayılan OG görseli</Label>
          <Input
            id="og-file"
            type="file"
            accept="image/*"
            onChange={onOgFile}
          />
          {defaultOgImageFileId ? (
            <p className="text-muted-foreground text-xs">
              Seçili dosya: {defaultOgImageFileId.slice(0, 8)}…
              <button
                type="button"
                className="text-primary ml-2 underline"
                onClick={() => setDefaultOgImageFileId(null)}
              >
                Kaldır
              </button>
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={!canUpdate || upsert.isPending}
          >
            {upsert.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}
