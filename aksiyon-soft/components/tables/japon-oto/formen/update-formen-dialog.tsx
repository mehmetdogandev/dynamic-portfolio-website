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
import type { JaponFormenRow } from './formen-data-table'

export function UpdateJaponFormenDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponFormenRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(row.name)
  const [surname, setSurname] = useState(row.surname ?? '')
  const [phone, setPhone] = useState(row.phone ?? '')
  const [notes, setNotes] = useState(row.notes ?? '')
  const [isActive, setIsActive] = useState(row.isActive)

  useEffect(() => {
    if (!open) return
    setName(row.name)
    setSurname(row.surname ?? '')
    setPhone(row.phone ?? '')
    setNotes(row.notes ?? '')
    setIsActive(row.isActive)
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.japonFormen.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Formen güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonFormen.list.queryKey(),
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
      surname: surname.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Formeni düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-japon-formen-name">Ad</Label>
              <Input
                id="edit-japon-formen-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-japon-formen-surname">Soyad</Label>
              <Input
                id="edit-japon-formen-surname"
                value={surname}
                onChange={(event) => setSurname(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-japon-formen-phone">Telefon</Label>
            <Input
              id="edit-japon-formen-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-japon-formen-notes">Notlar</Label>
            <Textarea
              id="edit-japon-formen-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="edit-japon-formen-active" className="text-sm">
              Aktif
            </Label>
            <Switch
              id="edit-japon-formen-active"
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
