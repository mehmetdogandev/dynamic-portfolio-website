'use client'

import { useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { uploadFooterSocialIcon } from '@/lib/media/client-upload'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  FOOTER_SOCIAL_KNOWN_PLATFORMS,
  FOOTER_SOCIAL_PLATFORM_LABELS,
  type FooterSocialKnownPlatform,
} from '@/lib/website/social-platforms'
import { FooterSocialPlatformIcon } from './footer-social-platform-icon'
import { ActiveConflictAlert } from './active-conflict-alert'
import {
  FOOTER_SOCIAL_OTHER_SELECT_VALUE,
  type AdminFooterSocialRow,
  type FooterSocialPlatformSelectValue,
} from './types'

export function platformSelectFromRow(
  platform: AdminFooterSocialRow['platform']
): FooterSocialPlatformSelectValue {
  if (platform === 'OTHER') return FOOTER_SOCIAL_OTHER_SELECT_VALUE
  return platform
}

export function FooterSocialFormFields({
  excludeId,
  platformSelect,
  onPlatformSelectChange,
  customLabel,
  onCustomLabelChange,
  url,
  onUrlChange,
  iconFileId: _iconFileId,
  iconPreviewUrl,
  onIconFileIdChange,
  isActive,
  onIsActiveChange,
}: {
  excludeId?: string
  platformSelect: FooterSocialPlatformSelectValue
  onPlatformSelectChange: (value: FooterSocialPlatformSelectValue) => void
  customLabel: string
  onCustomLabelChange: (value: string) => void
  url: string
  onUrlChange: (value: string) => void
  iconFileId: string | null
  iconPreviewUrl: string | null
  onIconFileIdChange: (fileId: string | null, previewUrl: string | null) => void
  isActive: boolean
  onIsActiveChange: (value: boolean) => void
}) {
  const trpc = useTRPC()
  const [uploading, setUploading] = useState(false)
  const isOther = platformSelect === FOOTER_SOCIAL_OTHER_SELECT_VALUE

  const platformForConflict = isOther
    ? ('OTHER' as const)
    : (platformSelect as FooterSocialKnownPlatform)

  const { data: conflict } = useQuery({
    ...trpc.footerSocial.getActiveConflict.queryOptions({
      platform: platformForConflict,
      customLabel: isOther ? customLabel || null : null,
      excludeId,
    }),
    enabled: isActive && (!isOther || customLabel.trim().length > 0),
  })

  const onIconFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const fileId = await uploadFooterSocialIcon(file)
      onIconFileIdChange(fileId, `/api/files/${fileId}/view`)
      toast.success('İkon yüklendi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Platform</Label>
        <Select
          value={platformSelect}
          onValueChange={(value) =>
            onPlatformSelectChange(value as FooterSocialPlatformSelectValue)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOTER_SOCIAL_KNOWN_PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="flex items-center gap-2">
                  <FooterSocialPlatformIcon platform={p} className="h-4 w-4" />
                  {FOOTER_SOCIAL_PLATFORM_LABELS[p]}
                </span>
              </SelectItem>
            ))}
            <SelectItem value={FOOTER_SOCIAL_OTHER_SELECT_VALUE}>
              Diğer...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isOther ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="social-custom-label">Platform adı</Label>
            <Input
              id="social-custom-label"
              value={customLabel}
              onChange={(event) => onCustomLabelChange(event.target.value)}
              placeholder="Örn. TikTok"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="social-icon-file">Platform ikonu (.ico)</Label>
            <Input
              id="social-icon-file"
              type="file"
              accept=".ico"
              disabled={uploading}
              onChange={onIconFile}
            />
            {uploading ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                Yükleniyor...
              </p>
            ) : null}
            {iconPreviewUrl ? (
              <div className="flex items-center gap-2">
                <Image
                  src={iconPreviewUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onIconFileIdChange(null, null)}
                >
                  İkonu kaldır
                </Button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <FooterSocialPlatformIcon
            platform={platformSelect as FooterSocialKnownPlatform}
            className="h-5 w-5"
          />
          {
            FOOTER_SOCIAL_PLATFORM_LABELS[
              platformSelect as FooterSocialKnownPlatform
            ]
          }
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="social-url">URL</Label>
        <Input
          id="social-url"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="social-is-active">Aktif</Label>
          <p className="text-muted-foreground text-xs">
            Aynı platform için yalnızca bir aktif kayıt olabilir.
          </p>
        </div>
        <Switch
          id="social-is-active"
          checked={isActive}
          onCheckedChange={onIsActiveChange}
        />
      </div>

      {isActive && conflict?.hasConflict && conflict.displayName ? (
        <ActiveConflictAlert displayName={conflict.displayName} />
      ) : null}
    </div>
  )
}
