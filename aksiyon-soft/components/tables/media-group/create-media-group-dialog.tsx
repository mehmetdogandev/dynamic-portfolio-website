'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
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
import type { AdminMediaGroupRow } from './media-group-data-table'

export function CreateMediaGroupDialog({
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
  const [parentMediaGroupId, setParentMediaGroupId] = useState<string>('none')
  const { data: groups } = useQuery(
    trpc.mediaGroup.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const parentOptions = useMemo(
    () => (groups?.data ?? []) as AdminMediaGroupRow[],
    [groups]
  )

  const { mutateAsync, isPending } = useMutation(
    trpc.mediaGroup.create.mutationOptions({
      onSuccess: () => {
        toast.success('Medya grubu eklendi')
        queryClient.invalidateQueries({
          queryKey: trpc.mediaGroup.list.queryKey(),
        })
        onOpenChange(false)
        setName('')
        setDescription('')
        setParentMediaGroupId('none')
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Grup adı gerekli')
      return
    }

    await mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      parentMediaGroupId:
        parentMediaGroupId === 'none' ? null : parentMediaGroupId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni medya grubu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="media-group-name">Grup adı</Label>
            <Input
              id="media-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Konferanslar"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-group-parent">Üst grup</Label>
            <Select
              value={parentMediaGroupId}
              onValueChange={setParentMediaGroupId}
            >
              <SelectTrigger id="media-group-parent">
                <SelectValue placeholder="Üst grup seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok (kök grup)</SelectItem>
                {parentOptions.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-group-description">Açıklama</Label>
            <Textarea
              id="media-group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
