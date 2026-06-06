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

export function UpdateMediaDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminMediaRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [mediaGroupId, setMediaGroupId] = useState(row.mediaGroupId)
  const [type, setType] = useState<(typeof MEDIA_TYPES)[number]>(
    row.type as (typeof MEDIA_TYPES)[number]
  )
  const [title, setTitle] = useState(row.title)
  const [description, setDescription] = useState(row.description ?? '')
  const [imageAlt, setImageAlt] = useState(row.imageAlt ?? '')
  const [parentMediaId, setParentMediaId] = useState<string>(
    row.parentMediaId ?? 'none'
  )
  const [fileId, setFileId] = useState<string>(row.fileId)
  const [uploading, setUploading] = useState(false)

  const { data: groups } = useQuery(
    trpc.mediaGroup.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const { data: mediaRows } = useQuery(
    trpc.media.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const groupOptions = useMemo(
    () => (groups?.data ?? []) as AdminMediaGroupRow[],
    [groups]
  )
  const parentOptions = useMemo(
    () =>
      ((mediaRows?.data ?? []) as AdminMediaRow[]).filter(
        (item) => item.id !== row.id
      ),
    [mediaRows, row.id]
  )

  useEffect(() => {
    if (!open) return
    setMediaGroupId(row.mediaGroupId)
    setType(row.type as (typeof MEDIA_TYPES)[number])
    setTitle(row.title)
    setDescription(row.description ?? '')
    setImageAlt(row.imageAlt ?? '')
    setParentMediaId(row.parentMediaId ?? 'none')
    setFileId(row.fileId)
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.media.update.mutationOptions({
      onSuccess: () => {
        toast.success('Medya kaydı güncellendi')
        queryClient.invalidateQueries({ queryKey: trpc.media.list.queryKey() })
        onOpenChange(false)
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
      toast.success('Dosya güncellendi')
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
      toast.error('Dosya seçin')
      return
    }
    if (!title.trim()) {
      toast.error('Başlık gerekli')
      return
    }

    await mutateAsync({
      id: row.id,
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
          <DialogTitle>Medya kaydını düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="edit-media-group-select">Medya grubu</Label>
            <Select value={mediaGroupId} onValueChange={setMediaGroupId}>
              <SelectTrigger id="edit-media-group-select">
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
            <Label htmlFor="edit-media-type-select">Durum tipi</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as (typeof MEDIA_TYPES)[number])
              }
            >
              <SelectTrigger id="edit-media-type-select">
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
            <Label htmlFor="edit-media-title">Başlık</Label>
            <Input
              id="edit-media-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-media-parent">Üst medya</Label>
            <Select value={parentMediaId} onValueChange={setParentMediaId}>
              <SelectTrigger id="edit-media-parent">
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
            <Label htmlFor="edit-media-description">Açıklama</Label>
            <Textarea
              id="edit-media-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-media-image-alt">Görsel alt metni</Label>
            <Input
              id="edit-media-image-alt"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-media-file">Dosya</Label>
            <Input
              id="edit-media-file"
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={uploading}
            />
            <p className="text-muted-foreground text-xs">
              Mevcut dosya id: {fileId.slice(0, 8)}...
            </p>
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
