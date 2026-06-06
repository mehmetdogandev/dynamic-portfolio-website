'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { BlogContent } from '@/lib/blog/content'
import { adminHref } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BlogContentEditor } from '@/components/tables/blog/blog-content-editor'
import type { AdminSolutionGroupRow } from '@/components/tables/solution/solution-group/data-table'
import type { AdminSolutionTechnologyRow } from '@/components/tables/solution/solution-technology/data-table'

type UploadResponse = {
  fileId?: string
  error?: string
  details?: string
}

interface SolutionEditorFormProps {
  mode: 'create' | 'edit'
  solutionId?: string
  initialValues?: {
    title: string
    slug: string
    excerpt: string | null
    content: BlogContent
    groupId: string | null
    technologyIds: string[]
    fileId: string | null
    isPublished: boolean
    isFeatured: boolean
    publishedAt: Date | null
    seoTitle?: string | null
    seoDescription?: string | null
    robotsIndex?: boolean
    coverImageAlt?: string | null
  }
}

const EMPTY_CONTENT: BlogContent = {
  type: 'doc',
  version: 1,
  html: '<p></p>',
  imageFileIds: [],
  videoFileIds: [],
}

export function SolutionEditorForm({
  mode,
  solutionId,
  initialValues,
}: SolutionEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: groups } = useQuery(
    trpc.solutionGroup.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const groupOptions = useMemo(
    () => (groups?.data ?? []) as AdminSolutionGroupRow[],
    [groups]
  )

  const { data: technologies } = useQuery(
    trpc.solutionTechnology.list.queryOptions(
      adminListFetchAllInput('sortOrder')
    )
  )
  const technologyOptions = useMemo(
    () => (technologies?.data ?? []) as AdminSolutionTechnologyRow[],
    [technologies]
  )

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [slug, setSlug] = useState(initialValues?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? '')
  const [content, setContent] = useState<BlogContent>(
    initialValues?.content ?? EMPTY_CONTENT
  )
  const [groupId, setGroupId] = useState(
    initialValues?.groupId ?? groupOptions[0]?.id ?? ''
  )
  const [selectedTechIds, setSelectedTechIds] = useState<Set<string>>(
    () => new Set(initialValues?.technologyIds ?? [])
  )
  const [fileId, setFileId] = useState<string | null>(
    initialValues?.fileId ?? null
  )
  const [isPublished, setIsPublished] = useState(
    initialValues?.isPublished ?? false
  )
  const [isFeatured, setIsFeatured] = useState(
    initialValues?.isFeatured ?? false
  )
  const [seoTitle, setSeoTitle] = useState(initialValues?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(
    initialValues?.seoDescription ?? ''
  )
  const [robotsIndex, setRobotsIndex] = useState(
    initialValues?.robotsIndex ?? true
  )
  const [coverImageAlt, setCoverImageAlt] = useState(
    initialValues?.coverImageAlt ?? ''
  )
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [inlineMediaHint, setInlineMediaHint] = useState<
    null | 'image' | 'video'
  >(null)

  useEffect(() => {
    if (!groupId && groupOptions.length > 0) {
      setGroupId(groupOptions[0]!.id)
    }
  }, [groupId, groupOptions])

  useEffect(() => {
    if (mode !== 'edit' || !initialValues?.technologyIds) return
    setSelectedTechIds(new Set(initialValues.technologyIds))
  }, [mode, initialValues?.technologyIds])

  const toggleTech = (id: string) => {
    setSelectedTechIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const createMutation = useMutation(
    trpc.solution.create.mutationOptions({
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.solution.list.queryKey(),
        })
        toast.success('Çözüm oluşturuldu')
        router.push(adminHref(`/solution/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.solution.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.solution.list.queryKey(),
        })
        toast.success('Çözüm güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending =
    createMutation.isPending || updateMutation.isPending || isCoverUploading

  const onCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('prefix', 'solution/cover')
      const alt = coverImageAlt.trim()
      if (alt) formData.append('altText', alt)
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      const body = (await response.json()) as UploadResponse
      if (!response.ok || !body.fileId) {
        throw new Error(
          body.details || body.error || 'Kapak görseli yüklenemedi'
        )
      }
      setFileId(body.fileId)
      toast.success('Kapak görseli yüklendi')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Kapak görseli yüklenemedi'
      )
    } finally {
      setIsCoverUploading(false)
    }
  }

  const submit = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Başlık ve slug alanları zorunludur')
      return
    }
    if (!groupId) {
      toast.error('Çözüm grubu seçilmelidir')
      return
    }

    const technologyIds = [...selectedTechIds]

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content,
      groupId,
      technologyIds,
      fileId,
      isPublished,
      isFeatured,
      publishedAt: isPublished
        ? (initialValues?.publishedAt ?? new Date())
        : null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      robotsIndex,
      coverImageAlt: fileId ? coverImageAlt.trim() || null : null,
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!solutionId) {
      toast.error('Çözüm kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: solutionId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="solution-title">Başlık</Label>
          <Input
            id="solution-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="solution-slug">Slug</Label>
          <Input
            id="solution-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="solution-group">Çözüm grubu</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger id="solution-group">
              <SelectValue placeholder="Grup seçin" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={fileId ? undefined : 'solution-cover'}>
            Kapak görseli
          </Label>
          {isCoverUploading && !fileId ? (
            <div className="border-muted-foreground/25 flex aspect-video max-h-48 w-full items-center justify-center rounded-md border bg-muted/30">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          ) : fileId ? (
            <div className="relative aspect-video max-h-48 w-full overflow-hidden rounded-md border">
              <img
                src={`/api/files/${fileId}/view`}
                alt={coverImageAlt.trim() || title.trim() || 'Kapak görseli'}
                className="size-full object-cover"
              />
              {isCoverUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="text-muted-foreground size-8 animate-spin" />
                </div>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background/90 absolute right-1 top-1 h-8 w-8 shadow-sm"
                aria-label="Kapak görselini kaldır"
                disabled={isCoverUploading}
                onClick={() => setFileId(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Input
              id="solution-cover"
              type="file"
              accept="image/*"
              onChange={onCoverFile}
              disabled={isCoverUploading}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Teknolojiler</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
          {technologyOptions.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Önce teknoloji kayıtları oluşturun.
            </p>
          ) : (
            technologyOptions.map((tech) => (
              <label
                key={tech.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedTechIds.has(tech.id)}
                  onChange={() => toggleTech(tech.id)}
                />
                {tech.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="solution-excerpt">Özet</Label>
        <Textarea
          id="solution-excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          rows={3}
        />
      </div>

      <div className="border-muted space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">SEO</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="solution-seo-title">
              Arama başlığı (opsiyonel)
            </Label>
            <Input
              id="solution-seo-title"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Boşsa çözüm başlığı kullanılır"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="solution-seo-desc">
              Meta açıklama (öneri ~155 karakter)
            </Label>
            <Textarea
              id="solution-seo-desc"
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              rows={3}
              maxLength={320}
              placeholder="Boşsa özet kullanılır"
            />
            <p className="text-muted-foreground text-xs">
              {seoDescription.length}/320
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="solution-cover-alt">Kapak görseli alt metni</Label>
            <Input
              id="solution-cover-alt"
              value={coverImageAlt}
              onChange={(event) => setCoverImageAlt(event.target.value)}
              placeholder="Erişilebilirlik ve arama motorları için"
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(event) => setRobotsIndex(event.target.checked)}
            />
            Arama motorlarında indeksle (kapalıysa noindex)
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>İçerik</Label>
        <BlogContentEditor
          value={content}
          onChange={setContent}
          disabled={isPending}
          onInlineImageInserted={
            mode === 'create' ? () => setInlineMediaHint('image') : undefined
          }
          onInlineVideoInserted={
            mode === 'create' ? () => setInlineMediaHint('video') : undefined
          }
        />
      </div>

      <Dialog
        open={inlineMediaHint !== null}
        onOpenChange={(open) => {
          if (!open) setInlineMediaHint(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {inlineMediaHint === 'video'
                ? 'Video düzenleme'
                : 'Gelişmiş görsel düzenleme'}
            </DialogTitle>
            <DialogDescription className="text-left">
              {inlineMediaHint === 'video' ? (
                <>
                  İçerik alanına eklediğiniz videoları boyutlandırma ve hizalama
                  araçlarıyla düzenlemek için önce bu kaydı kaydedin.
                  kaydettikten sonra düzenleme sayfasında bu seçeneklerin
                  tamamına erişebilirsiniz.
                </>
              ) : (
                <>
                  İçerik alanına eklediğiniz görselleri boyutlandırma, hizalama
                  ve kırpma araçlarıyla düzenlemek için önce bu kaydı kaydedin.
                  Kaydettikten sonra düzenleme sayfasında bu seçeneklerin
                  tamamına erişebilirsiniz.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setInlineMediaHint(null)}>
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
          />
          Yayınla
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          Öne çıkar
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Çözüm oluştur' : 'Çözüm güncelle'}
        </Button>
      </div>
    </div>
  )
}
