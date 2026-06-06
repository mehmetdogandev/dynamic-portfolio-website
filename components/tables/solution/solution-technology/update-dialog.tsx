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
import { Textarea } from '@/components/ui/textarea'
import type { AdminSolutionTechnologyRow } from './data-table'

export function UpdateSolutionTechnologyDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminSolutionTechnologyRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(row.name)
  const [description, setDescription] = useState(row.description)

  useEffect(() => {
    if (!open) return
    setName(row.name)
    setDescription(row.description)
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.solutionTechnology.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Teknoloji güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.solutionTechnology.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Ad ve açıklama gerekli')
      return
    }
    await mutateAsync({
      id: row.id,
      name: name.trim(),
      description: description.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Teknolojiyi düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-solution-tech-name">Ad</Label>
            <Input
              id="edit-solution-tech-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-solution-tech-desc">Açıklama</Label>
            <Textarea
              id="edit-solution-tech-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
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
