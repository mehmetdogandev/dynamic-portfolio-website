'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  RefreshCw,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isHtmlContentUrl,
  ensureBaseUrlForHtml,
  replaceCidWithAttachmentUrls,
} from '@/lib/mail/email-html-utils'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'

export interface Attachment {
  fileName: string
  originalName: string
  path: string
  size: number
  mimeType: string
  url?: string
  fileId?: string
  cid?: string
}

interface EmailLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logId: string | null
}

const statusConfig = {
  SENT: {
    icon: CheckCircle2,
    label: 'Gönderildi',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  PENDING: {
    icon: Clock,
    label: 'Beklemede',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  FAILED: {
    icon: AlertCircle,
    label: 'Başarısız',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

export function EmailLogDetailDialog({
  open,
  onOpenChange,
  logId,
}: EmailLogDetailDialogProps) {
  const trpc = useTRPC()

  const { data: emailLogDetails, isLoading } = useQuery({
    ...trpc.emailLogs.getById.queryOptions({
      id: logId!,
    }),
    enabled: open && !!logId,
  })

  const [resolvedHtml, setResolvedHtml] = useState<string | null>(null)
  const [htmlFetchError, setHtmlFetchError] = useState<string | null>(null)
  const [htmlLoading, setHtmlLoading] = useState(false)

  const rawHtmlContent = emailLogDetails?.htmlContent ?? null

  useEffect(() => {
    const raw = rawHtmlContent
    if (!raw) {
      setResolvedHtml(null)
      setHtmlFetchError(null)
      setHtmlLoading(false)
      return
    }
    if (!isHtmlContentUrl(raw)) {
      setResolvedHtml(raw)
      setHtmlFetchError(null)
      setHtmlLoading(false)
      return
    }
    const url = raw.startsWith('/') ? raw : `/${raw}`
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!logId) {
    return null
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Log Detayları</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!emailLogDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Log Detayları</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Email log bulunamadı
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Type assertion to help TypeScript understand the type
  // Define the expected type structure
  type EmailLogDetailType = {
    id: string
    emailType: string
    jobName: string
    subject: string
    recipientEmails?: string[] | null
    ccEmails?: string[] | null
    bccEmails?: string[] | null
    senderEmail?: string | null
    senderName?: string | null
    htmlContent?: string | null
    textContent?: string | null
    attachmentPath?: string | null
    attachments?: Array<Attachment & { cid?: string }> | null
    status: 'PENDING' | 'SENT' | 'FAILED'
    retryCount: number
    lastRetryAt?: Date | string | null
    sentAt?: Date | string | null
    errorMessage?: string | null
    createdAt: Date | string
  }
  const log = emailLogDetails as EmailLogDetailType
  const statusInfo = statusConfig[log.status]
  const StatusIcon = statusInfo.icon

  // Date variables for Metadata Card
  const createdAt = log.createdAt
    ? new Date(log.createdAt as string | number | Date)
    : null

  const sentAt = log.sentAt
    ? new Date(log.sentAt as string | number | Date)
    : null

  const lastRetryAt = log.lastRetryAt
    ? new Date(log.lastRetryAt as string | number | Date)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                      {log.subject}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex gap-4 flex-wrap text-sm mt-2 text-slate-500 dark:text-slate-400">
                        <span>{log.jobName}</span>
                        <span>•</span>
                        <span>{log.emailType}</span>
                      </div>
                    </DialogDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-sm font-medium shrink-0',
                      statusInfo.className
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recipients Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  Alıcılar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Kimden:
                  </span>
                  <div className="text-sm mt-1">
                    {log.senderName
                      ? `${log.senderName}${log.senderEmail ? ` <${log.senderEmail}>` : ''}`
                      : log.senderEmail || '-'}
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Kime:
                  </span>
                  <div className="text-sm mt-1">
                    {log.recipientEmails && log.recipientEmails.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {log.recipientEmails.map((email, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {email}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                {log.ccEmails && log.ccEmails.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        CC:
                      </span>
                      <div className="text-sm mt-1">
                        <div className="flex flex-wrap gap-1">
                          {log.ccEmails.map((email, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                {log.bccEmails && log.bccEmails.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        BCC:
                      </span>
                      <div className="text-sm mt-1">
                        <div className="flex flex-wrap gap-1">
                          {log.bccEmails.map((email, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Meta Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Oluşturulma:
                  </span>
                  <div className="text-sm mt-1">
                    {createdAt
                      ? format(createdAt, 'd MMMM yyyy, HH:mm:ss', {
                          locale: tr,
                        })
                      : '-'}
                  </div>
                </div>

                {sentAt && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Gönderilme:
                      </span>
                      <div className="text-sm mt-1">
                        {format(sentAt, 'd MMMM yyyy, HH:mm:ss', {
                          locale: tr,
                        })}
                      </div>
                    </div>
                  </>
                )}

                {(log.retryCount ?? 0) > 0 && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Tekrar Deneme:
                      </span>

                      <div className="text-sm mt-1">
                        {log.retryCount ?? 0} kez
                        {lastRetryAt && (
                          <span className="text-muted-foreground ml-2">
                            (Son{' '}
                            {format(lastRetryAt, 'd MMM yyyy, HH:mm', {
                              locale: tr,
                            })}
                            )
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Error Card */}
            {log.errorMessage ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Hata Mesajı:</div>
                  <div>{String(log.errorMessage)}</div>
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Attachments Card */}
            {log.attachments &&
              Array.isArray(log.attachments) &&
              log.attachments.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-slate-500" />
                      Ekler ({log.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {log.attachments.map(
                        (attachment: Attachment, index: number) => {
                          const viewUrl =
                            attachment.url ||
                            (attachment.fileId
                              ? `/api/files/${attachment.fileId}/view`
                              : undefined)
                          const isImage =
                            attachment.mimeType?.startsWith('image/') ?? false
                          return (
                            <a
                              key={index}
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all no-underline text-inherit"
                            >
                              {isImage && viewUrl ? (
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
                              {viewUrl && (
                                <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors" />
                              )}
                            </a>
                          )
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Content Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  İçerik
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {htmlLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : htmlFetchError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      İçerik yüklenemedi: {htmlFetchError}
                    </AlertDescription>
                  </Alert>
                ) : resolvedHtml ? (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-50 overflow-hidden">
                    <iframe
                      title="E-posta içeriği"
                      srcDoc={ensureBaseUrlForHtml(
                        replaceCidWithAttachmentUrls(
                          resolvedHtml,
                          log.attachmentPath,
                          log.attachments
                        )
                      )}
                      sandbox="allow-same-origin"
                      className="w-full border-0"
                      style={{ minHeight: '500px', height: '80vh' }}
                    />
                  </div>
                ) : log.textContent ? (
                  <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg border">
                    {log.textContent}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    İçerik bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
