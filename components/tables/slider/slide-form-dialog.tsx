'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadSliderFile } from '@/lib/slider/client-upload'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AdminSliderSlideRow } from './types'

export function SlideFormDialog({
  open,
  onOpenChange,
  groupId,
  mode,
  slide,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  mode: 'create' | 'edit'
  slide?: AdminSliderSlideRow | null
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [fileId, setFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPrimary, setShowPrimary] = useState(true)
  const [showSecondary, setShowSecondary] = useState(true)
  const [primaryLabel, setPrimaryLabel] = useState('')
  const [primaryHref, setPrimaryHref] = useState('')
  const [secondaryLabel, setSecondaryLabel] = useState('')
  const [secondaryHref, setSecondaryHref] = useState('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && slide) {
      setTitle(slide.title)
      setSubtitle(slide.subtitle ?? '')
      setImageAlt(slide.imageAlt ?? '')
      setFileId(slide.fileId)
      setShowPrimary(slide.showPrimaryButton)
      setShowSecondary(slide.showSecondaryButton)
      setPrimaryLabel(slide.primaryLabel ?? '')
      setPrimaryHref(slide.primaryHref ?? '')
      setSecondaryLabel(slide.secondaryLabel ?? '')
      setSecondaryHref(slide.secondaryHref ?? '')
    } else {
      setTitle('')
      setSubtitle('')
      setImageAlt('')
      setFileId(null)
      setShowPrimary(true)
      setShowSecondary(true)
      setPrimaryLabel('')
      setPrimaryHref('')
      setSecondaryLabel('')
      setSecondaryHref('')
    }
  }, [open, mode, slide])

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.slider.listGroups.queryKey(),
    })
  }

  const { mutateAsync: createMutate, isPending: createPending } = useMutation(
    trpc.slider.createSlide.mutationOptions({
      onSuccess: () => {
        toast.success('Slayt eklendi')
        invalidate()
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const { mutateAsync: updateMutate, isPending: updatePending } = useMutation(
    trpc.slider.updateSlide.mutationOptions({
      onSuccess: () => {
        toast.success('Slayt güncellendi')
        invalidate()
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const isPending = createPending || updatePending

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setUploading(true)
    try {
      const id = await uploadSliderFile(f)
      setFileId(id)
      toast.success('Dosya yüklendi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!fileId) {
      toast.error('Dosya yükleyin')
      return
    }
    const payload = {
      fileId,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      imageAlt: imageAlt.trim() || null,
      showPrimaryButton: showPrimary,
      showSecondaryButton: showSecondary,
      primaryLabel: primaryLabel.trim() || null,
      primaryHref: primaryHref.trim() || null,
      secondaryLabel: secondaryLabel.trim() || null,
      secondaryHref: secondaryHref.trim() || null,
    }
    if (mode === 'create') {
      await createMutate({ groupId, ...payload })
    } else if (slide) {
      await updateMutate({ id: slide.id, ...payload })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Slayt ekle' : 'Slaytı düzenle'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="slide-file">Medya dosyası</Label>
            <Input
              id="slide-file"
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => void onFile(e)}
            />
            {fileId ? (
              <p className="text-muted-foreground text-xs">
                Dosya seçildi (id: {fileId.slice(0, 8)}…)
              </p>
            ) : null}
            {uploading ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" /> Yükleniyor…
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slide-title">Başlık</Label>
            <Input
              id="slide-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slide-subtitle">Alt başlık</Label>
            <Textarea
              id="slide-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slide-alt">Görsel alt metni (isteğe bağlı)</Label>
            <Input
              id="slide-alt"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <Label htmlFor="sw-primary" className="cursor-pointer">
              Birincil buton
            </Label>
            <Switch
              id="sw-primary"
              checked={showPrimary}
              onCheckedChange={setShowPrimary}
            />
          </div>
          {showPrimary ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Birincil etiket</Label>
                <Input
                  value={primaryLabel}
                  onChange={(e) => setPrimaryLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Birincil bağlantı</Label>
                <Input
                  value={primaryHref}
                  onChange={(e) => setPrimaryHref(e.target.value)}
                  placeholder="/iletisim"
                />
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <Label htmlFor="sw-secondary" className="cursor-pointer">
              İkincil buton
            </Label>
            <Switch
              id="sw-secondary"
              checked={showSecondary}
              onCheckedChange={setShowSecondary}
            />
          </div>
          {showSecondary ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>İkincil etiket</Label>
                <Input
                  value={secondaryLabel}
                  onChange={(e) => setSecondaryLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>İkincil bağlantı</Label>
                <Input
                  value={secondaryHref}
                  onChange={(e) => setSecondaryHref(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button
            type="button"
            disabled={isPending || uploading}
            onClick={() => void submit()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
