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
import type { AdminSliderGroupRow } from './types'

const SLIDER_TYPES = sliderTypeEnum.enumValues

type GroupStatus = (typeof sliderGroupStatusEnum.enumValues)[number]

export function UpdateSliderGroupDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSliderGroupRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [type, setType] = useState<(typeof SLIDER_TYPES)[number]>(row.type)
  const [name, setName] = useState(row.name)
  const [description, setDescription] = useState(row.description ?? '')
  const [status, setStatus] = useState<GroupStatus>(row.status)
  const [autoplayIntervalInput, setAutoplayIntervalInput] = useState(
    row.autoplayInterval ? String(row.autoplayInterval) : ''
  )

  useEffect(() => {
    if (!open) return
    setType(row.type)
    setName(row.name)
    setDescription(row.description ?? '')
    setStatus(row.status)
    setAutoplayIntervalInput(
      row.autoplayInterval ? String(row.autoplayInterval) : ''
    )
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.slider.updateGroup.mutationOptions({
      onSuccess: () => {
        toast.success('Slider grubu güncellendi')
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
      id: row.id,
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
          <DialogTitle>Slider grubunu düzenle</DialogTitle>
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
            <Label htmlFor="edit-slider-group-name">Grup adı</Label>
            <Input
              id="edit-slider-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-slider-group-desc">Açıklama</Label>
            <Textarea
              id="edit-slider-group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-slider-group-autoplay-interval">
              Autoplay Interval (ms)
            </Label>
            <Input
              id="edit-slider-group-autoplay-interval"
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
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
