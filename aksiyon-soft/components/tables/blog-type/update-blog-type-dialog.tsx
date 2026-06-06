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
import type { AdminBlogTypeRow } from './blog-type-data-table'

export function UpdateBlogTypeDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminBlogTypeRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [name, setName] = useState(row.name)
  const [slug, setSlug] = useState(row.slug)
  const [description, setDescription] = useState(row.description ?? '')

  useEffect(() => {
    if (!open) return
    setName(row.name)
    setSlug(row.slug)
    setDescription(row.description ?? '')
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.blogType.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Blog türü güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.blogType.list.queryKey(),
        })
        onOpenChange(false)
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
      id: row.id,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Blog türünü düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-blog-type-name">Ad</Label>
            <Input
              id="edit-blog-type-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-blog-type-slug">Slug</Label>
            <Input
              id="edit-blog-type-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-blog-type-desc">Açıklama</Label>
            <Textarea
              id="edit-blog-type-desc"
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
