'use client'

import { useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminHref } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ExperienceEditorFormProps {
  mode: 'create' | 'edit'
  experienceId?: string
  initialValues?: {
    title: string
    company: string
    location: string | null
    startDate: string
    endDate: string | null
    description: string | null
    fileId: string | null
  }
}

export function ExperienceEditorForm({
  mode,
  experienceId,
  initialValues,
}: ExperienceEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [company, setCompany] = useState(initialValues?.company ?? '')
  const [location, setLocation] = useState(initialValues?.location ?? '')
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? ''
  )
  const [fileId, setFileId] = useState<string | null>(
    initialValues?.fileId ?? null
  )
  const [isUploading, setIsUploading] = useState(false)

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutExperience.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutExperience.listReorderScope.queryKey(),
    })
  }

  const createMutation = useMutation(
    trpc.aboutExperience.create.mutationOptions({
      onSuccess: async (result) => {
        await invalidate()
        toast.success('Deneyim kaydı oluşturuldu')
        router.push(adminHref(`/hakkimda/experience/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.aboutExperience.update.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Deneyim kaydı güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploading

  const onLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('prefix', 'about/experience')
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? 'Dosya yüklenemedi')
      }
      const data = (await response.json()) as { id: string }
      setFileId(data.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dosya yüklenemedi')
    } finally {
      setIsUploading(false)
    }
  }

  const submit = async () => {
    if (!title.trim() || !company.trim() || !startDate.trim()) {
      toast.error('Başlık, şirket ve başlangıç tarihi zorunludur')
      return
    }

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || null,
      startDate: startDate.trim(),
      endDate: endDate.trim() || null,
      description: description.trim() || null,
      fileId,
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!experienceId) {
      toast.error('Deneyim kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: experienceId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="experience-title">Başlık</Label>
          <Input
            id="experience-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience-company">Şirket</Label>
          <Input
            id="experience-company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience-location">Konum (opsiyonel)</Label>
          <Input
            id="experience-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience-start">Başlangıç</Label>
          <Input
            id="experience-start"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            placeholder="Örn. 2020"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience-end">Bitiş (opsiyonel)</Label>
          <Input
            id="experience-end"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            placeholder="Örn. 2024 veya Devam"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="experience-description">Açıklama (opsiyonel)</Label>
        <Textarea
          id="experience-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fileId ? undefined : 'experience-logo'}>
          Logo (opsiyonel)
        </Label>
        {isUploading && !fileId ? (
          <div className="border-muted-foreground/25 flex h-24 w-24 items-center justify-center rounded-md border bg-muted/30">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : fileId ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-md border">
            <img
              src={`/api/files/${fileId}/view`}
              alt={company.trim() || title.trim() || 'Logo'}
              className="size-full object-contain"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background/90 absolute right-0 top-0 h-7 w-7 shadow-sm"
              aria-label="Logoyu kaldır"
              disabled={isUploading}
              onClick={() => setFileId(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Input
            id="experience-logo"
            type="file"
            accept="image/*"
            onChange={onLogoFile}
            disabled={isUploading}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(adminHref('/hakkimda/experience'))}
        >
          Listeye dön
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Deneyim oluştur' : 'Deneyim güncelle'}
        </Button>
      </div>
    </div>
  )
}
