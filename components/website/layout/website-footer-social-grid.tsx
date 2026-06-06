'use client'

import Image from 'next/image'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { getFooterSocialPlatformIcon } from '@/lib/website/social-platforms'
import { cn } from '@/lib/utils'

export function WebsiteFooterSocialGrid({
  socialLinks,
  className,
  columns = 3,
  centered = false,
}: {
  socialLinks: PublicFooterSocialLink[]
  className?: string
  columns?: 3 | 4
  /** Mobil menü gibi dar alanlarda ikonları yatay ortala */
  centered?: boolean
}) {
  if (socialLinks.length === 0) return null

  return (
    <div
      className={cn(
        centered
          ? 'flex flex-wrap items-center justify-center gap-3'
          : cn(
              'grid w-fit gap-x-4 gap-y-3',
              columns === 4 ? 'grid-cols-4' : 'grid-cols-3'
            ),
        className
      )}
    >
      {socialLinks.map((item) => {
        const Icon =
          item.kind === 'lucide'
            ? getFooterSocialPlatformIcon(item.platform)
            : null

        return (
          <a
            key={`${item.kind}-${item.platform}-${item.label}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary inline-flex items-center justify-center"
            aria-label={item.label}
          >
            {item.kind === 'image' ? (
              <Image
                src={item.imageUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 object-contain"
                unoptimized
              />
            ) : (
              Icon && <Icon className="size-6" />
            )}
          </a>
        )
      })}
    </div>
  )
}
