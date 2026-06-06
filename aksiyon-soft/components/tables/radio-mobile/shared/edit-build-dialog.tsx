'use client'

import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { BuildRow, RadioMobileRouterKey } from './types'
import { useChannelRouter } from './use-channel-router'
import { toast } from 'sonner'

export function EditBuildDialog({
  build,
  open,
  onOpenChange,
  routerKey,
  onSuccess,
}: {
  build: BuildRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  routerKey: RadioMobileRouterKey
  onSuccess: () => void
}) {
  const channelRouter = useChannelRouter(routerKey)
  const [displayName, setDisplayName] = useState('')
  const [notes, setNotes] = useState('')
  const [isStable, setIsStable] = useState(false)
  const [isPublicOnSite, setIsPublicOnSite] = useState(false)

  useEffect(() => {
    if (build) {
      setDisplayName(build.displayName)
      setNotes(build.notes ?? '')
      setIsStable(build.isStable)
      setIsPublicOnSite(build.isPublicOnSite)
    }
  }, [build])

  const updateMutation = useMutation(
    channelRouter.update.mutationOptions({
      onSuccess: () => {
        toast.success('Build güncellendi')
        onOpenChange(false)
        onSuccess()
      },
      onError: (e) => toast.error(e.message),
    })
  )

  if (!build) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Düzenle — {build.versionName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="display-name">Görünen ad</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isStable}
              onCheckedChange={(v) => setIsStable(v === true)}
            />
            Stabil
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isPublicOnSite}
              onCheckedChange={(v) => setIsPublicOnSite(v === true)}
            />
            Sayfada yayınla
          </label>
          <Button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({
                id: build.id,
                displayName,
                notes: notes || null,
                isStable,
                isPublicOnSite,
              })
            }
          >
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
