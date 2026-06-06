import Link from 'next/link'
import {
  CHANNEL_NAV_SIBLINGS,
  getPublicPageMeta,
} from '@/lib/radio-mobile/public-page-meta'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'
import { PUBLIC_PATH_BY_CHANNEL } from '@/lib/radio-mobile/channels'
import { cn } from '@/lib/utils'

function platformKey(channel: RadioMobileChannelValue): 'android' | 'ios' {
  return channel.startsWith('ios_') ? 'ios' : 'android'
}

export function RadioMobileChannelNav({
  activeChannel,
}: {
  activeChannel: RadioMobileChannelValue
}) {
  const platform = platformKey(activeChannel)
  const siblings = CHANNEL_NAV_SIBLINGS[platform]

  return (
    <nav aria-label="Dağıtım kanalı" className="flex flex-wrap gap-2">
      {siblings.map((channel) => {
        const meta = getPublicPageMeta(channel)
        const isActive = channel === activeChannel
        const href = PUBLIC_PATH_BY_CHANNEL[channel]
        const label = meta.breadcrumbChannel

        if (isActive) {
          return (
            <span
              key={channel}
              className={cn(
                'bg-primary text-primary-foreground inline-flex items-center rounded-full px-4 py-2 text-sm font-medium'
              )}
              aria-current="page"
            >
              {label}
            </span>
          )
        }

        return (
          <Link
            key={channel}
            href={href}
            className="border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors"
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
