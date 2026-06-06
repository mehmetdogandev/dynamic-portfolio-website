'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils/index'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-200 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onInteractOutside,
  onEscapeKeyDown,
  onCloseRequested,
  confirmOnClose = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  onCloseRequested?: () => void
  confirmOnClose?: boolean
}) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)

  // Prevent background page from scrolling while dialog is open
  React.useEffect(() => {
    const htmlStyle = document.documentElement.style
    const bodyStyle = document.body.style
    const previousHtmlOverflow = htmlStyle.overflow
    const previousBodyOverflow = bodyStyle.overflow
    const previousBodyPaddingRight = bodyStyle.paddingRight

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    htmlStyle.overflow = 'hidden'
    bodyStyle.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      htmlStyle.overflow = previousHtmlOverflow
      bodyStyle.overflow = previousBodyOverflow
      bodyStyle.paddingRight = previousBodyPaddingRight
    }
  }, [])

  const handleCloseAttempt = React.useCallback(() => {
    if (confirmOnClose) {
      setShowConfirmDialog(true)
    } else {
      onCloseRequested?.()
    }
  }, [confirmOnClose, onCloseRequested])

  const handleConfirmClose = React.useCallback(() => {
    setShowConfirmDialog(false)
    onCloseRequested?.()
  }, [onCloseRequested])

  const handleCancelClose = React.useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  return (
    <>
      <DialogPortal data-slot="dialog-portal">
        <DialogOverlay />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            'bg-background max-h-[calc(100vh-4rem)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-200 flex flex-col w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg lg:max-w-3xl duration-200 overflow-hidden!',
            className
          )}
          onInteractOutside={(e) => {
            if (confirmOnClose) {
              e.preventDefault()
              onInteractOutside?.(e)
            }
          }}
          onEscapeKeyDown={(e) => {
            if (confirmOnClose) {
              e.preventDefault()
              handleCloseAttempt()
            }
            onEscapeKeyDown?.(e)
          }}
          {...props}
        >
          {showCloseButton && (
            <button
              type="button"
              data-slot="dialog-close"
              onClick={handleCloseAttempt}
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 z-50 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </button>
          )}
          <div className="overflow-y-auto flex-1 min-h-0 grid gap-4 p-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
      {confirmOnClose && (
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="z-210">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Kapatmak istediğinize emin misiniz?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Yapılan değişiklikleriniz varsa kaydedilmeyebilir. Pencere
                kapatılacak.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelClose}>
                İptal
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmClose}>
                Kapat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog as RawDialog,
  DialogClose as RawDialogClose,
  DialogContent as RawDialogContent,
  DialogDescription as RawDialogDescription,
  DialogFooter as RawDialogFooter,
  DialogHeader as RawDialogHeader,
  DialogOverlay as RawDialogOverlay,
  DialogPortal as RawDialogPortal,
  DialogTitle as RawDialogTitle,
  DialogTrigger as RawDialogTrigger,
}
