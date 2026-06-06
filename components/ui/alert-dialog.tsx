'use client'

import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils/index'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'

// Context to share onOpenChange with AlertDialogCancel
const AlertDialogContext = React.createContext<{
  onOpenChange?: (open: boolean) => void
}>({})

function AlertDialog({
  open,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        open={open}
        onOpenChange={onOpenChange}
        {...props}
      >
        <AlertDialogContext.Provider value={{ onOpenChange }}>
          {children}
        </AlertDialogContext.Provider>
      </AlertDialogPrimitive.Root>
    )
  }

  // Mobile: Use Drawer instead
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      <AlertDialogContext.Provider value={{ onOpenChange }}>
        {children}
      </AlertDialogContext.Provider>
    </DrawerPrimitive.Root>
  )
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-210 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
          data-slot="alert-dialog-content"
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-210 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
            className
          )}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    )
  }

  // Mobile: Use DrawerContent (Drawer root is already provided by AlertDialog)
  return (
    <DrawerPrimitive.Portal>
      <div className="fixed inset-0 z-210 bg-black/50" />
      <DrawerPrimitive.Content
        className={cn(
          'bg-background fixed inset-x-0 bottom-0 z-210 flex flex-col rounded-t-lg border-t p-4 max-h-[50vh]',
          className
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mb-4 h-2 w-[100px] shrink-0 rounded-full" />
        <div className="flex flex-col overflow-y-auto">{children}</div>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  )
}

function AlertDialogHeader({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <div
        data-slot="alert-dialog-header"
        className={cn(
          'flex flex-col gap-2 text-center sm:text-left',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  // Mobile: Use drawer-like header styling
  return (
    <div
      className={cn('flex flex-col gap-0.5 pb-4 text-center', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function AlertDialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <div
        data-slot="alert-dialog-footer"
        className={cn(
          'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  // Mobile: Use drawer-like footer styling
  return (
    <div
      className={cn('mt-auto flex flex-col gap-2 pt-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function AlertDialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <AlertDialogPrimitive.Title
        data-slot="alert-dialog-title"
        className={cn('text-lg font-semibold', className)}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Title>
    )
  }

  // Mobile: Use DrawerPrimitive.Title
  return (
    <DrawerPrimitive.Title
      className={cn('text-foreground font-semibold', className)}
      {...props}
    >
      {children}
    </DrawerPrimitive.Title>
  )
}

function AlertDialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <AlertDialogPrimitive.Description
        data-slot="alert-dialog-description"
        className={cn('text-muted-foreground text-sm', className)}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Description>
    )
  }

  // Mobile: Use DrawerPrimitive.Description
  return (
    <DrawerPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {children}
    </DrawerPrimitive.Description>
  )
}

function AlertDialogAction({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  const { isDesktop } = useIsMobile()

  if (isDesktop) {
    return (
      <AlertDialogPrimitive.Action
        className={cn(buttonVariants(), className)}
        onClick={onClick}
        {...props}
      />
    )
  }

  // Mobile: Use normal Button (since we're in Drawer, not AlertDialog)
  // onClick will be handled by the parent component (drawer.tsx)
  return (
    <Button
      className={cn(buttonVariants(), className)}
      onClick={onClick}
      type="button"
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  const { isDesktop } = useIsMobile()
  const { onOpenChange } = React.useContext(AlertDialogContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    } else if (onOpenChange) {
      onOpenChange(false)
    }
  }

  if (isDesktop) {
    return (
      <AlertDialogPrimitive.Cancel
        className={cn(buttonVariants({ variant: 'outline' }), className)}
        onClick={onClick}
        {...props}
      />
    )
  }

  // Mobile: Use normal Button (since we're in Drawer, not AlertDialog)
  return (
    <Button
      variant="outline"
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      onClick={handleClick}
      type="button"
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
