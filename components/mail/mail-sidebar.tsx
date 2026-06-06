'use client'

import { Button } from '@/components/ui/button'
import { Send, FileText, Trash2, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export type MailFolder = 'sent' | 'drafts' | 'trash'

interface MailSidebarProps {
  activeFolder: MailFolder
  onFolderChange: (folder: MailFolder) => void
  onNewMail: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function MailSidebar({
  activeFolder,
  onFolderChange,
  onNewMail,
  searchQuery,
  onSearchChange,
}: MailSidebarProps) {
  const folders: { id: MailFolder; label: string; icon: typeof Send }[] = [
    { id: 'sent', label: 'Gönderilenler', icon: Send },
    { id: 'drafts', label: 'Taslaklar', icon: FileText },
    { id: 'trash', label: 'Silinenler', icon: Trash2 },
  ]

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95">
      {/* New Mail Button */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <Button onClick={onNewMail} className="w-full gap-2" size="lg">
          <Plus className="h-4 w-4" />
          Yeni E-posta
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="E-posta ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Folders */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {folders.map((folder) => {
            const Icon = folder.icon
            return (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeFolder === folder.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {folder.label}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
