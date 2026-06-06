'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { Label } from '@/components/ui/label'
import { Search, Shield, X, Plus, Check, ChevronsUpDown } from 'lucide-react'

export interface RoleOption {
  id: string
  name: string
  scope: string
  description?: string
}

interface RoleSelectorProps {
  selectedRoleIds: string[]
  onSelectionChange: (roleIds: string[]) => void
  availableRoles: RoleOption[]
  placeholder?: string
  label?: string
  description?: string
  alwaysOpen?: boolean
}

export function RoleSelector({
  selectedRoleIds,
  onSelectionChange,
  availableRoles,
  placeholder = 'Rol ara...',
  label = 'Roller',
  description,
  alwaysOpen = false,
}: RoleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedRoles = useMemo(() => {
    return availableRoles.filter((role) => selectedRoleIds.includes(role.id))
  }, [availableRoles, selectedRoleIds])

  const filteredRoles = useMemo(() => {
    return availableRoles.filter(
      (role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.scope.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableRoles, searchTerm])

  const hasSearchTerm = searchTerm.trim().length > 0

  const toggleRole = (roleId: string) => {
    let newIds: string[]
    if (selectedRoleIds.includes(roleId)) {
      newIds = selectedRoleIds.filter((id) => id !== roleId)
    } else {
      newIds = [...selectedRoleIds, roleId]
    }
    onSelectionChange(newIds)
  }

  const removeRole = (roleId: string) => {
    const newIds = selectedRoleIds.filter((id) => id !== roleId)
    onSelectionChange(newIds)
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  const selectAll = () => {
    const sourceRoles = hasSearchTerm ? filteredRoles : availableRoles
    const allIds = sourceRoles.map((role) => role.id)
    onSelectionChange(allIds)
  }

  // Always open mode - simpler, more usable UI
  if (alwaysOpen) {
    return (
      <div className="space-y-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex space-x-1 sm:space-x-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={availableRoles.length === 0}
              className="h-7 px-1.5 sm:h-9 sm:px-3 text-[10px] sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              {hasSearchTerm ? (
                <span className="hidden sm:inline">
                  &quot;{searchTerm}&quot;
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Tümü</span>
                  <span className="sm:hidden">Tümü</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedRoleIds.length === 0}
              className="h-7 px-1.5 sm:h-9 sm:px-3 text-[10px] sm:text-sm"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Temizle</span>
              <span className="sm:hidden">Temizle</span>
            </Button>
          </div>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Selected Roles Summary */}
        {selectedRoles.length > 0 && (
          <div className="flex flex-wrap gap-1 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            {selectedRoles.map((role) => (
              <Badge
                key={role.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">{role.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeRole(role.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Scrollable Role List - Always Visible */}
        <div className="border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>Hiçbir rol bulunamadı.</p>
              </div>
            ) : (
              filteredRoles.map((role, index) => {
                const isSelected = selectedRoleIds.includes(role.id)
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${index !== filteredRoles.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {role.name}
                      </div>
                      <div
                        className={`text-xs ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {role.scope}
                        {role.description && ` • ${role.description}`}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  // Original dropdown mode
  return (
    <div className="space-y-4">
      {/* Label and Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <Label className="font-medium text-xs sm:text-sm truncate">
            {label}
          </Label>
          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
            {selectedRoleIds.length} seçildi
          </Badge>
        </div>

        <div className="flex space-x-1 sm:space-x-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={availableRoles.length === 0}
            className="h-7 px-1.5 sm:h-9 sm:px-3 text-[10px] sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
            {hasSearchTerm ? (
              <span className="hidden sm:inline">&quot;{searchTerm}&quot;</span>
            ) : (
              <>
                <span className="hidden sm:inline">Tümü</span>
                <span className="sm:hidden">Tümü</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={selectedRoleIds.length === 0}
            className="h-7 px-1.5 sm:h-9 sm:px-3 text-[10px] sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">Temizle</span>
            <span className="sm:hidden">Temizle</span>
          </Button>
        </div>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Selected Roles */}
      {selectedRoles.length > 0 && (
        <Card>
          <CardHeader className="">
            <h4 className="text-sm font-medium text-primary">
              Seçili Roller ({selectedRoles.length})
            </h4>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {selectedRoles.map((role) => (
                <Badge
                  key={role.id}
                  variant="secondary"
                  className="flex items-center space-x-1 pr-0.5"
                >
                  <Shield className="h-3 w-3" />
                  <span className="text-[10px]">{role.name}</span>
                  <span className="text-[10px] opacity-70">({role.scope})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeRole(role.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Selector Dropdown */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>{placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <div
              className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-xl border-gray-200 dark:border-gray-700"
              style={{ maxHeight: '500px' }}
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Scrollable Role List */}
              <div
                className="overflow-y-auto"
                style={{
                  maxHeight: '440px',
                }}
              >
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    Hiçbir rol bulunamadı.
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = selectedRoleIds.includes(role.id)
                    return (
                      <div
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : ''}`}
                        style={{
                          borderBottom:
                            filteredRoles.indexOf(role) ===
                            filteredRoles.length - 1
                              ? 'none'
                              : '1px solid #f3f4f6',
                        }}
                      >
                        {/* Custom Checkbox Visual */}
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium text-xs ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}
                          >
                            {role.name}
                          </div>
                          <div
                            className={`text-[11px] ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {role.scope}
                            {role.description && ` • ${role.description}`}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
