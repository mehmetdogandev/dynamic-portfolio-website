'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminHref } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
import {
  HOME_HIGHLIGHT_ICON_KEYS,
  HOME_HIGHLIGHT_ICON_LABELS,
  type HomeHighlightIconKey,
} from '@/lib/website/home-highlight-icons'
import { Button } from '@/components/ui/button'
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

interface HighlightEditorFormProps {
  mode: 'create' | 'edit'
  highlightId?: string
  initialValues?: {
    title: string
    description: string
    iconKey: HomeHighlightIconKey | string
  }
}

export function HighlightEditorForm({
  mode,
  highlightId,
  initialValues,
}: HighlightEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? ''
  )
  const [iconKey, setIconKey] = useState<HomeHighlightIconKey>(
    (initialValues?.iconKey as HomeHighlightIconKey) ?? 'code2'
  )

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.homeHighlight.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.homeHighlight.listReorderScope.queryKey(),
    })
  }

  const createMutation = useMutation(
    trpc.homeHighlight.create.mutationOptions({
      onSuccess: async (result) => {
        await invalidate()
        toast.success('Kart oluşturuldu')
        router.push(adminHref(`/anasayfa/neler-yapiyorum/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.homeHighlight.update.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Kart güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    const payload = {
      title: title.trim(),
      description: description.trim(),
      iconKey,
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!highlightId) {
      toast.error('Kayıt kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({ id: highlightId, ...payload })
  }

  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="highlight-title">Başlık</Label>
        <Input
          id="highlight-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ör. Full-Stack Web"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="highlight-description">Açıklama</Label>
        <Textarea
          id="highlight-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Kart açıklaması"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>İkon</Label>
        <Select
          value={iconKey}
          onValueChange={(v) => setIconKey(v as HomeHighlightIconKey)}
        >
          <SelectTrigger>
            <SelectValue placeholder="İkon seçin" />
          </SelectTrigger>
          <SelectContent>
            {HOME_HIGHLIGHT_ICON_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {HOME_HIGHLIGHT_ICON_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {mode === 'create' ? 'Oluştur' : 'Kaydet'}
      </Button>
    </form>
  )
}
