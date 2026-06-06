'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import {
  EmailLogsDataTable,
  type EmailLogListItem,
} from '@/components/email-logs/email-logs-data-table'
import { EmailLogDetailDialog } from '@/components/email-logs/email-log-detail-dialog'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { Loader2 } from 'lucide-react'
import { SortingState } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EMAIL_JOB_LABELS,
  EMAIL_JOB_TYPE_VALUES,
  type EmailJobType,
} from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function EmailLogsPage() {
  const trpc = useTRPC()
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<
    'subject' | 'emailType' | 'status' | 'createdAt'
  >('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Convert sortBy/sortOrder to SortingState for DataTable
  const sorting: SortingState = useMemo(
    () => [
      {
        id: sortBy,
        desc: sortOrder === 'desc',
      },
    ],
    [sortBy, sortOrder]
  )

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const newSorting =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting)
        : updaterOrValue
    if (newSorting.length > 0) {
      const sort = newSorting[0]
      setSortBy(sort.id as typeof sortBy)
      setSortOrder(sort.desc ? 'desc' : 'asc')
    }
  }

  const { data: canAccessMailLog, isLoading: isLoadingMailLogAccess } =
    usePermission(SCOPES.MAIL_LOG, PERMISSIONS.ACCESS)

  // Fetch email logs
  const { data: emailLogsData, isLoading: isLoadingLogs } = useQuery({
    ...trpc.emailLogs.list.queryOptions({
      page,
      limit,
      search: searchQuery || undefined,
      emailType:
        emailTypeFilter !== 'all'
          ? (emailTypeFilter as EmailJobType)
          : undefined,
      status:
        statusFilter !== 'all'
          ? (statusFilter as 'PENDING' | 'SENT' | 'FAILED')
          : undefined,
      sortBy,
      sortOrder,
    }),
    enabled: canAccessMailLog === true,
  })

  if (isLoadingMailLogAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccessMailLog) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Erişim reddedildi
              </CardTitle>
              <CardDescription>
                Bu sayfaya erişmek için MAIL_LOG kapsamında erişim iznine
                ihtiyacınız vardır.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Prepare email log list items
  const emailLogListItems: EmailLogListItem[] = []

  if (emailLogsData) {
    emailLogListItems.push(
      ...emailLogsData.data.map((log) => ({
        id: log.id,
        jobName: log.jobName,
        emailType: log.emailType,
        subject: log.subject,
        recipientEmails: log.recipientEmails || [],
        status: log.status,
        sentAt: log.sentAt ? new Date(log.sentAt) : null,
        createdAt: new Date(log.createdAt),
        errorMessage: log.errorMessage,
        hasAttachments:
          Array.isArray(log.attachments) && log.attachments.length > 0,
      }))
    )
  }

  const handleLogSelect = (id: string) => {
    setSelectedLogId(id)
    setDetailDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDetailDialogOpen(open)
    if (!open) {
      setSelectedLogId(null)
    }
  }

  const toolbarFilters = (
    <div className="flex items-center gap-2">
      <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Email Tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm tipler</SelectItem>
          {EMAIL_JOB_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>
              {EMAIL_JOB_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="SENT">Gönderildi</SelectItem>
          <SelectItem value="PENDING">Beklemede</SelectItem>
          <SelectItem value="FAILED">Başarısız</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary sm:text-2xl">
              Email Logları
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Mail gönderim süreçlerinin durumunu ve geçmiş kayıtlarını takip
              edin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailLogsDataTable
              data={emailLogListItems}
              pagination={
                emailLogsData
                  ? {
                      page: emailLogsData.pagination.page,
                      limit: emailLogsData.pagination.limit,
                      total: emailLogsData.pagination.total,
                      totalPages: emailLogsData.pagination.totalPages,
                    }
                  : undefined
              }
              onPaginationChange={(paginationUpdater) => {
                if (typeof paginationUpdater === 'function') {
                  const currentPageIndex = page - 1
                  const currentPageSize = limit
                  const currentPagination: {
                    pageIndex: number
                    pageSize: number
                  } = {
                    pageIndex: currentPageIndex,
                    pageSize: currentPageSize,
                  }
                  const newPagination = paginationUpdater(currentPagination)
                  setPage(newPagination.pageIndex + 1)
                } else {
                  setPage(paginationUpdater.pageIndex + 1)
                }
              }}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              globalFilter={searchQuery}
              onGlobalFilterChange={(filter) => {
                setSearchQuery(filter)
                setPage(1)
              }}
              onViewDetail={handleLogSelect}
              isLoading={isLoadingLogs}
              toolbarFilters={toolbarFilters}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <EmailLogDetailDialog
        open={detailDialogOpen}
        onOpenChange={handleDialogClose}
        logId={selectedLogId}
      />
    </DashboardLayout>
  )
}
