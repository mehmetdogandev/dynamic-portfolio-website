'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface AttachmentMetadata {
  fileName: string
  originalName: string
  path: string
  size: number
  mimeType: string
  url?: string
  fileId?: string // File ID for preview URL generation
}

interface AttachmentManagerProps {
  attachments: AttachmentMetadata[]
  onAttachmentsChange: (attachments: AttachmentMetadata[]) => void
  maxSize?: number // in bytes
}

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  maxSize = 10 * 1024 * 1024, // 10MB default
}: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const trpc = useTRPC()

  const uploadMutation = useMutation(
    trpc.mail.uploadAttachment.mutationOptions()
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > maxSize) {
          toast.error(
            `${file.name} çok büyük (Maksimum: ${formatFileSize(maxSize)})`
          )
          return null
        }

        // Convert file to base64
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            // Remove data URL prefix
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const result = await uploadMutation.mutateAsync({
          file: base64,
          fileName: file.name,
          mimeType: file.type,
        })

        return result
      })

      const results = await Promise.all(uploadPromises)
      const validAttachments = results.filter(
        (r): r is AttachmentMetadata => r !== null
      )

      onAttachmentsChange([...attachments, ...validAttachments])
      toast.success(`${validAttachments.length} dosya yüklendi`)
    } catch (error) {
      toast.error('Dosya yükleme başarısız')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4 mr-2" />
              Ek Ekle
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {attachment.originalName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.size)} • {attachment.mimeType}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
