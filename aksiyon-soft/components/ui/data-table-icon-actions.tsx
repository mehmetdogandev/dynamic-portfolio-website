'use client'

import type { LucideIcon } from 'lucide-react'
import type { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type TableIconAction = {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
  hidden?: boolean
}

export const ACTIONS_COLUMN_ID = 'actions'

const NON_FILTERABLE_COLUMN_IDS = new Set([
  ACTIONS_COLUMN_ID,
  'select',
  'sort',
  'drag',
  'duration',
  'departure',
  'arrival',
])

export function isNonFilterableColumnId(columnId: string): boolean {
  return NON_FILTERABLE_COLUMN_IDS.has(columnId)
}

export function createIconActionColumn<TData>(
  getActions: (row: Row<TData>) => TableIconAction[]
) {
  return {
    id: ACTIONS_COLUMN_ID,
    header: () => 'İşlemler',
    cell: ({ row }: { row: Row<TData> }) => {
      const actions = getActions(row).filter((action) => !action.hidden)
      if (actions.length === 0) return null

      return (
        <div className="flex items-center justify-end gap-0.5">
          {actions.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    action.variant === 'destructive' &&
                      'text-destructive hover:text-destructive'
                  )}
                  disabled={action.disabled}
                  onClick={(event) => {
                    event.stopPropagation()
                    action.onClick()
                  }}
                  aria-label={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      disableColumnFilter: true,
      columnLabel: 'İşlemler',
    },
  }
}
