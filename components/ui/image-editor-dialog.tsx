'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { X, Crop, Pencil, RotateCcw, Check } from 'lucide-react'
import Cropper, { Area } from 'react-easy-crop'
import { toast } from 'sonner'

interface ImageEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | File
  onSave: (file: File) => void
}

type EditorMode = 'crop' | 'draw'

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageSrc,
  onSave,
}: ImageEditorDialogProps) {
  const [mode, setMode] = useState<EditorMode>('crop')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawColor, setDrawColor] = useState('#000000')
  const [drawSize, setDrawSize] = useState(5)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Convert imageSrc to URL
  useEffect(() => {
    if (typeof imageSrc === 'string') {
      setImageUrl(imageSrc)
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
      }
      reader.readAsDataURL(imageSrc)
    }
  }, [imageSrc])

  // Initialize canvas for drawing
  useEffect(() => {
    if (mode === 'draw' && imageUrl && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        imageRef.current = img
      }
      img.src = imageUrl
    }
  }, [mode, imageUrl])

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleCrop = async () => {
    if (!imageUrl || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const image = await createImage(imageUrl)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('Görsel işlenemedi')
            return
          }

          const file = new File([blob], `edited-image-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          onSave(file)
          onOpenChange(false)
          toast.success('Görsel kaydedildi')
        },
        'image/jpeg',
        0.9
      )
    } catch (error) {
      console.error('Crop error:', error)
      toast.error('Görsel kırpılırken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
  }

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    ctx.lineTo(x, y)
    ctx.strokeStyle = drawColor
    ctx.lineWidth = drawSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)
  }

  const handleSaveDrawing = async () => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    try {
      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('Görsel kaydedilemedi')
            return
          }

          const file = new File([blob], `drawn-image-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          onSave(file)
          onOpenChange(false)
          toast.success('Görsel kaydedildi')
        },
        'image/jpeg',
        0.9
      )
    } catch (error) {
      console.error('Save drawing error:', error)
      toast.error('Görsel kaydedilirken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setMode('crop')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setIsDrawing(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Görsel Düzenle</DialogTitle>
          <DialogDescription>
            Görseli kırpın veya üzerine çizim yapın
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'crop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('crop')}
          >
            <Crop className="h-4 w-4 mr-2" />
            Kırp
          </Button>
          <Button
            type="button"
            variant={mode === 'draw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('draw')}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Çiz
          </Button>
        </div>

        <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
          {mode === 'crop' && imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : mode === 'draw' && imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="max-w-full max-h-full cursor-crosshair"
                style={{
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Görsel yükleniyor...</p>
            </div>
          )}
        </div>

        {mode === 'crop' && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Yakınlaştır: {zoom.toFixed(2)}x
              </label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0] || 1)}
                min={1}
                max={3}
                step={0.1}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCrop}
                disabled={isProcessing || !croppedAreaPixels}
                className="flex-1"
              >
                {isProcessing ? (
                  <>İşleniyor...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
            </div>
          </div>
        )}

        {mode === 'draw' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Renk:</label>
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">
                  Kalem Boyutu: {drawSize}px
                </label>
                <Slider
                  value={[drawSize]}
                  onValueChange={(value) => setDrawSize(value[0] || 5)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearCanvas}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Temizle
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSaveDrawing}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>İşleniyor...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
