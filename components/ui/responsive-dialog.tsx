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

// Root component that conditionally renders Dialog or Drawer
function ResponsiveDialog({
  ...props
}: React.ComponentProps<typeof RawDialog>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <Drawer {...props} />
  }

  return <RawDialog {...props} />
}

// Trigger component
function ResponsiveDialogTrigger({
  ...props
}: React.ComponentProps<typeof RawDialogTrigger>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerTrigger {...props} />
  }

  return <RawDialogTrigger {...props} />
}

// Portal component
function ResponsiveDialogPortal({
  ...props
}: React.ComponentProps<typeof RawDialogPortal>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerPortal {...props} />
  }

  return <RawDialogPortal {...props} />
}

// Close component
function ResponsiveDialogClose({
  ...props
}: React.ComponentProps<typeof RawDialogClose>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerClose {...props} />
  }

  return <RawDialogClose {...props} />
}

// Overlay component
function ResponsiveDialogOverlay({
  ...props
}: React.ComponentProps<typeof RawDialogOverlay>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerOverlay {...props} />
  }

  return <RawDialogOverlay {...props} />
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
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        {children}
      </DrawerContent>
    )
  }

  return (
    <RawDialogContent
      className={className}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </RawDialogContent>
  )
}

// Header component
function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />
  }

  return <RawDialogHeader className={className} {...props} />
}

// Footer component
function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={className} {...props} />
  }

  return <RawDialogFooter className={className} {...props} />
}

// Title component
function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof RawDialogTitle>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />
  }

  return <RawDialogTitle className={className} {...props} />
}

// Description component
function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof RawDialogDescription>) {
  const { isMobile } = useIsMobile()

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
  }

  return <RawDialogDescription className={className} {...props} />
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
