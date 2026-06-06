'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  X,
  Loader2,
} from 'lucide-react'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'

export type GenericImportRowResult = {
  rowNumber: number
  status: 'success' | 'failed' | 'skipped'
  message?: string
}

export type GenericImportSummary = {
  successCount: number
  failedCount: number
  skippedCount?: number
  results: GenericImportRowResult[]
}

type ScopeKey = keyof typeof SCOPES

interface GenericImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityName: string
  /** Scope used for {@link PERMISSIONS.IMPORT}. */
  requiredScope: ScopeKey
  listQueryKey: unknown[]
  fetchTemplate: () => Promise<{ base64: string; fileName: string }>
  runImport: (fileBase64: string) => Promise<GenericImportSummary>
}

export function GenericImportDialog({
  open,
  onOpenChange,
  entityName,
  requiredScope,
  listQueryKey,
  fetchTemplate,
  runImport,
}: GenericImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<GenericImportSummary | null>(
    null
  )
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)

  const { data: canImport } = usePermission(requiredScope, PERMISSIONS.IMPORT)

  const queryClient = useQueryClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      toast.error('Lütfen geçerli bir Excel dosyası seçin (.xlsx, .xls)')
      return
    }

    setSelectedFile(file)
    setImportResult(null)
  }

  const handleDownloadTemplate = async () => {
    try {
      setIsLoadingTemplate(true)
      const { base64, fileName } = await fetchTemplate()
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Şablon başarıyla indirildi')
    } catch (error) {
      console.error('Template download error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Şablon indirilirken bir hata oluştu'
      )
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin')
      return
    }

    try {
      setIsImporting(true)

      const arrayBuffer = await selectedFile.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binaryString = ''
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]!)
      }
      const base64 = btoa(binaryString)

      const result = await runImport(base64)

      setImportResult(result)

      queryClient.invalidateQueries({
        queryKey: listQueryKey as readonly unknown[],
      })

      if (result.successCount > 0) {
        toast.success(
          `${result.successCount} ${entityName} başarıyla içe aktarıldı`
        )
      }
      if ((result.skippedCount ?? 0) > 0) {
        toast.info(`${result.skippedCount} kayıt atlandı`)
      }
      if (result.failedCount > 0) {
        toast.error(
          `${result.failedCount} satır başarısız oldu. Detayları aşağıdan görebilirsiniz.`
        )
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSelectedFile(null)
    } catch (error) {
      console.error('Import error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'İçe aktarım sırasında bir hata oluştu'
      )
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null)
      setImportResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onOpenChange(false)
    }
  }

  const skipped = importResult?.skippedCount ?? 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className=" max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entityName} Excel İçe Aktarımı</DialogTitle>
          <DialogDescription>
            Excel dosyası yükleyerek {entityName.toLowerCase()} verilerini toplu
            olarak içe aktarabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canImport && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Şablon Dosyası
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Şablon dosyasını indirip doldurarak içe aktarım
                    yapabilirsiniz.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={isLoadingTemplate}
                >
                  {isLoadingTemplate ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Şablon İndir
                </Button>
              </div>
            </div>
          )}

          {!canImport && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                {entityName} içe aktarımı için yetkiniz bulunmamaktadır.
              </p>
            </div>
          )}

          {canImport && (
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Dosya Seç</h3>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={isImporting || !canImport}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      asChild
                      disabled={isImporting || !canImport}
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Dosya Seç
                      </span>
                    </Button>
                  </label>
                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        disabled={isImporting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={!selectedFile || isImporting || !canImport}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </>
                )}
              </Button>
            </div>
          )}

          {importResult && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">İçe Aktarım Sonuçları</h3>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Başarılı: {importResult.successCount}
                  </Badge>
                  {skipped > 0 && (
                    <Badge variant="outline">
                      <SkipForward className="h-3 w-3 mr-1" />
                      Atlandı: {skipped}
                    </Badge>
                  )}
                  {importResult.failedCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Başarısız: {importResult.failedCount}
                    </Badge>
                  )}
                </div>
              </div>

              {importResult.results.length > 0 && (
                <ScrollArea className="h-64 w-full rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Satır No</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Mesaj</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.results.map((result, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{result.rowNumber}</TableCell>
                          <TableCell>
                            {result.status === 'success' ? (
                              <Badge variant="default" className="bg-green-500">
                                Başarılı
                              </Badge>
                            ) : result.status === 'skipped' ? (
                              <Badge variant="outline">Atlandı</Badge>
                            ) : (
                              <Badge variant="destructive">Başarısız</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {result.message ||
                              (result.status === 'success'
                                ? 'Başarıyla içe aktarıldı'
                                : '')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
