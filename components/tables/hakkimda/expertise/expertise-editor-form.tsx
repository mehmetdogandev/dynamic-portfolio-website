'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminHref } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function parseKeywords(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ]
}

function formatKeywords(keywords: string[]): string {
  return keywords.join('\n')
}

interface ExpertiseEditorFormProps {
  mode: 'create' | 'edit'
  expertiseId?: string
  initialValues?: {
    title: string
    description: string
    keywords: string[]
  }
}

export function ExpertiseEditorForm({
  mode,
  expertiseId,
  initialValues,
}: ExpertiseEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? ''
  )
  const [keywordsRaw, setKeywordsRaw] = useState(
    formatKeywords(initialValues?.keywords ?? [])
  )

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutExpertise.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutExpertise.listReorderScope.queryKey(),
    })
  }

  const createMutation = useMutation(
    trpc.aboutExpertise.create.mutationOptions({
      onSuccess: async (result) => {
        await invalidate()
        toast.success('Uzmanlık alanı oluşturuldu')
        router.push(adminHref(`/hakkimda/expertise/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.aboutExpertise.update.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Uzmanlık alanı güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Başlık ve açıklama zorunludur')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      keywords: parseKeywords(keywordsRaw),
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!expertiseId) {
      toast.error('Uzmanlık alanı kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: expertiseId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="expertise-title">Başlık</Label>
        <Input
          id="expertise-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expertise-description">Açıklama</Label>
        <Textarea
          id="expertise-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expertise-keywords">Anahtar kelimeler</Label>
        <Textarea
          id="expertise-keywords"
          value={keywordsRaw}
          onChange={(event) => setKeywordsRaw(event.target.value)}
          rows={4}
          placeholder="Her satıra bir kelime veya virgülle ayırın"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(adminHref('/hakkimda/expertise'))}
        >
          Listeye dön
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create'
            ? 'Uzmanlık alanı oluştur'
            : 'Uzmanlık alanı güncelle'}
        </Button>
      </div>
    </div>
  )
}
