'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { RadioMobileRouterKey } from './types'
import { useChannelRouter } from './use-channel-router'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/use-rbac'
import { CHANNEL_SCOPE } from '@/lib/radio-mobile/channels'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'
import { PERMISSIONS } from '@/lib/db/schema'

export function ChannelPublicToolbar({
  channel,
  routerKey,
}: {
  channel: RadioMobileChannelValue
  routerKey: RadioMobileRouterKey
}) {
  const queryClient = useQueryClient()
  const scope = CHANNEL_SCOPE[channel]
  const { data: canUpdate } = usePermission(scope, PERMISSIONS.UPDATE)

  const channelRouter = useChannelRouter(routerKey)

  const configQuery = useQuery({
    ...channelRouter.getChannelConfig.queryOptions(),
  })

  const updateConfig = useMutation(
    channelRouter.updateChannelConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: channelRouter.getChannelConfig.queryKey(),
        })
        toast.success('Sayfa yayın ayarı güncellendi')
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const isPublic = configQuery.data?.isPublicPage ?? false
  const path = configQuery.data?.publicUrlPath ?? ''

  if (!canUpdate) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Public URL: {path || '—'}</span>
        <span>{isPublic ? '(açık)' : '(kapalı)'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 border-l pl-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={`public-${channel}`} className="text-xs font-medium">
          Sayfa public
        </Label>
        {path ? (
          <span className="max-w-[200px] truncate text-[10px] text-muted-foreground">
            {path}
          </span>
        ) : null}
      </div>
      <Switch
        id={`public-${channel}`}
        checked={isPublic}
        disabled={updateConfig.isPending || configQuery.isLoading}
        onCheckedChange={(checked) =>
          updateConfig.mutate({ isPublicPage: checked })
        }
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  )
}
