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

interface InterestEditorFormProps {
  mode: 'create' | 'edit'
  interestId?: string
  initialValues?: {
    label: string
  }
}

export function InterestEditorForm({
  mode,
  interestId,
  initialValues,
}: InterestEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [label, setLabel] = useState(initialValues?.label ?? '')

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutInterest.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.aboutInterest.listReorderScope.queryKey(),
    })
  }

  const createMutation = useMutation(
    trpc.aboutInterest.create.mutationOptions({
      onSuccess: async (result) => {
        await invalidate()
        toast.success('İlgi alanı oluşturuldu')
        router.push(adminHref(`/hakkimda/interest/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.aboutInterest.update.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('İlgi alanı güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    if (!label.trim()) {
      toast.error('Etiket zorunludur')
      return
    }

    const payload = { label: label.trim() }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!interestId) {
      toast.error('İlgi alanı kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: interestId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="interest-label">Etiket</Label>
        <Input
          id="interest-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(adminHref('/hakkimda/interest'))}
        >
          Listeye dön
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'İlgi alanı oluştur' : 'İlgi alanı güncelle'}
        </Button>
      </div>
    </div>
  )
}
