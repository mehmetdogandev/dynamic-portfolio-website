'use client'

import { useState } from 'react'
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
import type { RadioMobileRouterKey } from './types'
import { useChannelRouter } from './use-channel-router'
import { toast } from 'sonner'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Dosya okunamadı'))
        return
      }
      resolve(result.includes(',') ? result.split(',')[1]! : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Dosya okunamadı'))
    reader.readAsDataURL(file)
  })
}

export function CreateBuildDialog({
  open,
  onOpenChange,
  routerKey,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  routerKey: RadioMobileRouterKey
  onSuccess: () => void
}) {
  const channelRouter = useChannelRouter(routerKey)
  const [versionMajor, setVersionMajor] = useState('1')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isStable, setIsStable] = useState(false)
  const [isPublicOnSite, setIsPublicOnSite] = useState(false)

  const createMutation = useMutation(
    channelRouter.create.mutationOptions({
      onSuccess: () => {
        toast.success('Build yüklendi')
        onOpenChange(false)
        setUploadFile(null)
        onSuccess()
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const handleSubmit = async () => {
    if (!uploadFile) {
      toast.error('APK seçin')
      return
    }
    const major = Number.parseInt(versionMajor, 10)
    if (!Number.isInteger(major) || major < 0) {
      toast.error('Geçerli major sürüm girin')
      return
    }
    const base64 = await fileToBase64(uploadFile)
    createMutation.mutate({
      versionMajor: major,
      file: base64,
      fileName: uploadFile.name,
      mimeType: uploadFile.type || 'application/vnd.android.package-archive',
      displayName: uploadFile.name,
      isStable,
      isPublicOnSite,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni build ekle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rm-major">Major seri</Label>
            <Input
              id="rm-major"
              value={versionMajor}
              onChange={(e) => setVersionMajor(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="rm-apk">APK</Label>
            <Input
              id="rm-apk"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isStable}
              onCheckedChange={(v) => setIsStable(v === true)}
            />
            Stabil sürüm
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
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            Yükle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
