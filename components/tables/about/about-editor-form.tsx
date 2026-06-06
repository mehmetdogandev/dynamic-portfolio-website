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

interface AboutEditorFormProps {
  mode: 'create' | 'edit'
  aboutId?: string
  initialValues?: {
    lead: string
    intro: string
    introPart2: string | null
    introPart3: string | null
    introPart4: string | null
    seoTitle: string | null
    seoDescription: string | null
    robotsIndex: boolean
  }
}

export function AboutEditorForm({
  mode,
  aboutId,
  initialValues,
}: AboutEditorFormProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [lead, setLead] = useState(initialValues?.lead ?? '')
  const [intro, setIntro] = useState(initialValues?.intro ?? '')
  const [introPart2, setIntroPart2] = useState(initialValues?.introPart2 ?? '')
  const [introPart3, setIntroPart3] = useState(initialValues?.introPart3 ?? '')
  const [introPart4, setIntroPart4] = useState(initialValues?.introPart4 ?? '')
  const [seoTitle, setSeoTitle] = useState(initialValues?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(
    initialValues?.seoDescription ?? ''
  )
  const [robotsIndex, setRobotsIndex] = useState(
    initialValues?.robotsIndex ?? true
  )

  const createMutation = useMutation(
    trpc.aboutPageProfile.create.mutationOptions({
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.aboutPageProfile.list.queryKey(),
        })
        toast.success('Hakkımda profili oluşturuldu')
        router.push(adminHref(`/about/${result.id}`))
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    trpc.aboutPageProfile.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.aboutPageProfile.list.queryKey(),
        })
        toast.success('Hakkımda profili güncellendi')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async () => {
    if (!lead.trim() || !intro.trim()) {
      toast.error('Özet ve giriş metni zorunludur')
      return
    }

    const payload = {
      lead: lead.trim(),
      intro: intro.trim(),
      introPart2: introPart2.trim() || null,
      introPart3: introPart3.trim() || null,
      introPart4: introPart4.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      robotsIndex,
    }

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!aboutId) {
      toast.error('Profil kimliği bulunamadı')
      return
    }

    await updateMutation.mutateAsync({
      id: aboutId,
      ...payload,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="about-lead">Özet (lead)</Label>
        <Input
          id="about-lead"
          value={lead}
          onChange={(event) => setLead(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about-intro">Giriş</Label>
        <Textarea
          id="about-intro"
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about-intro-2">Giriş bölüm 2</Label>
        <Textarea
          id="about-intro-2"
          value={introPart2}
          onChange={(event) => setIntroPart2(event.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about-intro-3">Giriş bölüm 3</Label>
        <Textarea
          id="about-intro-3"
          value={introPart3}
          onChange={(event) => setIntroPart3(event.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about-intro-4">Giriş bölüm 4</Label>
        <Textarea
          id="about-intro-4"
          value={introPart4}
          onChange={(event) => setIntroPart4(event.target.value)}
          rows={3}
        />
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
              placeholder="Boşsa özet metin kullanılır"
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

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Profil oluştur' : 'Profil güncelle'}
        </Button>
      </div>
    </div>
  )
}
