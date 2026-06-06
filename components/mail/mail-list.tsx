'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Mail, Paperclip, PenLine, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function getInitials(fromName?: string, from?: string): string {
  if (fromName && fromName.trim()) {
    const parts = fromName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return fromName.slice(0, 2).toUpperCase()
  }
  if (from) {
    const local = from.split('@')[0]
    return local ? local.slice(0, 2).toUpperCase() : '??'
  }
  return '??'
}

export interface MailListItem {
  id: string
  subject: string
  from: string
  fromName?: string
  to: string[]
  date: Date
  isRead: boolean
  isStarred?: boolean
  hasAttachments?: boolean
  preview?: string
}

interface MailListProps {
  items: MailListItem[]
  selectedId?: string
  onSelect: (id: string) => void
  onMarkAsRead?: (id: string) => void
  isLoading?: boolean
  isDraftFolder?: boolean
  emptyMessage?: string
  emptySubtitle?: string
  onDelete?: (id: string) => void
}

export function MailList({
  items,
  selectedId,
  onSelect,
  onMarkAsRead,
  isLoading,
  isDraftFolder,
  emptyMessage,
  emptySubtitle,
  onDelete,
}: MailListProps) {
  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse"
            >
              <div className="size-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex justify-between gap-2">
                  <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-14 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                </div>
                <div className="h-4 w-[85%] rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-12 text-center max-w-sm">
          <Mail className="h-16 w-16 mx-auto mb-6 text-slate-400 dark:text-slate-500 opacity-50" />
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {emptyMessage ?? 'E-posta bulunamadı'}
          </p>
          <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
            {emptySubtitle ??
              (isDraftFolder
                ? 'Taslak kaydettiğiniz e-postalar burada listelenecektir.'
                : 'Gönderilen e-postalar burada listelenecektir.')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'relative flex items-start gap-4 w-full text-left p-4 rounded-lg border transition-all duration-200',
              'hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700',
              selectedId === item.id
                ? 'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
            )}
          >
            {onDelete && (
              <button
                type="button"
                className="absolute right-3 top-4 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item.id)
                }}
                title={isDraftFolder ? 'Taslağı sil' : 'Sil'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="flex-1 min-w-0 text-left -m-4 p-4"
              onClick={() => {
                onSelect(item.id)
                if (!item.isRead && onMarkAsRead) {
                  onMarkAsRead(item.id)
                }
              }}
            >
              <div className="flex items-start gap-4 pr-10">
                <div className="relative shrink-0">
                  <Avatar className="size-10">
                    <AvatarFallback
                      className={cn(
                        'text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {getInitials(item.fromName, item.from)}
                    </AvatarFallback>
                  </Avatar>
                  {!item.isRead && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rounded-full bg-blue-500"
                      aria-hidden
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          'text-sm truncate',
                          !item.isRead
                            ? 'font-semibold text-slate-900 dark:text-slate-100'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {item.fromName || item.from}
                      </span>
                      {item.hasAttachments && (
                        <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {format(item.date, 'd MMM', { locale: tr })}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'text-sm truncate',
                      !item.isRead
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'font-normal text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {item.subject}
                  </div>

                  {item.preview && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.preview}
                    </div>
                  )}
                  {isDraftFolder && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <PenLine className="h-3 w-3 shrink-0" />
                      <span>Devam Et</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
