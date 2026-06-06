'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ArrowLeft,
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  User,
  Calendar,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface Attachment {
  fileName: string
  originalName: string
  path: string
  size: number
  mimeType: string
  url?: string
}

export interface EmailLogDetailData {
  id: string
  jobName: string
  emailType: string
  subject: string
  recipientEmails: string[]
  ccEmails?: string[]
  bccEmails?: string[]
  senderEmail: string | null
  senderName: string | null
  htmlContent?: string | null
  textContent?: string | null
  attachments?: Attachment[]
  status: 'PENDING' | 'SENT' | 'FAILED'
  retryCount: number
  lastRetryAt: Date | null
  sentAt: Date | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

interface EmailLogDetailProps {
  log: EmailLogDetailData | null
  onBack: () => void
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

export function EmailLogDetail({ log, onBack }: EmailLogDetailProps) {
  if (!log) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p>Bir email log seçin</p>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[log.status]
  const StatusIcon = statusInfo.icon

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <Badge
            variant="outline"
            className={cn('text-sm font-medium', statusInfo.className)}
          >
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{log.subject}</CardTitle>
              <CardDescription className="space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Job:</span>
                  <span>{log.jobName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email Tipi:</span>
                  <span>{log.emailType}</span>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recipients Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Alıcılar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kimden:
                </span>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {log.senderName
                    ? `${log.senderName}${log.senderEmail ? ` <${log.senderEmail}>` : ''}`
                    : log.senderEmail || '-'}
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kime:
                </span>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {log.recipientEmails.length > 0 ? (
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
              {log.ccEmails && log.ccEmails.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      CC:
                    </span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
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
              )}
              {log.bccEmails && log.bccEmails.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      BCC:
                    </span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
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
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Meta Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Oluşturulma:
                </span>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {format(log.createdAt, 'd MMMM yyyy, HH:mm:ss', {
                    locale: tr,
                  })}
                </div>
              </div>
              {log.sentAt && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gönderilme:
                    </span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {format(log.sentAt, 'd MMMM yyyy, HH:mm:ss', {
                        locale: tr,
                      })}
                    </div>
                  </div>
                </>
              )}
              {log.retryCount > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Tekrar Deneme:
                    </span>
                    <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {log.retryCount} kez
                      {log.lastRetryAt && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          (Son:{' '}
                          {format(log.lastRetryAt, 'd MMM yyyy, HH:mm', {
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
          {log.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Hata Mesajı:</div>
                <div>{log.errorMessage}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Attachments Card */}
          {log.attachments && log.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Ekler ({log.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {log.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {attachment.originalName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.size)} •{' '}
                            {attachment.mimeType}
                          </div>
                        </div>
                      </div>
                      {attachment.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={attachment.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            İndir
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                İçerik
              </CardTitle>
            </CardHeader>
            <CardContent>
              {log.htmlContent ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-gray-700 dark:prose-p:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: log.htmlContent }}
                />
              ) : log.textContent ? (
                <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                  {log.textContent}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  İçerik bulunamadı
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
