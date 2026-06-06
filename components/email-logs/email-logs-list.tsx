'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Mail,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface EmailLogListItem {
  id: string
  jobName: string
  emailType: string
  subject: string
  recipientEmails: string[]
  status: 'PENDING' | 'SENT' | 'FAILED'
  sentAt: Date | null
  createdAt: Date
  errorMessage: string | null
  hasAttachments?: boolean
}

interface EmailLogsListProps {
  items: EmailLogListItem[]
  selectedId?: string
  onSelect: (id: string) => void
  onViewDetail?: (id: string) => void
  isLoading?: boolean
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

export function EmailLogsList({
  items,
  selectedId,
  onSelect,
  onViewDetail,
  isLoading,
}: EmailLogsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Mail className="h-12 w-12 mb-4 opacity-50" />
        <p>Email log bulunamadı</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-3">
        {items.map((item) => {
          const statusInfo = statusConfig[item.status]
          const StatusIcon = statusInfo.icon

          return (
            <Card
              key={item.id}
              className={cn(
                'transition-all duration-200 cursor-pointer hover:shadow-md',
                selectedId === item.id &&
                  'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md'
              )}
              onClick={() => onSelect(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Left side - Icon */}
                  <div className="shrink-0 pt-1">
                    {item.hasAttachments ? (
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>

                  {/* Middle - Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {item.jobName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-medium shrink-0',
                            statusInfo.className
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">
                            {statusInfo.label}
                          </span>
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap">
                        {format(item.createdAt, 'd MMM yyyy, HH:mm', {
                          locale: tr,
                        })}
                      </span>
                    </div>

                    {/* Subject */}
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {item.subject}
                    </div>

                    {/* Recipients */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                      <span className="font-medium">Kime:</span>{' '}
                      {item.recipientEmails.join(', ')}
                    </div>

                    {/* Sent date */}
                    {item.sentAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Gönderilme:</span>{' '}
                        {format(item.sentAt, 'd MMM yyyy, HH:mm', {
                          locale: tr,
                        })}
                      </div>
                    )}

                    {/* Error message */}
                    {item.errorMessage && (
                      <div className="text-xs text-red-600 dark:text-red-400 line-clamp-2 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="font-medium">Hata:</span>{' '}
                        {item.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Right side - Detail button */}
                  <div className="shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewDetail?.(item.id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detayları Görüntüle</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}
