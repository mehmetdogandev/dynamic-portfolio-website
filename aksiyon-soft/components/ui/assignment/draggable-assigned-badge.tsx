'use client'

import type React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export interface DraggableAssignedBadgeProps {
  id: string
  label: string
  quantity: number
  unit?: string
  sourceZoneId: string
  disabled?: boolean
  size?: 'default' | 'large'
  fullWidth?: boolean
  rightSlot?: React.ReactNode
}

export function DraggableAssignedBadge({
  id,
  label,
  quantity,
  unit = 'kg',
  sourceZoneId,
  disabled = false,
  size = 'default',
  fullWidth = false,
  rightSlot,
}: DraggableAssignedBadgeProps) {
  const draggableId = `assigned::${id}::${sourceZoneId}`

  const {
    attributes,
    listeners,
    setNodeRef,
    transform: _transform,
    isDragging,
  } = useDraggable({
    id: draggableId,
    data: {
      type: 'assigned',
      itemId: id,
      sourceZoneId,
      quantity,
      label,
      unit,
    },
    disabled: disabled || quantity <= 0,
  })

  const isDraggable = !disabled && quantity > 0

  const isLarge = size === 'large'

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border shadow-sm transition-all duration-150 touch-none',
        'bg-secondary/50 border-border',
        fullWidth ? 'w-full justify-between' : 'w-50',
        isLarge ? 'px-3 py-2.5 text-xs' : 'px-2 py-1 text-sm',
        !isDraggable && 'cursor-not-allowed opacity-50',
        isDraggable &&
          'cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02]',
        isDragging && 'opacity-0 pointer-events-none'
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>

      <span
        className={cn(
          'tabular-nums font-semibold whitespace-nowrap shrink-0',
          isLarge ? 'text-xs' : 'text-xs'
        )}
      >
        {quantity.toLocaleString('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}{' '}
        {unit}
      </span>
      {rightSlot != null && (
        <span className="shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {rightSlot}
        </span>
      )}
    </div>
  )
}
