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

interface TechnologyEditorFormProps {
  mode: 'create' | 'edit'
  technologyId?: string
  initialValues?: {
    category: string
    name: string
  }
}

export function TechnologyEditorForm({
  mode,
  technologyId,
  initialValues,
}: TechnologyEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [name, setName] = useState(initialValues?.name ?? '')

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutTechnology.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutTechnology.listReorderScope.queryKey(),
    })
  }

  const createMutation = useMutation(
    trpc.aboutTechnology.create.mutationOptions({
      onSuccess: async (result) => {
        await invalidate()
        toast.success('Teknoloji kaydı oluşturuldu')
        router.push(adminHref(`/hakkimda/technology/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.aboutTechnology.update.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Teknoloji kaydı güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    if (!category.trim() || !name.trim()) {
      toast.error('Kategori ve ad zorunludur')
      return
    }

    const payload = {
      category: category.trim(),
      name: name.trim(),
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!technologyId) {
      toast.error('Teknoloji kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: technologyId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="technology-category">Kategori</Label>
          <Input
            id="technology-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="technology-name">Ad</Label>
          <Input
            id="technology-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(adminHref('/hakkimda/technology'))}
        >
          Listeye dön
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Teknoloji oluştur' : 'Teknoloji güncelle'}
        </Button>
      </div>
    </div>
  )
}
