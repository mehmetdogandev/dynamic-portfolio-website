'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { BlogContent } from '@/lib/blog/content'
import { adminHref } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
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
import { Textarea } from '@/components/ui/textarea'
import { BlogContentEditor } from '@/components/tables/blog/blog-content-editor'

interface AboutEditorFormProps {
  mode: 'create' | 'edit'
  aboutId?: string
  initialValues?: {
    title: string
    slug: string
    content: BlogContent
    isPublished: boolean
    publishedAt: Date | null
    seoTitle: string | null
    seoDescription: string | null
    robotsIndex: boolean
  }
}

const EMPTY_CONTENT: BlogContent = {
  type: 'doc',
  version: 1,
  html: '<p></p>',
  imageFileIds: [],
  videoFileIds: [],
}

export function AboutEditorForm({
  mode,
  aboutId,
  initialValues,
}: AboutEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [slug, setSlug] = useState(initialValues?.slug ?? '')
  const [content, setContent] = useState<BlogContent>(
    initialValues?.content ?? EMPTY_CONTENT
  )
  const [isPublished, setIsPublished] = useState(
    initialValues?.isPublished ?? false
  )
  const [seoTitle, setSeoTitle] = useState(initialValues?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(
    initialValues?.seoDescription ?? ''
  )
  const [robotsIndex, setRobotsIndex] = useState(
    initialValues?.robotsIndex ?? true
  )
  const [inlineMediaHint, setInlineMediaHint] = useState<
    null | 'image' | 'video'
  >(null)

  const createMutation = useMutation(
    trpc.about.create.mutationOptions({
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.about.list.queryKey(),
        })
        toast.success('Hakkımızda kaydı oluşturuldu')
        router.push(adminHref(`/about/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.about.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.about.list.queryKey(),
        })
        toast.success('Hakkımızda kaydı güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Başlık ve slug alanları zorunludur')
      return
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      isPublished,
      publishedAt: isPublished
        ? (initialValues?.publishedAt ?? new Date())
        : null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      robotsIndex,
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!aboutId) {
      toast.error('Hakkımızda kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: aboutId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="about-title">Başlık</Label>
          <Input
            id="about-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="about-slug">Slug</Label>
          <Input
            id="about-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </div>
      </div>

      <div className="border-muted space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">SEO</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="about-seo-title">Arama başlığı (opsiyonel)</Label>
            <Input
              id="about-seo-title"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Boşsa başlık kullanılır"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="about-seo-desc">
              Meta açıklama (öneri ~155 karakter)
            </Label>
            <Textarea
              id="about-seo-desc"
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              rows={3}
              maxLength={320}
              placeholder="Boşsa içerik özeti kullanılır"
            />
            <p className="text-muted-foreground text-xs">
              {seoDescription.length}/320
            </p>
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
                  Kaydettikten sonra düzenleme sayfasında bu seçeneklerin
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
          Yayınla (önceki yayın otomatik taslağa alınır)
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Hakkımızda oluştur' : 'Hakkımızda güncelle'}
        </Button>
      </div>
    </div>
  )
}
