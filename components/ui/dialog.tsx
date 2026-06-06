'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import {
  RawDialog,
  RawDialogClose,
  RawDialogContent,
  RawDialogDescription,
  RawDialogFooter,
  RawDialogHeader,
  RawDialogOverlay,
  RawDialogPortal,
  RawDialogTitle,
  RawDialogTrigger,
} from './raw-dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

type DialogContextValue = {
  isInsideDialog: boolean
  onOpenChange?: (open: boolean) => void
}

export const DialogContext = React.createContext<DialogContextValue>({
  isInsideDialog: false,
})

function DialogProvider({
  children,
  onOpenChange,
}: React.PropsWithChildren<{ onOpenChange?: (open: boolean) => void }>) {
  return (
    <DialogContext.Provider value={{ isInsideDialog: true, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

// Root component that conditionally renders Dialog or Drawer
function ResponsiveDialog({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof RawDialog>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <DialogProvider onOpenChange={onOpenChange}>
        <RawDialog onOpenChange={onOpenChange} {...props} />
      </DialogProvider>
    )
  }

  return (
    <DialogProvider onOpenChange={onOpenChange}>
      <Drawer onOpenChange={onOpenChange} {...props} />
    </DialogProvider>
  )
}

// Trigger component
function ResponsiveDialogTrigger({
  ...props
}: React.ComponentProps<typeof RawDialogTrigger>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogTrigger {...props} />
  }

  return <DrawerTrigger {...props} />
}

// Portal component
function ResponsiveDialogPortal({
  ...props
}: React.ComponentProps<typeof RawDialogPortal>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogPortal {...props} />
  }

  return <DrawerPortal {...props} />
}

// Close component
function ResponsiveDialogClose({
  ...props
}: React.ComponentProps<typeof RawDialogClose>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogClose {...props} />
  }

  return <DrawerClose {...props} />
}

// Overlay component
function ResponsiveDialogOverlay({
  ...props
}: React.ComponentProps<typeof RawDialogOverlay>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogOverlay {...props} />
  }

  return <DrawerOverlay {...props} />
}

// Content component
function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof RawDialogContent> & {
  showCloseButton?: boolean
}) {
  const { isDesktop } = useIsMobile()
  const { onOpenChange } = React.useContext(DialogContext)

  if (isDesktop) {
    return (
      <RawDialogContent
        className={className}
        showCloseButton={showCloseButton}
        onCloseRequested={() => {
          onOpenChange?.(false)
        }}
        {...props}
      >
        {children}
      </RawDialogContent>
    )
  }

  return (
    <DrawerContent
      className={className}
      onCloseRequested={() => {
        onOpenChange?.(false)
      }}
      {...props}
    >
      {children}
    </DrawerContent>
  )
}

// Header component
function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogHeader className={className} {...props} />
  }

  return <DrawerHeader className={className} {...props} />
}

// Footer component
function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogFooter className={className} {...props} />
  }

  return <DrawerFooter className={className} {...props} />
}

// Title component
function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof RawDialogTitle>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogTitle className={className} {...props} />
  }

  return <DrawerTitle className={className} {...props} />
}

// Description component
function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof RawDialogDescription>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return <RawDialogDescription className={className} {...props} />
  }

  return <DrawerDescription className={className} {...props} />
}

// Export with the same names as the original Dialog for easy replacement
export {
  ResponsiveDialog as Dialog,
  ResponsiveDialogClose as DialogClose,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogOverlay as DialogOverlay,
  ResponsiveDialogPortal as DialogPortal,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
}
