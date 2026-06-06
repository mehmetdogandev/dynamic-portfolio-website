'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Building2, MapPin, Users, Briefcase } from 'lucide-react'

export interface EntityOption {
  id: string
  name: string
  description?: string
  type: 'organization' | 'location' | 'department' | 'group'
}

interface EntitySelectorProps {
  type: 'organization' | 'location' | 'department' | 'group'
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  availableEntities?: EntityOption[]
  placeholder?: string
  label?: string
}

const TYPE_CONFIG = {
  organization: {
    icon: Building2,
    label: 'Organizasyonlar',
    placeholder: 'Organizasyon ara...',
  },
  location: {
    icon: MapPin,
    label: 'Lokasyonlar',
    placeholder: 'Lokasyon ara...',
  },
  department: {
    icon: Briefcase,
    label: 'Departmanlar',
    placeholder: 'Departman ara...',
  },
  group: {
    icon: Users,
    label: 'Gruplar',
    placeholder: 'Grup ara...',
  },
}

export function EntitySelector({
  type,
  selectedIds,
  onSelectionChange,
  availableEntities = [],
  placeholder,
  label,
}: EntitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const config = TYPE_CONFIG[type]
  if (!config) {
    return null
  }
  const Icon = config.icon

  const filteredEntities = availableEntities.filter((entity) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleEntity = (entityId: string) => {
    let newIds: string[]
    if (selectedIds.includes(entityId)) {
      newIds = selectedIds.filter((id) => id !== entityId)
    } else {
      newIds = [...selectedIds, entityId]
    }
    onSelectionChange(newIds)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label || config.label}</span>
            <Badge variant="outline" className="text-xs">
              {selectedIds.length} seçildi
            </Badge>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder || config.placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredEntities.map((entity) => {
            const isSelected = selectedIds.includes(entity.id)
            return (
              <div
                key={entity.id}
                className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleEntity(entity.id)}
              >
                <div className="flex-1">
                  <span className="font-medium text-sm">{entity.name}</span>
                </div>

                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}

          {filteredEntities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Hiçbir sonuç bulunamadı
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
