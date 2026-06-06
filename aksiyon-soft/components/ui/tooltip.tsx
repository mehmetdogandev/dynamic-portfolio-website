'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils/index'

const TooltipContext = React.createContext<{
  onClose?: () => void
}>({})

function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  )
}

function Tooltip({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [open, setOpen] = React.useState(false)
  const isControlled = props.open !== undefined

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        props.onOpenChange?.(newOpen)
      } else {
        setOpen(newOpen)
      }
    },
    [isControlled, props]
  )

  const handleClose = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  return (
    <TooltipContext.Provider value={{ onClose: handleClose }}>
      <TooltipProvider>
        <TooltipPrimitive.Root
          data-slot="tooltip"
          delayDuration={delayDuration}
          open={isControlled ? props.open : open}
          onOpenChange={handleOpenChange}
          {...props}
        />
      </TooltipProvider>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { onClose } = React.useContext(TooltipContext)

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e)
      // Immediately close tooltip when leaving trigger
      onClose?.()
    },
    [onPointerLeave, onClose]
  )

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onPointerLeave={handlePointerLeave}
      {...props}
    />
  )
}

interface TooltipContentProps extends React.ComponentProps<
  typeof TooltipPrimitive.Content
> {
  hideArrow?: boolean
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  hideArrow = false,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-300 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance pointer-events-none',
          className
        )}
        {...props}
      >
        {children}
        {!hideArrow && (
          <TooltipPrimitive.Arrow className="bg-primary fill-primary z-300 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
