'use client'

import { useEffect, useState } from 'react'
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
import type { JaponServiceRow } from './service-data-table'

export function UpdateJaponServiceDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponServiceRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(row.name)
  const [description, setDescription] = useState(row.description ?? '')
  const [isActive, setIsActive] = useState(row.isActive)

  useEffect(() => {
    if (!open) return
    setName(row.name)
    setDescription(row.description ?? '')
    setIsActive(row.isActive)
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.japonService.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Servis güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonService.list.queryKey(),
        })
        onOpenChange(false)
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
      id: row.id,
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Servisi düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-japon-service-name">Ad</Label>
            <Input
              id="edit-japon-service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-japon-service-desc">Açıklama</Label>
            <Textarea
              id="edit-japon-service-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="edit-japon-service-active" className="text-sm">
              Aktif
            </Label>
            <Switch
              id="edit-japon-service-active"
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
