'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (file: File) => void
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setHasPermission(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
      toast.error(
        'Kameraya erişilemedi. Lütfen kamera izinlerini kontrol edin.'
      )
    }
  }, [facingMode])

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open, startCamera, stopCamera])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0)

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Fotoğraf çekilemedi')
          return
        }

        // Create a File from the blob
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Fotoğraf boyutu 5MB'dan büyük olamaz")
          return
        }

        onCapture(file)
        onOpenChange(false)
        toast.success('Fotoğraf çekildi')
      },
      'image/jpeg',
      0.9
    )
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  const handleClose = () => {
    stopCamera()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Kameradan Fotoğraf Çek</DialogTitle>
          <DialogDescription>
            Kameradan fotoğraf çekmek için izin verin
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {hasPermission === false ? (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                Kameraya erişim izni verilmedi. Lütfen tarayıcı ayarlarından
                kamera iznini etkinleştirin.
              </p>
              <Button onClick={startCamera} variant="outline">
                Tekrar Dene
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {!hasPermission && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                      <p className="text-muted-foreground">
                        Kamera başlatılıyor...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={switchCamera}
                  disabled={!hasPermission}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Kamerayı Değiştir
                </Button>
                <Button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!hasPermission || isCapturing}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Fotoğraf Çek
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
