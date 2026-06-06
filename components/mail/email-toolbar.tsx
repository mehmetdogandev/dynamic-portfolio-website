'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image,
  Table,
  Undo,
  Redo,
  Type,
  Highlighter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { EmailRichTextEditorRef } from './email-rich-text-editor'
import type { AttachmentMetadata } from './attachment-manager'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface EmailToolbarProps {
  editorRef:
    | React.RefObject<EmailRichTextEditorRef | null>
    | React.MutableRefObject<EmailRichTextEditorRef | null>
  onImageInsert?: (attachment: AttachmentMetadata) => void
}

export function EmailToolbar({ editorRef, onImageInsert }: EmailToolbarProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showColorDialog, setShowColorDialog] = useState(false)
  const [showHighlightDialog, setShowHighlightDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [textColor, setTextColor] = useState('#000000')
  const [highlightColor, setHighlightColor] = useState('#ffff00')
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableHeader, setTableHeader] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{
    attrs: { align?: string }
  } | null>(null)
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>(
    'left'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const trpc = useTRPC()

  // Check for image selection periodically
  useEffect(() => {
    const checkSelection = () => {
      const image = editorRef.current?.getSelectedImage()
      if (image) {
        setSelectedImage(image)
        setImageAlign(image.attrs.align || 'left')
      } else {
        setSelectedImage(null)
      }
    }

    const interval = setInterval(checkSelection, 100)
    return () => clearInterval(interval)
  }, [editorRef])

  const uploadMutation = useMutation(
    trpc.mail.uploadAttachment.mutationOptions()
  )

  const handleImageUpload = async (file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
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

      // Insert image into editor
      editorRef.current?.insertImage(
        result,
        file.name,
        undefined,
        undefined,
        'left'
      )

      onImageInsert?.(result)
      setShowImageDialog(false)
      toast.success('Resim eklendi')
    } catch (error) {
      toast.error('Resim yüklenemedi')
      console.error('Image upload error:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    } else {
      toast.error('Lütfen bir resim dosyası seçin')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 flex-wrap">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.undo()}
          className="h-8 w-8 p-0"
          title="Geri Al"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.redo()}
          className="h-8 w-8 p-0"
          title="Yinele"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.toggleBold()}
          className="h-8 w-8 p-0"
          title="Kalın"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.toggleItalic()}
          className="h-8 w-8 p-0"
          title="İtalik"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.toggleUnderline()}
          className="h-8 w-8 p-0"
          title="Altı Çizili"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text Color */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowColorDialog(true)
          }}
          className="h-8 w-8 p-0"
          title="Metin Rengi"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowHighlightDialog(true)
          }}
          className="h-8 w-8 p-0"
          title="Arka Plan Rengi"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.setTextAlign('left')}
          className="h-8 w-8 p-0"
          title="Sola Hizala"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.setTextAlign('center')}
          className="h-8 w-8 p-0"
          title="Ortala"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.setTextAlign('right')}
          className="h-8 w-8 p-0"
          title="Sağa Hizala"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.setTextAlign('justify')}
          className="h-8 w-8 p-0"
          title="İki Yana Yasla"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.toggleBulletList()}
          className="h-8 w-8 p-0"
          title="Madde İşareti"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editorRef.current?.toggleOrderedList()}
          className="h-8 w-8 p-0"
          title="Numaralı Liste"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageDialog(true)}
          className="h-8 w-8 p-0"
          title="Resim Ekle"
        >
          <Image className="h-4 w-4" />
        </Button>

        {/* Image Alignment Controls - shown when image is selected */}
        {selectedImage && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <Button
              type="button"
              variant={imageAlign === 'left' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                editorRef.current?.setImageAlign('left')
                setImageAlign('left')
              }}
              className="h-8 w-8 p-0"
              title="Görseli Sola Hizala"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={imageAlign === 'center' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                editorRef.current?.setImageAlign('center')
                setImageAlign('center')
              }}
              className="h-8 w-8 p-0"
              title="Görseli Ortala"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={imageAlign === 'right' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                editorRef.current?.setImageAlign('right')
                setImageAlign('right')
              }}
              className="h-8 w-8 p-0"
              title="Görseli Sağa Hizala"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Table */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowTableDialog(true)}
          className="h-8 w-8 p-0"
          title="Tablo Ekle"
        >
          <Table className="h-4 w-4" />
        </Button>

        {/* Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('Link URL:')
            if (url) {
              document.execCommand('createLink', false, url)
            }
          }}
          className="h-8 w-8 p-0"
          title="Link Ekle"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resim Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="imageFile">Resim Dosyası</Label>
              <Input
                id="imageFile"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageDialog(false)}
            >
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Text Color Dialog */}
      <Dialog open={showColorDialog} onOpenChange={setShowColorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Metin Rengi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="textColor">Renk</Label>
              <Input
                id="textColor"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowColorDialog(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => {
                editorRef.current?.setTextColor(textColor)
                setShowColorDialog(false)
              }}
            >
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Highlight Color Dialog */}
      <Dialog open={showHighlightDialog} onOpenChange={setShowHighlightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arka Plan Rengi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="highlightColor">Renk</Label>
              <Input
                id="highlightColor"
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="mt-2 h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHighlightDialog(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => {
                editorRef.current?.setHighlightColor(highlightColor)
                setShowHighlightDialog(false)
              }}
            >
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tablo Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="tableRows">Satır Sayısı</Label>
              <Input
                id="tableRows"
                type="number"
                min="1"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tableCols">Sütun Sayısı</Label>
              <Input
                id="tableCols"
                type="number"
                min="1"
                max="20"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tableHeader"
                checked={tableHeader}
                onChange={(e) => setTableHeader(e.target.checked)}
              />
              <Label htmlFor="tableHeader">Başlık Satırı Ekle</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTableDialog(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => {
                editorRef.current?.insertTable(
                  tableRows,
                  tableCols,
                  tableHeader
                )
                setShowTableDialog(false)
              }}
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
