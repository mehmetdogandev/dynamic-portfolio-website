'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { mediaTypeEnum } from '@/lib/db/schema'
import { uploadMediaFile } from '@/lib/media/client-upload'
import { useTRPC } from '@/lib/trpc/client'
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AdminMediaGroupRow } from '@/components/tables/media-group/media-group-data-table'
import type { AdminMediaRow } from './types'

const MEDIA_TYPES = mediaTypeEnum.enumValues

export function CreateMediaDialog({
  open,
  onOpenChange,
  defaultMediaGroupId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMediaGroupId?: string | null
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [mediaGroupId, setMediaGroupId] = useState('')
  const [type, setType] = useState<(typeof MEDIA_TYPES)[number]>(
    MEDIA_TYPES[0]!
  )
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [parentMediaId, setParentMediaId] = useState<string>('none')
  const [fileId, setFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: groups } = useQuery(
    trpc.mediaGroup.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const { data: mediaRows } = useQuery(
    trpc.media.list.queryOptions({
      ...adminListFetchAllInput('sortOrder'),
      columnFilters: defaultMediaGroupId
        ? { mediaGroupId: defaultMediaGroupId }
        : undefined,
    })
  )
  const groupOptions = useMemo(
    () => (groups?.data ?? []) as AdminMediaGroupRow[],
    [groups]
  )
  const parentOptions = useMemo(
    () => (mediaRows?.data ?? []) as AdminMediaRow[],
    [mediaRows]
  )
  useEffect(() => {
    if (open && defaultMediaGroupId) {
      setMediaGroupId(defaultMediaGroupId)
    }
  }, [open, defaultMediaGroupId])

  const { mutateAsync, isPending } = useMutation(
    trpc.media.create.mutationOptions({
      onSuccess: () => {
        toast.success('Medya kaydı eklendi')
        queryClient.invalidateQueries({ queryKey: trpc.media.list.queryKey() })
        onOpenChange(false)
        setMediaGroupId('')
        setType(MEDIA_TYPES[0]!)
        setTitle('')
        setDescription('')
        setImageAlt('')
        setParentMediaId('none')
        setFileId(null)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const uploadedFileId = await uploadMediaFile(file)
      setFileId(uploadedFileId)
      toast.success('Dosya yüklendi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme hatası')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!mediaGroupId) {
      toast.error('Medya grubu seçin')
      return
    }
    if (!fileId) {
      toast.error('Dosya yükleyin')
      return
    }
    if (!title.trim()) {
      toast.error('Başlık gerekli')
      return
    }
    await mutateAsync({
      mediaGroupId,
      fileId,
      type,
      title: title.trim(),
      description: description.trim() || null,
      imageAlt: imageAlt.trim() || null,
      parentMediaId: parentMediaId === 'none' ? null : parentMediaId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni medya</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="media-group-select">Medya grubu</Label>
            <Select value={mediaGroupId} onValueChange={setMediaGroupId}>
              <SelectTrigger id="media-group-select">
                <SelectValue placeholder="Grup seçin" />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-type-select">Durum tipi</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as (typeof MEDIA_TYPES)[number])
              }
            >
              <SelectTrigger id="media-type-select">
                <SelectValue placeholder="Tip seçin" />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map((mediaType) => (
                  <SelectItem key={mediaType} value={mediaType}>
                    {mediaType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-title">Başlık</Label>
            <Input
              id="media-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-parent">Üst medya (opsiyonel)</Label>
            <Select value={parentMediaId} onValueChange={setParentMediaId}>
              <SelectTrigger id="media-parent">
                <SelectValue placeholder="Üst medya seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok</SelectItem>
                {parentOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-description">Açıklama</Label>
            <Textarea
              id="media-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-image-alt">
              Görsel alt metni (opsiyonel)
            </Label>
            <Input
              id="media-image-alt"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Boşsa başlık kullanılır"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-file">Dosya</Label>
            <Input
              id="media-file"
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={uploading}
            />
            {fileId ? (
              <p className="text-muted-foreground text-xs">
                Dosya seçildi (id: {fileId.slice(0, 8)}...)
              </p>
            ) : null}
          </div>
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
            onClick={submit}
            disabled={isPending || uploading}
          >
            {(isPending || uploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
