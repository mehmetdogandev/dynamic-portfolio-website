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
import { Textarea } from '@/components/ui/textarea'

export function CreateSolutionTechnologyDialog({
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

  const { mutateAsync, isPending } = useMutation(
    trpc.solutionTechnology.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Teknoloji eklendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.solutionTechnology.list.queryKey(),
        })
        onOpenChange(false)
        setName('')
        setDescription('')
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
      name: name.trim(),
      description: description.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni teknoloji</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="solution-tech-name">Ad</Label>
            <Input
              id="solution-tech-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="solution-tech-desc">Açıklama</Label>
            <Textarea
              id="solution-tech-desc"
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
