'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DraggableAssignedBadge } from './draggable-assigned-badge'

export interface AssignedItem {
  id: string
  label: string
  quantity: number
  unit?: string
}

export interface AssignmentDropZoneProps {
  id: string
  label: string
  assignedItems?: AssignedItem[]
  className?: string
  /** Extra data for drop handler */
  data?: Record<string, unknown>
  /** When false, assigned items are static (no drag to move). Default true. */
  enableAssignedDrag?: boolean
}

export function AssignmentDropZone({
  id,
  label,
  assignedItems = [],
  className,
  data,
  enableAssignedDrag = true,
}: AssignmentDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'dropzone',
      ...data,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[120px] flex-col rounded-xl border-2 border-dashed p-4 transition-all duration-200',
        'bg-muted/20 border-muted-foreground/25',
        isOver &&
          'border-primary bg-primary/10 ring-2 ring-primary/40 scale-[1.01]',
        !isOver && 'hover:border-muted-foreground/40 hover:bg-muted/30',
        className
      )}
    >
      <div className="mb-2 shrink-0">
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex flex-1 flex-wrap gap-2 content-start overflow-auto">
        {assignedItems.length === 0 ? (
          <span className="text-xs text-muted-foreground self-center">
            Sürükleyip bırakın
          </span>
        ) : (
          assignedItems.map((item) =>
            enableAssignedDrag ? (
              <DraggableAssignedBadge
                key={`${item.id}-${id}`}
                id={item.id}
                label={item.label}
                quantity={item.quantity}
                unit={item.unit}
                sourceZoneId={id}
              />
            ) : (
              <Badge
                key={`${item.id}-${id}`}
                variant="secondary"
                className="text-xs font-medium"
              >
                {item.label}:{' '}
                {item.quantity.toLocaleString('tr-TR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                {item.unit ?? 'kg'}
              </Badge>
            )
          )
        )}
      </div>
    </div>
  )
}
