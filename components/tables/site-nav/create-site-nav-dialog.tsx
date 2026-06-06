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
import { Checkbox } from '@/components/ui/checkbox'
import type { SiteNavVariant } from './types'

export function CreateSiteNavDialog({
  variant,
  open,
  onOpenChange,
}: {
  variant: SiteNavVariant
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const api = variant === 'header' ? trpc.headerNav : trpc.footerNav
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(false)

  const { mutateAsync, isPending } = useMutation(
    api.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Menü öğesi eklendi')
        await queryClient.invalidateQueries({ queryKey: api.list.queryKey() })
        onOpenChange(false)
        setLabel('')
        setHref('')
        setOpenInNewTab(false)
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
      label: label.trim(),
      href: href.trim(),
      openInNewTab,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni menü öğesi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nav-label">Etiket</Label>
            <Input
              id="nav-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nav-href">Link</Label>
            <Input
              id="nav-href"
              value={href}
              onChange={(event) => setHref(event.target.value)}
              placeholder="/about veya https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="nav-new-tab"
              checked={openInNewTab}
              onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
            />
            <Label htmlFor="nav-new-tab" className="font-normal">
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
