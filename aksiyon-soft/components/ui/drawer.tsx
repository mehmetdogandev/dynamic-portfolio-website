'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils/index'

function Drawer({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      onOpenChange={onOpenChange}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  onCloseRequested: _onCloseRequested,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  onCloseRequested?: () => void
}) {
  // Check if children contain a DrawerTitle by looking for the data-slot attribute
  const hasTitle = React.useMemo(() => {
    const checkForTitle = (node: React.ReactNode): boolean => {
      if (!React.isValidElement(node)) return false

      const nodeProps = node.props as
        | (Record<string, unknown> & { children?: React.ReactNode })
        | undefined

      // Check if this element has the drawer-title data-slot
      if (nodeProps?.['data-slot'] === 'drawer-title') {
        return true
      }

      // Check if this is a DrawerTitle component
      if (node.type === DrawerTitle) {
        return true
      }

      // Recursively check children
      if (nodeProps?.children) {
        return React.Children.toArray(
          nodeProps.children as React.ReactNode
        ).some(checkForTitle)
      }

      return false
    }

    return React.Children.toArray(children).some(checkForTitle)
  }, [children])

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'group/drawer-content bg-background fixed z-40 flex flex-col',
          'transition-transform duration-300 ease-out',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-[90vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:w-full data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:max-h-dvh data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:max-h-dvh data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className
        )}
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        <div className="flex flex-col h-auto overflow-y-auto overscroll-contain p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:max-h-[calc(90vh-2rem)] [&::after]:hidden [&::after]:content-none">
          {!hasTitle && (
            <DrawerPrimitive.Title
              className="sr-only"
              data-slot="drawer-title-hidden"
            >
              Drawer
            </DrawerPrimitive.Title>
          )}
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'ref' | 'style'> & {
  style?: React.CSSProperties
}) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 pb-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'ref' | 'style'> & {
  style?: React.CSSProperties
}) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 pt-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
