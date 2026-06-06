'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { uploadReferenceLogo } from '@/lib/reference/client-upload'
import type { AdminReferenceRow } from './reference-data-table'

export function UpdateReferenceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminReferenceRow
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(row.name)
  const [sector, setSector] = useState(row.sector)
  const [description, setDescription] = useState(row.description ?? '')
  const [summary, setSummary] = useState(row.summary ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(row.websiteUrl ?? '')
  const [logoId, setLogoId] = useState<string | null>(row.logoId)
  const [logoAlt, setLogoAlt] = useState(row.logoAlt ?? '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(row.name)
    setSector(row.sector)
    setDescription(row.description ?? '')
    setSummary(row.summary ?? '')
    setWebsiteUrl(row.websiteUrl ?? '')
    setLogoId(row.logoId)
    setLogoAlt(row.logoAlt ?? '')
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.reference.update.mutationOptions({
      onSuccess: () => {
        toast.success('Güncellendi')
        queryClient.invalidateQueries({
          queryKey: trpc.reference.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setUploading(true)
    try {
      const id = await uploadReferenceLogo(f)
      setLogoId(id)
      toast.success('Logo güncellendi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme hatası')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!name.trim() || !sector.trim()) {
      toast.error('Ad ve sektör gerekli')
      return
    }
    await mutateAsync({
      id: row.id,
      name: name.trim(),
      sector: sector.trim(),
      description: description.trim() || null,
      summary: summary.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      logoId: logoId ?? null,
      logoAlt: logoAlt.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Referansı düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-name">Ad</Label>
            <Input
              id="e-ref-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-sector">Sektör</Label>
            <Input
              id="e-ref-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-desc">Kısa açıklama</Label>
            <Textarea
              id="e-ref-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-sum">Özet</Label>
            <Textarea
              id="e-ref-sum"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-url">Web sitesi</Label>
            <Input
              id="e-ref-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              type="url"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Logo (yeni dosya = değiştir)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={uploading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ref-logo-alt">Logo alt metni</Label>
            <Input
              id="e-ref-logo-alt"
              value={logoAlt}
              onChange={(e) => setLogoAlt(e.target.value)}
              placeholder="Ekran okuyucular için"
            />
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
