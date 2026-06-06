'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserPlus, Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type RoleAssignmentData, roleAssignmentSchema } from './types'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  organizationName?: string
  locationName?: string
}

interface RoleGroup {
  id: string
  title: string
  description?: string
  roleCount: number
}

interface RoleAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (data: RoleAssignmentData) => Promise<void>
  availableUsers: User[]
  availableRoleGroups: RoleGroup[]
  existingAssignments?: Array<{
    userId: string
    roleGroupId: string
    userName: string
    roleGroupTitle: string
  }>
  isLoading?: boolean
}

export function RoleAssignmentDialog({
  open,
  onOpenChange,
  onAssign,
  availableUsers,
  availableRoleGroups,
  existingAssignments = [],
}: RoleAssignmentDialogProps) {
  const [searchTerm, _setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<RoleGroup | null>(
    null
  )
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [roleGroupSearchOpen, setRoleGroupSearchOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<RoleAssignmentData>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: '',
      roleGroupId: '',
    },
  })

  // Filter users based on search
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter role groups
  const filteredRoleGroups = availableRoleGroups.filter(
    (group) =>
      group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get assignments for selected user
  const getUserAssignments = (userId: string) => {
    return existingAssignments.filter(
      (assignment) => assignment.userId === userId
    )
  }

  // Check if user already has this role group
  const hasRoleGroup = (userId: string, roleGroupId: string) => {
    return existingAssignments.some(
      (assignment) =>
        assignment.userId === userId && assignment.roleGroupId === roleGroupId
    )
  }

  const handleAssign = async () => {
    if (!selectedUser || !selectedRoleGroup) return

    // Check if assignment already exists
    if (hasRoleGroup(selectedUser.id, selectedRoleGroup.id)) {
      alert('Bu kullanıcı zaten bu rol grubuna sahip!')
      return
    }

    setSubmitting(true)
    try {
      await onAssign({
        userId: selectedUser.id,
        roleGroupId: selectedRoleGroup.id,
      })

      // Reset form
      setSelectedUser(null)
      setSelectedRoleGroup(null)
      form.reset()
    } catch (_error) {
    } finally {
      setSubmitting(false)
    }
  }

  const clearSelection = () => {
    setSelectedUser(null)
    setSelectedRoleGroup(null)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-lg sm:text-xl">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Rol Ataması</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-center">
            Kullanıcıları rol gruplarına atayın. Her kullanıcı birden fazla rol
            grubuna sahip olabilir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* User Selection */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-lg font-medium">
                    Kullanıcı Seçimi
                  </h3>
                  {selectedUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      disabled={submitting}
                      className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Temizle
                    </Button>
                  )}
                </div>

                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                      disabled={submitting}
                    >
                      {selectedUser ? (
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {selectedUser.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{selectedUser.name}</span>
                          <span className="text-muted-foreground">
                            ({selectedUser.email})
                          </span>
                        </div>
                      ) : (
                        'Kullanıcı seçin...'
                      )}
                      <ChevronsUpDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Kullanıcı ara..."
                        className="h-8 sm:h-10 text-xs sm:text-sm"
                      />
                      <CommandEmpty className="text-xs sm:text-sm">
                        Kullanıcı bulunamadı.
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => {
                              setSelectedUser(user)
                              setUserSearchOpen(false)
                            }}
                            className="text-xs sm:text-sm py-1.5 sm:py-2"
                          >
                            <Check
                              className={cn(
                                'mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4',
                                selectedUser?.id === user.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {user.name}
                                </div>
                                <div className="text-[10px] sm:text-sm text-muted-foreground truncate">
                                  {user.email}
                                </div>
                                {user.organizationName && (
                                  <div className="text-[9px] sm:text-xs text-muted-foreground truncate">
                                    {user.organizationName}
                                    {user.locationName &&
                                      ` - ${user.locationName}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Show current assignments for selected user */}
                {selectedUser && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs sm:text-sm font-medium">
                      Mevcut Rol Grupları:
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {getUserAssignments(selectedUser.id).map((assignment) => (
                        <Badge
                          key={assignment.roleGroupId}
                          variant="secondary"
                          className="text-[10px] sm:text-xs"
                        >
                          {assignment.roleGroupTitle}
                        </Badge>
                      ))}
                      {getUserAssignments(selectedUser.id).length === 0 && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Henüz rol ataması yok
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Group Selection */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-sm sm:text-lg font-medium">
                  Rol Grubu Seçimi
                </h3>

                <Popover
                  open={roleGroupSearchOpen}
                  onOpenChange={setRoleGroupSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleGroupSearchOpen}
                      className="w-full justify-between h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                      disabled={submitting || !selectedUser}
                    >
                      {selectedRoleGroup ? (
                        <div className="flex items-center space-x-2">
                          <span>{selectedRoleGroup.title}</span>
                          <Badge variant="outline">
                            {selectedRoleGroup.roleCount} rol
                          </Badge>
                        </div>
                      ) : (
                        'Rol grubu seçin...'
                      )}
                      <ChevronsUpDown className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Rol grubu ara..."
                        className="h-8 sm:h-10 text-xs sm:text-sm"
                      />
                      <CommandEmpty className="text-xs sm:text-sm">
                        Rol grubu bulunamadı.
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredRoleGroups.map((roleGroup) => (
                          <CommandItem
                            key={roleGroup.id}
                            value={roleGroup.title}
                            onSelect={() => {
                              setSelectedRoleGroup(roleGroup)
                              setRoleGroupSearchOpen(false)
                            }}
                            disabled={
                              selectedUser
                                ? hasRoleGroup(selectedUser.id, roleGroup.id)
                                : false
                            }
                            className="text-xs sm:text-sm py-1.5 sm:py-2"
                          >
                            <Check
                              className={cn(
                                'mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4',
                                selectedRoleGroup?.id === roleGroup.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs sm:text-sm truncate">
                                {roleGroup.title}
                              </div>
                              {roleGroup.description && (
                                <div className="text-[10px] sm:text-sm text-muted-foreground truncate">
                                  {roleGroup.description}
                                </div>
                              )}
                              <div className="text-[9px] sm:text-xs text-muted-foreground">
                                {roleGroup.roleCount} rol içeriyor
                              </div>
                            </div>
                            {selectedUser &&
                              hasRoleGroup(selectedUser.id, roleGroup.id) && (
                                <Badge
                                  variant="secondary"
                                  className="ml-1.5 sm:ml-2 text-[9px] sm:text-xs"
                                >
                                  Zaten atanmış
                                </Badge>
                              )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedRoleGroup && (
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      {selectedRoleGroup.title}
                    </h4>
                    {selectedRoleGroup.description && (
                      <p className="text-[10px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                        {selectedRoleGroup.description}
                      </p>
                    )}
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {selectedRoleGroup.roleCount} rol içeriyor
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Summary */}
          {selectedUser && selectedRoleGroup && (
            <Card>
              <CardContent className="pt-3 sm:pt-6 p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-lg font-medium">
                    Atama Özeti
                  </h3>
                  <div className="flex items-center justify-between p-2 sm:p-4 bg-blue-50 rounded-lg gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm shrink-0">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm truncate">
                          {selectedUser.name}
                        </div>
                        <div className="text-[10px] sm:text-sm text-muted-foreground truncate">
                          {selectedUser.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl shrink-0">→</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {selectedRoleGroup.title}
                      </div>
                      <div className="text-[10px] sm:text-sm text-muted-foreground">
                        {selectedRoleGroup.roleCount} rol
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-9 px-4 text-xs sm:h-10 sm:px-6 sm:text-sm"
            >
              İptal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUser || !selectedRoleGroup || submitting}
              className="h-9 px-4 text-xs sm:h-10 sm:px-6 sm:text-sm"
            >
              {submitting && (
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              )}
              Rolü Ata
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
