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
import { Checkbox } from '@/components/ui/checkbox'
import type { AdminSiteNavRow, SiteNavVariant } from './types'

export function UpdateSiteNavDialog({
  variant,
  row,
  open,
  onOpenChange,
}: {
  variant: SiteNavVariant
  row: AdminSiteNavRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const api = variant === 'header' ? trpc.headerNav : trpc.footerNav
  const [label, setLabel] = useState(row.label)
  const [href, setHref] = useState(row.href)
  const [openInNewTab, setOpenInNewTab] = useState(row.openInNewTab)

  useEffect(() => {
    if (!open) return
    setLabel(row.label)
    setHref(row.href)
    setOpenInNewTab(row.openInNewTab)
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    api.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Menü öğesi güncellendi')
        await queryClient.invalidateQueries({ queryKey: api.list.queryKey() })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!label.trim() || !href.trim()) {
      toast.error('Etiket ve link gerekli')
      return
    }
    await mutateAsync({
      id: row.id,
      label: label.trim(),
      href: href.trim(),
      openInNewTab,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Menü öğesini düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nav-label">Etiket</Label>
            <Input
              id="edit-nav-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-nav-href">Link</Label>
            <Input
              id="edit-nav-href"
              value={href}
              onChange={(event) => setHref(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-nav-new-tab"
              checked={openInNewTab}
              onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
            />
            <Label htmlFor="edit-nav-new-tab" className="font-normal">
              Yeni sekmede aç
            </Label>
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
