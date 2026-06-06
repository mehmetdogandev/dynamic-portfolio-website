'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Search, User, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface UserOption {
  id: string
  name: string
  lastName: string
  email: string
  isManual?: boolean // Flag to distinguish manual emails from system users
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface UserPickerProps {
  value: UserOption[]
  onChange: (users: UserOption[]) => void
  placeholder?: string
  multiple?: boolean
}

export function UserPicker({
  value,
  onChange,
  placeholder = 'Kullanıcı seçin...',
  multiple = true,
}: UserPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEmailInput, setManualEmailInput] = useState('')
  const trpc = useTRPC()

  const { data: users = [], isLoading } = useQuery({
    ...trpc.mail.getUsers.queryOptions({
      search: searchQuery || undefined,
      limit: 50,
    }),
    enabled: open,
  })

  const handleSelect = (user: UserOption) => {
    if (multiple) {
      if (value.some((u) => u.id === user.id)) {
        // Remove if already selected
        onChange(value.filter((u) => u.id !== user.id))
      } else {
        // Add to selection
        onChange([...value, user])
      }
    } else {
      onChange([user])
      setOpen(false)
    }
  }

  const handleRemove = (userId: string) => {
    onChange(value.filter((u) => u.id !== userId))
  }

  const selectedIds = new Set(value.map((u) => u.id))

  return (
    <div className="space-y-2">
      {/* Selected users */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((user) => (
            <Badge
              key={user.id}
              variant={user.isManual ? 'outline' : 'secondary'}
              className="flex items-center gap-1 pr-1"
            >
              {user.isManual ? (
                <Mail className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {user.isManual ? user.email : `${user.name} ${user.lastName}`}
              {multiple && (
                <button
                  onClick={() => handleRemove(user.id)}
                  className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <Search className="h-4 w-4 mr-2" />
            {value.length === 0
              ? placeholder
              : `${value.length} kullanıcı seçildi`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="E-posta gir ve Enter'a bas..."
                value={manualEmailInput}
                onChange={(e) => setManualEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const email = manualEmailInput.trim()
                    if (email && isValidEmail(email)) {
                      if (
                        !value.some(
                          (u) => u.email.toLowerCase() === email.toLowerCase()
                        )
                      ) {
                        const manualUser: UserOption = {
                          id: `manual-${email}`,
                          name: email.split('@')[0] || email,
                          lastName: '',
                          email: email,
                          isManual: true,
                        }
                        onChange([...value, manualUser])
                        setManualEmailInput('')
                      }
                    }
                  }
                }}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Yükleniyor...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Kullanıcı bulunamadı
              </div>
            ) : (
              <div className="p-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                      selectedIds.has(user.id) &&
                        'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.name} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                      {selectedIds.has(user.id) && (
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}
