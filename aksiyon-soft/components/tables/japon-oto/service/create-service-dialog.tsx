'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export function CreateJaponServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const reset = () => {
    setName('')
    setDescription('')
    setIsActive(true)
  }

  const { mutateAsync, isPending } = useMutation(
    trpc.japonService.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Servis eklendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonService.list.queryKey(),
        })
        onOpenChange(false)
        reset()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Ad gerekli')
      return
    }
    await mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni servis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="japon-service-name">Ad</Label>
            <Input
              id="japon-service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Örn. Yağ ve filtre değişimi"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="japon-service-desc">Açıklama</Label>
            <Textarea
              id="japon-service-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Opsiyonel"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="japon-service-active" className="text-sm">
              Aktif
            </Label>
            <Switch
              id="japon-service-active"
              checked={isActive}
              onCheckedChange={setIsActive}
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
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
