'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { X, ZoomIn, ZoomOut, RotateCcw, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FullscreenImageViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  alt?: string
  ticketId?: string
  onSendMessage?: (content: string, isInternal: boolean) => void
  isAdmin?: boolean
}

export function FullscreenImageViewer({
  open,
  onOpenChange,
  imageSrc,
  alt = 'Image',
  ticketId,
  onSendMessage,
  isAdmin = false,
}: FullscreenImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setMessage('')
      setIsInternal(false)
    }
  }, [open])

  const handleSendMessage = async () => {
    if (!message.trim() || !onSendMessage) return

    setIsSending(true)
    try {
      await onSendMessage(message, isInternal)
      setMessage('')
      setIsInternal(false)
    } catch (_error) {
      // Error handling is done in parent component
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (open) {
      setZoom(1.0)
      setPosition({ x: 0, y: 0 })
    }
  }, [open])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!open) return
      e.preventDefault()

      const sensitivity = 0.08
      const zoomDelta = e.deltaY > 0 ? -sensitivity : sensitivity
      const newZoom = Math.max(0.5, Math.min(5, zoom + zoomDelta))

      if (imageRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const zoomChange = newZoom / zoom
        const newX = mouseX - (mouseX - position.x) * zoomChange
        const newY = mouseY - (mouseY - position.y) * zoomChange

        setZoom(newZoom)
        setPosition({ x: newX, y: newY })
      }
    },
    [open, zoom, position]
  )

  useEffect(() => {
    const container = containerRef.current
    if (open && container) {
      container.addEventListener('wheel', handleWheel, {
        passive: false,
      })
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [open, handleWheel])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    },
    [zoom, position]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoom <= 1) return
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart, zoom]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoom <= 1 || e.touches.length !== 1) return
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      })
    },
    [zoom, position]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || zoom <= 1 || e.touches.length !== 1) return
      e.preventDefault()
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart, zoom]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const zoomIn = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const newZoom = Math.min(5, zoom * 1.2)
      const zoomChange = newZoom / zoom
      const newX = centerX - (centerX - position.x) * zoomChange
      const newY = centerY - (centerY - position.y) * zoomChange

      setZoom(newZoom)
      setPosition({ x: newX, y: newY })
    }
  }, [zoom, position])

  const zoomOut = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const newZoom = Math.max(0.5, zoom / 1.2)
      const zoomChange = newZoom / zoom
      const newX = centerX - (centerX - position.x) * zoomChange
      const newY = centerY - (centerY - position.y) * zoomChange

      setZoom(newZoom)
      setPosition({ x: newX, y: newY })
    }
  }, [zoom, position])

  const resetView = useCallback(() => {
    setZoom(1.0)
    setPosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (imageRef.current && containerRef.current && zoom > 1) {
      const img = imageRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      const imgWidth = img.offsetWidth * zoom
      const imgHeight = img.offsetHeight * zoom

      const maxX = Math.max(0, (imgWidth - rect.width) / 2)
      const maxY = Math.max(0, (imgHeight - rect.height) / 2)

      setPosition((prev) => ({
        x: Math.max(-maxX, Math.min(maxX, prev.x)),
        y: Math.max(-maxY, Math.min(maxY, prev.y)),
      }))
    } else if (zoom <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [zoom])

  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  if (!mounted || !open) return null

  const content = (
    <div
      className="fixed inset-0 z-9999 bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-screen h-screen object-contain select-none',
            zoom > 1 && 'transition-transform duration-75'
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= 5}
              className="border-0 bg-primary/90 text-primary-foreground hover:bg-primary"
              title="Yakınlaştır"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="border-0 bg-primary/90 text-primary-foreground hover:bg-primary"
              title="Uzaklaştır"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={resetView}
              disabled={
                Math.abs(zoom - 1.0) < 0.01 &&
                position.x === 0 &&
                position.y === 0
              }
              className="border-0 bg-primary/90 text-primary-foreground hover:bg-primary"
              title="Sıfırla"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-0 bg-primary/90 text-primary-foreground hover:bg-primary"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {zoom > 1 && (
            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded text-center">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>

        {/* Message Input */}
        {ticketId && onSendMessage && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              {isAdmin && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isInternalViewer"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <Label
                    htmlFor="isInternalViewer"
                    className="text-sm text-white/90 cursor-pointer"
                  >
                    İç not olarak gönder
                  </Label>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={2}
                  disabled={isSending}
                  className="bg-white/10 text-white placeholder:text-white/50 border-white/20 focus:border-white/40 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                  size="icon"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
