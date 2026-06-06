'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RadioMobileRouterKey } from './types'
import { useChannelRouter } from './use-channel-router'

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function BuildDetailDialog({
  buildId,
  open,
  onOpenChange,
  routerKey,
}: {
  buildId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  routerKey: RadioMobileRouterKey
}) {
  const channelRouter = useChannelRouter(routerKey)
  const detailQuery = useQuery({
    ...channelRouter.getById.queryOptions({ id: buildId! }),
    enabled: open && !!buildId,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Build detayı</DialogTitle>
        </DialogHeader>
        {detailQuery.data ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Sürüm</dt>
              <dd>{detailQuery.data.versionName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">versionCode</dt>
              <dd>{detailQuery.data.versionCode}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Boyut</dt>
              <dd>{formatMb(detailQuery.data.sizeBytes)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">RN / SDK</dt>
              <dd>
                {detailQuery.data.reactNativeVersion ?? '—'} / min{' '}
                {detailQuery.data.minSdk ?? '—'} / target{' '}
                {detailQuery.data.targetSdk ?? '—'}
              </dd>
            </div>
            {detailQuery.data.downloadUrl ? (
              <div>
                <a
                  href={detailQuery.data.downloadUrl}
                  className="text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  MinIO indirme bağlantısı
                </a>
              </div>
            ) : null}
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
