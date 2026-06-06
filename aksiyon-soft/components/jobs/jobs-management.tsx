'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery } from '@tanstack/react-query'
import cronstrue from 'cronstrue/i18n'
import { Info, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type JobRow = {
  id: string
  name: string
  description: string | undefined
  schedule: string | null | undefined
  enabled: boolean | undefined
  timezone: string | undefined
}

function getCronDescription(schedule: string): string {
  try {
    return cronstrue.toString(schedule, { locale: 'tr' })
  } catch {
    return schedule
  }
}

function getNextRunTime(schedule: string): Date | null {
  try {
    const parts = schedule.trim().split(/\s+/)
    if (parts.length !== 5) return null

    const [minute, hour, day, month, weekday] = parts
    const now = new Date()
    const nowUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )
    )

    const matches = (value: number, pattern: string): boolean => {
      if (pattern === '*') return true
      if (pattern.includes(',')) {
        return pattern.split(',').some((p) => matches(value, p.trim()))
      }
      if (pattern.includes('/')) {
        const [range, step] = pattern.split('/')
        const stepNum = parseInt(step, 10)
        if (range === '*') return value % stepNum === 0
        const [start] = range.split('-').map(Number)
        return value >= start && (value - start) % stepNum === 0
      }
      if (pattern.includes('-')) {
        const [start, end] = pattern.split('-').map(Number)
        return value >= start && value <= end
      }
      return value === parseInt(pattern, 10)
    }

    const checkDate = new Date(nowUTC)
    checkDate.setUTCMinutes(checkDate.getUTCMinutes() + 1)
    checkDate.setUTCSeconds(0, 0)

    for (let i = 0; i < 525600; i++) {
      if (
        matches(checkDate.getUTCMinutes(), minute) &&
        matches(checkDate.getUTCHours(), hour) &&
        matches(checkDate.getUTCDate(), day) &&
        matches(checkDate.getUTCMonth() + 1, month) &&
        matches(checkDate.getUTCDay(), weekday)
      ) {
        return checkDate
      }
      checkDate.setUTCMinutes(checkDate.getUTCMinutes() + 1)
    }

    return null
  } catch {
    return null
  }
}

function getLastRunTime(schedule: string): Date | null {
  try {
    const nextRun = getNextRunTime(schedule)
    if (!nextRun) return null

    const parts = schedule.trim().split(/\s+/)
    if (parts.length !== 5) return null

    const [minute, hour, day, month, weekday] = parts

    const matches = (value: number, pattern: string): boolean => {
      if (pattern === '*') return true
      if (pattern.includes(',')) {
        return pattern.split(',').some((p) => matches(value, p.trim()))
      }
      if (pattern.includes('/')) {
        const [range, step] = pattern.split('/')
        const stepNum = parseInt(step, 10)
        if (range === '*') return value % stepNum === 0
        const [start] = range.split('-').map(Number)
        return value >= start && (value - start) % stepNum === 0
      }
      if (pattern.includes('-')) {
        const [start, end] = pattern.split('-').map(Number)
        return value >= start && value <= end
      }
      return value === parseInt(pattern, 10)
    }

    const checkDate = new Date(nextRun)
    checkDate.setUTCMinutes(checkDate.getUTCMinutes() - 1)
    checkDate.setUTCSeconds(0, 0)

    for (let i = 0; i < 525600; i++) {
      if (
        matches(checkDate.getUTCMinutes(), minute) &&
        matches(checkDate.getUTCHours(), hour) &&
        matches(checkDate.getUTCDate(), day) &&
        matches(checkDate.getUTCMonth() + 1, month) &&
        matches(checkDate.getUTCDay(), weekday)
      ) {
        return checkDate
      }
      checkDate.setUTCMinutes(checkDate.getUTCMinutes() - 1)
    }

    return null
  } catch {
    return null
  }
}

function formatRelativeTime(dateUTC: Date): string {
  const nowUTC = new Date()
  const diffMs = dateUTC.getTime() - nowUTC.getTime()
  const absDiffMs = Math.abs(diffMs)
  const diffSeconds = Math.floor(absDiffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'always' })
  const sign = diffMs < 0 ? -1 : 1

  if (diffDays >= 1) return rtf.format(sign * diffDays, 'day')
  if (diffHours >= 1) return rtf.format(sign * diffHours, 'hour')
  if (diffMinutes >= 1) return rtf.format(sign * diffMinutes, 'minute')
  return rtf.format(sign * diffSeconds, 'second')
}

export function JobsManagement() {
  const trpc = useTRPC()
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null)

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    listInput,
  } = useAdminTableState<'name'>({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
  })

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    error: jobsError,
  } = useQuery({
    ...trpc.jobs.list.queryOptions(listInput),
  })

  const triggerJobMutation = useMutation(trpc.jobs.trigger.mutationOptions())

  const rows = (jobsData?.data ?? []) as JobRow[]
  const paginationMeta = jobsData?.pagination
    ? {
        page: jobsData.pagination.page,
        limit: jobsData.pagination.limit,
        total: jobsData.pagination.total,
        totalPages: jobsData.pagination.totalPages,
      }
    : undefined

  const handleTriggerJob = useCallback(
    async (jobId: string) => {
      setTriggeringJobId(jobId)
      try {
        const result = await triggerJobMutation.mutateAsync({ jobId })
        if (result.success) {
          toast.success(
            `İş başarıyla tetiklendi: ${result.message || 'Tamamlandı'}`
          )
          if (result.duration) {
            toast.info(`Süre: ${result.duration}ms`)
          }
        } else {
          const base = result.message || 'Bilinmeyen hata'
          const data = result.data as
            | { backupResults?: Array<{ success?: boolean; error?: string }> }
            | undefined
          const firstErr = data?.backupResults?.find((r) => r.error)?.error
          toast.error(firstErr ? `${base} — ${firstErr}` : base)
        }
      } catch (error) {
        toast.error(
          `İş tetiklenirken hata: ${
            error instanceof Error ? error.message : 'Bilinmeyen hata'
          }`
        )
      } finally {
        setTriggeringJobId(null)
      }
    },
    [triggerJobMutation]
  )

  const columns: ColumnDef<JobRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'İsim',
        meta: { columnLabel: 'İsim' },
        cell: ({ row }) => {
          const job = row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{job.name}</span>
              {job.description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{job.description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'lastRun',
        header: 'Son Çalışma',
        enableSorting: false,
        meta: { columnLabel: 'Son çalışma', disableColumnFilter: true },
        cell: ({ row }) => {
          const lastRun = row.original.schedule
            ? getLastRunTime(row.original.schedule)
            : null
          if (!lastRun) return '—'
          return (
            <div className="space-y-1 text-sm">
              <div>{formatRelativeTime(lastRun)}</div>
              <div className="text-muted-foreground text-xs">
                {lastRun.toLocaleString('tr-TR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'Europe/Istanbul',
                })}
              </div>
            </div>
          )
        },
      },
      {
        id: 'schedule',
        header: 'Zamanlama (UTC)',
        enableSorting: false,
        meta: { columnLabel: 'Zamanlama', disableColumnFilter: true },
        cell: ({ row }) => {
          const job = row.original
          const cronDescription = job.schedule
            ? getCronDescription(job.schedule)
            : 'Yalnızca manuel tetikleme'
          return (
            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground font-mono text-xs">
                {job.schedule ?? '—'}
              </div>
              <div>{cronDescription}</div>
            </div>
          )
        },
      },
      {
        id: 'nextRun',
        header: 'Bir Sonraki Çalışma',
        enableSorting: false,
        meta: {
          columnLabel: 'Sonraki çalışma',
          disableColumnFilter: true,
        },
        cell: ({ row }) => {
          const nextRun = row.original.schedule
            ? getNextRunTime(row.original.schedule)
            : null
          if (!nextRun || !row.original.schedule) return '—'
          return (
            <div className="space-y-1 text-sm">
              <div>{formatRelativeTime(nextRun)}</div>
              <div className="text-muted-foreground text-xs">
                {nextRun.toLocaleString('tr-TR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'Europe/Istanbul',
                })}
              </div>
            </div>
          )
        },
      },
      createIconActionColumn<JobRow>((row) => [
        {
          icon: Play,
          label: 'Tetikle',
          disabled:
            triggeringJobId === row.original.id || triggerJobMutation.isPending,
          onClick: () => void handleTriggerJob(row.original.id),
        },
      ]),
    ],
    [triggeringJobId, triggerJobMutation.isPending, handleTriggerJob]
  )

  if (isLoadingJobs) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (jobsError) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">
          {jobsError?.message || 'Bir hata oluştu'}
        </p>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoadingJobs}
      globalFilter={search}
      onGlobalFilterChange={handleSearchChange}
      searchPlaceholder="İş adı veya açıklama ara..."
      pagination={paginationMeta}
      onPaginationChange={handlePaginationChange}
      sorting={sorting}
      onSortingChange={setSorting}
      getRowId={(row) => row.id}
      autoHideEmptyColumns={false}
    />
  )
}
