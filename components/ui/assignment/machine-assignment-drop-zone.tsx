'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DraggableAssignedBadge } from './draggable-assigned-badge'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export interface AssignedItem {
  id: string
  label: string
  quantity: number
  unit?: string
  data?: Record<string, unknown>
}

const COLOR_PALETTE = [
  {
    bg: 'bg-slate-100 dark:bg-slate-900/40',
    border: 'border-slate-300 dark:border-slate-600',
  },
  {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    border: 'border-blue-300 dark:border-blue-700',
  },
  {
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700',
  },
  {
    bg: 'bg-violet-100 dark:bg-violet-950/40',
    border: 'border-violet-300 dark:border-violet-700',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-700',
  },
] as const

export interface MachineAssignmentDropZoneProps {
  id: string
  label: string
  assignedItems?: AssignedItem[]
  colorIndex?: number
  className?: string
  /** Extra data for drop handler */
  data?: Record<string, unknown>
  /** When false, assigned items are static (no drag to move). Default true. */
  enableAssignedDrag?: boolean
  onItemInfoClick?: (item: AssignedItem) => void
}

export function MachineAssignmentDropZone({
  id,
  label,
  assignedItems = [],
  colorIndex = 0,
  className,
  data,
  enableAssignedDrag = true,
  onItemInfoClick,
}: MachineAssignmentDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'dropzone',
      ...data,
    },
  })

  const colors = COLOR_PALETTE[Math.min(colorIndex, 5)]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-70 flex-col rounded-xl border-2 border-dashed p-4 transition-all duration-200',
        colors.bg,
        colors.border,
        isOver &&
          'ring-2 ring-primary/40 scale-[1.01] border-primary bg-primary/10',
        !isOver && 'hover:opacity-90',
        className
      )}
    >
      <div className="mb-2 shrink-0">
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto min-h-0">
        {assignedItems.length === 0 ? (
          <span className="text-xs text-muted-foreground self-center">
            Sürükleyip bırakın
          </span>
        ) : (
          assignedItems.map((item, index) => (
            <div key={`${item.id}-${id}-${index}`} className="shrink-0">
              {enableAssignedDrag ? (
                <DraggableAssignedBadge
                  id={item.id}
                  label={item.label}
                  quantity={item.quantity}
                  unit={item.unit}
                  sourceZoneId={id}
                  size="large"
                  fullWidth
                  rightSlot={
                    onItemInfoClick ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onItemInfoClick(item)
                        }}
                        aria-label="Kalem detayı"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <Badge variant="secondary" className="text-xs font-medium">
                  {item.label}:{' '}
                  {item.quantity.toLocaleString('tr-TR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  })}{' '}
                  {item.unit ?? 'kg'}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
