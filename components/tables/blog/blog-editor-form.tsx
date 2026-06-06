'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { BlogContent } from '@/lib/blog/content'
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
import { BlogContentEditor } from './blog-content-editor'
import type { AdminBlogTypeRow } from '../blog-type/blog-type-data-table'

type UploadResponse = {
  fileId?: string
  error?: string
  details?: string
}

interface BlogEditorFormProps {
  mode: 'create' | 'edit'
  blogId?: string
  initialValues?: {
    title: string
    slug: string
    excerpt: string | null
    content: BlogContent
    categoryId: string | null
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

export function BlogEditorForm({
  mode,
  blogId,
  initialValues,
}: BlogEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: categories } = useQuery(
    trpc.blogType.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const categoryOptions = useMemo(
    () => (categories?.data ?? []) as AdminBlogTypeRow[],
    [categories]
  )

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [slug, setSlug] = useState(initialValues?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? '')
  const [content, setContent] = useState<BlogContent>(
    initialValues?.content ?? EMPTY_CONTENT
  )
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? categoryOptions[0]?.id ?? ''
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
  const [inlineImageEditHintOpen, setInlineImageEditHintOpen] = useState(false)

  useEffect(() => {
    if (!categoryId && categoryOptions.length > 0) {
      setCategoryId(categoryOptions[0]!.id)
    }
  }, [categoryId, categoryOptions])

  const createMutation = useMutation(
    trpc.blog.create.mutationOptions({
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.blog.list.queryKey(),
        })
        toast.success('Blog kaydı oluşturuldu')
        router.push(`/admin-panel/blog/${result.id}`)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.blog.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.blog.list.queryKey(),
        })
        if (blogId) {
          await queryClient.invalidateQueries({
            queryKey: trpc.blog.getById.queryKey({ id: blogId }),
          })
        }
        toast.success('Blog kaydı güncellendi')
        router.refresh()
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
      formData.append('prefix', 'blog/cover')
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
    if (!categoryId) {
      toast.error('Blog türü seçilmelidir')
      return
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content,
      categoryId,
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

    if (!blogId) {
      toast.error('Blog kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: blogId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="blog-title">Başlık</Label>
          <Input
            id="blog-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blog-slug">Slug</Label>
          <Input
            id="blog-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="blog-category">Blog türü</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="blog-category">
              <SelectValue placeholder="Blog türü seçin" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={fileId ? undefined : 'blog-cover'}>
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
              id="blog-cover"
              type="file"
              accept="image/*"
              onChange={onCoverFile}
              disabled={isCoverUploading}
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="blog-excerpt">Özet</Label>
        <Textarea
          id="blog-excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          rows={3}
        />
      </div>

      <div className="border-muted space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">SEO</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="blog-seo-title">Arama başlığı (opsiyonel)</Label>
            <Input
              id="blog-seo-title"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Boşsa yazı başlığı kullanılır"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="blog-seo-desc">
              Meta açıklama (öneri ~155 karakter)
            </Label>
            <Textarea
              id="blog-seo-desc"
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
            <Label htmlFor="blog-cover-alt">Kapak görseli alt metni</Label>
            <Input
              id="blog-cover-alt"
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
            mode === 'create'
              ? () => setInlineImageEditHintOpen(true)
              : undefined
          }
        />
      </div>

      <Dialog
        open={inlineImageEditHintOpen}
        onOpenChange={setInlineImageEditHintOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gelişmiş görsel düzenleme</DialogTitle>
            <DialogDescription className="text-left">
              İçerik alanına eklediğiniz görselleri boyutlandırma, hizalama ve
              kırpma araçlarıyla düzenlemek için önce bu yazıyı kaydedin.
              Kaydettikten sonra düzenleme sayfasında bu seçeneklerin tamamına
              erişebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setInlineImageEditHintOpen(false)}
            >
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
          {mode === 'create' ? 'Blog oluştur' : 'Blog güncelle'}
        </Button>
      </div>
    </div>
  )
}
