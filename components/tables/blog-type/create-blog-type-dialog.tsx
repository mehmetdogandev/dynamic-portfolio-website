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

export function CreateBlogTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const { mutateAsync, isPending } = useMutation(
    trpc.blogType.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Blog türü eklendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.blogType.list.queryKey(),
        })
        onOpenChange(false)
        setName('')
        setSlug('')
        setDescription('')
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Ad ve slug gerekli')
      return
    }
    await mutateAsync({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni blog türü</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="blog-type-name">Ad</Label>
            <Input
              id="blog-type-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blog-type-slug">Slug</Label>
            <Input
              id="blog-type-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blog-type-desc">Açıklama</Label>
            <Textarea
              id="blog-type-desc"
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
