'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils/index'
import { DialogContext } from './dialog'

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    forcePortal?: boolean
  }
>(
  (
    {
      className,
      align = 'center',
      sideOffset = 4,
      forcePortal = false,
      ...props
    },
    ref
  ) => {
    // do not want to render portals inside dialogs
    // this causes scroll problems
    // ref: https://github.com/shadcn-ui/ui/issues/607
    const isInsideDialog = React.useContext(DialogContext)
    const shouldRenderWithoutPortal =
      isInsideDialog.isInsideDialog && !forcePortal

    const content = (
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          forcePortal ? 'z-210' : 'z-50',
          className
        )}
        {...props}
      />
    )

    if (shouldRenderWithoutPortal) {
      return content
    }

    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
  }
)

PopoverContent.displayName = 'PopoverContent'

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
