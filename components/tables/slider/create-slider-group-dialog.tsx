'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sliderGroupStatusEnum, sliderTypeEnum } from '@/lib/db/schema'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sliderTypeLabel } from '@/lib/website/slider-hero-type'
import {
  HERO_AUTOPLAY_MAX_MS,
  HERO_AUTOPLAY_MIN_MS,
} from '@/lib/website/slider-autoplay'

const SLIDER_TYPES = sliderTypeEnum.enumValues

type GroupStatus = (typeof sliderGroupStatusEnum.enumValues)[number]

export function CreateSliderGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [type, setType] = useState<(typeof SLIDER_TYPES)[number]>(
    SLIDER_TYPES[0]!
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<GroupStatus>('DRAFT')
  const [autoplayIntervalInput, setAutoplayIntervalInput] = useState('')

  useEffect(() => {
    if (!open) return
    setType(SLIDER_TYPES[0]!)
    setName('')
    setDescription('')
    setStatus('DRAFT')
    setAutoplayIntervalInput('')
  }, [open])

  const { mutateAsync, isPending } = useMutation(
    trpc.slider.createGroup.mutationOptions({
      onSuccess: () => {
        toast.success('Slider grubu oluşturuldu')
        void queryClient.invalidateQueries({
          queryKey: trpc.slider.listGroups.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Grup adı gerekli')
      return
    }
    const parsedInterval = autoplayIntervalInput.trim()
      ? Number(autoplayIntervalInput)
      : null
    if (
      parsedInterval !== null &&
      (!Number.isInteger(parsedInterval) ||
        parsedInterval < HERO_AUTOPLAY_MIN_MS ||
        parsedInterval > HERO_AUTOPLAY_MAX_MS)
    ) {
      toast.error(
        `Autoplay interval ${HERO_AUTOPLAY_MIN_MS}-${HERO_AUTOPLAY_MAX_MS} ms arasında olmalı`
      )
      return
    }

    await mutateAsync({
      type,
      name: name.trim(),
      description: description.trim() || null,
      status,
      autoplayInterval: parsedInterval,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni slider grubu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Slider tipi</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as (typeof SLIDER_TYPES)[number])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLIDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {sliderTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-slider-group-name">Grup adı</Label>
            <Input
              id="new-slider-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Ana sayfa hero"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-slider-group-desc">Açıklama</Label>
            <Textarea
              id="new-slider-group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-slider-group-autoplay-interval">
              Autoplay Interval (ms)
            </Label>
            <Input
              id="new-slider-group-autoplay-interval"
              type="number"
              min={HERO_AUTOPLAY_MIN_MS}
              max={HERO_AUTOPLAY_MAX_MS}
              step={100}
              value={autoplayIntervalInput}
              onChange={(e) => setAutoplayIntervalInput(e.target.value)}
              placeholder={`Boş bırak: varsayılan (${HERO_AUTOPLAY_MIN_MS}-${HERO_AUTOPLAY_MAX_MS})`}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Durum</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as GroupStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Taslak</SelectItem>
                <SelectItem value="PUBLISHED">Yayında</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={isPending}
            onClick={() => void submit()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
