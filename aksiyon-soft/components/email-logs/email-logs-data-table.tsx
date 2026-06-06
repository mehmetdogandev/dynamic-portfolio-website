'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ColumnDef,
  SortingState,
  PaginationState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, Eye, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface EmailLogsDataTableProps {
  data: EmailLogListItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPaginationChange?: OnChangeFn<PaginationState>
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
  onViewDetail?: (id: string) => void
  isLoading?: boolean
  toolbarFilters?: React.ReactNode
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

export function EmailLogsDataTable({
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  onViewDetail,
  isLoading,
  toolbarFilters,
}: EmailLogsDataTableProps) {
  const columns: ColumnDef<EmailLogListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'jobName',
        header: 'Job',
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-2">
              {item.hasAttachments && (
                <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <span className="font-medium">{item.jobName}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'subject',
        header: 'Konu',
        cell: ({ row }) => {
          return (
            <div
              className="max-w-[300px] truncate"
              title={row.original.subject}
            >
              {row.original.subject}
            </div>
          )
        },
      },
      {
        accessorKey: 'recipientEmails',
        header: 'Alıcılar',
        cell: ({ row }) => {
          const emails = row.original.recipientEmails
          if (!emails || emails.length === 0) return '-'
          return (
            <div className="max-w-[200px] truncate" title={emails.join(', ')}>
              {emails.join(', ')}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Durum',
        cell: ({ row }) => {
          const status = row.original.status
          const statusInfo = statusConfig[status]
          const StatusIcon = statusInfo.icon
          return (
            <Badge
              variant="outline"
              className={cn('text-xs font-medium', statusInfo.className)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Oluşturulma',
        cell: ({ row }) => {
          return format(row.original.createdAt, 'd MMM yyyy, HH:mm', {
            locale: tr,
          })
        },
      },
      {
        accessorKey: 'sentAt',
        header: 'Gönderilme',
        cell: ({ row }) => {
          const sentAt = row.original.sentAt
          if (!sentAt) return '-'
          return format(sentAt, 'd MMM yyyy, HH:mm', { locale: tr })
        },
      },
      createIconActionColumn<EmailLogListItem>((row) => [
        {
          icon: Eye,
          label: 'Detayları görüntüle',
          onClick: () => onViewDetail?.(row.original.id),
        },
      ]),
    ],
    [onViewDetail]
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={
        pagination
          ? {
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }
          : undefined
      }
      onPaginationChange={
        onPaginationChange
          ? (paginationUpdater) => {
              if (typeof paginationUpdater === 'function') {
                const currentPageIndex = pagination?.page
                  ? pagination.page - 1
                  : 0
                const currentPageSize = pagination?.limit || 10
                const newPagination = paginationUpdater({
                  pageIndex: currentPageIndex,
                  pageSize: currentPageSize,
                })
                onPaginationChange({
                  pageIndex: newPagination.pageIndex,
                  pageSize: newPagination.pageSize,
                })
              } else {
                onPaginationChange(paginationUpdater)
              }
            }
          : undefined
      }
      sorting={sorting}
      onSortingChange={onSortingChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      isLoading={isLoading}
      searchPlaceholder="Konu, gönderen veya alıcıda ara..."
      toolbarFilters={toolbarFilters}
      autoHideEmptyColumns={false}
    />
  )
}
