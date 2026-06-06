'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area, Point } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { RotateCw, ZoomIn, ZoomOut, Move } from 'lucide-react'

interface ProfilePhotoEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onSave: (croppedImageBlob: Blob) => void
  aspect?: number
  minZoom?: number
  maxZoom?: number
}

export function ProfilePhotoEditor({
  open,
  onOpenChange,
  imageSrc,
  onSave,
  aspect = 1,
  minZoom = 1,
  maxZoom = 3,
}: ProfilePhotoEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180
  }

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation)
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) +
        Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) +
        Math.abs(Math.cos(rotRad) * height),
    }
  }

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Canvas context is null')
    }

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    )

    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(getRadianAngle(rotation))
    ctx.translate(-bBoxWidth / 2, -bBoxHeight / 2)

    ctx.drawImage(
      image,
      bBoxWidth / 2 - image.width * 0.5,
      bBoxHeight / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, bBoxWidth, bBoxHeight)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      Math.round(0 - bBoxWidth / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - bBoxHeight / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas is empty'))
          }
        },
        'image/jpeg',
        0.95
      )
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    try {
      setIsProcessing(true)
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )
      onSave(croppedImageBlob)
      onOpenChange(false)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Profil Fotoğrafını Düzenle</DialogTitle>
          <DialogDescription>
            Fotoğrafınızı kırpın, yakınlaştırın veya döndürün
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Crop Area */}
          <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              minZoom={minZoom}
              maxZoom={maxZoom}
              cropShape="round"
              showGrid={false}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ZoomIn className="h-4 w-4" />
                <span>Yakınlaştırma</span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={minZoom}
                  max={maxZoom}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RotateCw className="h-4 w-4" />
                <span>Döndürme</span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="flex items-center gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  90° Döndür
                </Button>
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(value) => setRotation(value[0])}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-12 text-right">
                  {rotation}°
                </span>
              </div>
            </div>

            {/* Position Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Move className="h-4 w-4" />
                <span>Konum</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fotoğrafı sürükleyerek konumunu ayarlayın
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isProcessing}
            >
              Sıfırla
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? 'İşleniyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
