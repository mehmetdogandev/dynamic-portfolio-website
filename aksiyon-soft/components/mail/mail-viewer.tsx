'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Reply,
  Forward,
  Trash2,
  RotateCcw,
  Paperclip,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  isHtmlContentUrl,
  ensureBaseUrlForHtml,
  replaceCidWithAttachmentUrls,
} from '@/lib/mail/email-html-utils'

export interface Attachment {
  fileName: string
  originalName: string
  path: string
  size: number
  mimeType: string
  url?: string
  cid?: string
  fileId?: string
  isInline?: boolean
}

export interface MailViewerData {
  id: string
  subject: string
  from: string
  fromName?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  date: Date
  htmlContent?: string
  textContent?: string
  attachments?: Attachment[]
  attachmentPath?: string | null
}

interface MailViewerProps {
  mail: MailViewerData | null
  onReply?: () => void
  onForward?: () => void
  onDelete?: () => void
  onRestore?: () => void
  isFromTrash?: boolean
  isForwarding?: boolean
}

export function MailViewer({
  mail,
  onReply,
  onForward,
  onDelete,
  onRestore,
  isFromTrash,
  isForwarding,
}: MailViewerProps) {
  const [resolvedHtml, setResolvedHtml] = useState<string | null>(null)
  const [htmlFetchError, setHtmlFetchError] = useState<string | null>(null)
  const [htmlLoading, setHtmlLoading] = useState(false)

  const rawHtmlContent = mail?.htmlContent ?? null

  useEffect(() => {
    if (!rawHtmlContent) {
      setResolvedHtml(null)
      setHtmlFetchError(null)
      setHtmlLoading(false)
      return
    }
    if (!isHtmlContentUrl(rawHtmlContent)) {
      setResolvedHtml(rawHtmlContent)
      setHtmlFetchError(null)
      setHtmlLoading(false)
      return
    }
    const url = rawHtmlContent.startsWith('/')
      ? rawHtmlContent
      : `/${rawHtmlContent}`
    setHtmlLoading(true)
    setHtmlFetchError(null)
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.text()
      })
      .then((text) => {
        setResolvedHtml(text)
        setHtmlFetchError(null)
      })
      .catch((err) => {
        setHtmlFetchError(err instanceof Error ? err.message : String(err))
        setResolvedHtml(null)
      })
      .finally(() => setHtmlLoading(false))
  }, [rawHtmlContent])

  if (!mail) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p>Bir e-posta seçin</p>
        </div>
      </div>
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-slate-950/80">
      <ScrollArea className="flex-1">
        <div className="p-5 md:p-6 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
                    {mail.subject}
                  </h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Kimden
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {mail.fromName
                          ? `${mail.fromName} <${mail.from}>`
                          : mail.from}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Kime
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5 break-all">
                        {mail.to.join(', ')}
                      </p>
                    </div>
                    {mail.cc && mail.cc.length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          CC
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 break-all">
                          {mail.cc.join(', ')}
                        </p>
                      </div>
                    )}
                    {mail.bcc && mail.bcc.length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          BCC
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 break-all">
                          {mail.bcc.join(', ')}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Tarih
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {format(mail.date, 'd MMMM yyyy, HH:mm', {
                          locale: tr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {onReply && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={onReply}
                    >
                      <Reply className="h-4 w-4" />
                      Yanıtla
                    </Button>
                  )}
                  {onForward && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={onForward}
                      disabled={isForwarding}
                    >
                      {isForwarding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Forward className="h-4 w-4" />
                      )}
                      Yönlendir
                    </Button>
                  )}
                  {isFromTrash && onRestore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={onRestore}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Geri Getir
                    </Button>
                  )}
                  {!isFromTrash && onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {mail.attachments && mail.attachments.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  Ekler ({mail.attachments.length})
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mail.attachments.map((attachment, index) => {
                  const viewUrl =
                    attachment.url ||
                    (attachment.fileId
                      ? `/api/files/${attachment.fileId}/view`
                      : undefined)
                  const isImage =
                    attachment.mimeType?.startsWith('image/') ?? false
                  return viewUrl ? (
                    <a
                      key={index}
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all no-underline text-inherit"
                    >
                      {isImage ? (
                        <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 ring-1 ring-slate-200/50 dark:ring-slate-600/50">
                          <img
                            src={viewUrl}
                            alt={attachment.originalName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-12 h-12 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Paperclip className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">
                          {attachment.originalName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors" />
                    </a>
                  ) : (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="shrink-0 w-12 h-12 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Paperclip className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {attachment.originalName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Content */}
          {htmlLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : htmlFetchError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                İçerik yüklenemedi: {htmlFetchError}
              </AlertDescription>
            </Alert>
          ) : resolvedHtml ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  E-posta İçeriği
                </h3>
              </div>
              <div className="relative">
                <iframe
                  title="E-posta içeriği"
                  srcDoc={ensureBaseUrlForHtml(
                    replaceCidWithAttachmentUrls(
                      resolvedHtml,
                      mail.attachmentPath,
                      mail.attachments
                    )
                  )}
                  sandbox="allow-same-origin"
                  className="w-full border-0"
                  style={{ minHeight: '500px', height: '80vh' }}
                />
              </div>
            </div>
          ) : mail.textContent ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-5 shadow-sm">
              <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {mail.textContent}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                İçerik bulunamadı
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
