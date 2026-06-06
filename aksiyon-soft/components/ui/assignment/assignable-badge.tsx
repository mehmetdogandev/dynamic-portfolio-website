'use client'

import type React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export interface AssignableBadgeProps {
  id: string
  label: string
  remaining: number
  unit?: string
  deadline?: Date | string | null
  productCode?: string | null
  disabled?: boolean
  /** Extra data to pass to drop handler */
  data?: Record<string, unknown>
  /** Optional content rendered inside the badge on the right (e.g. History button). Pointer events are stopped so dragging does not start when interacting with this slot. */
  rightSlot?: React.ReactNode
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function AssignableBadge({
  id,
  label,
  remaining,
  unit = 'kg',
  deadline,
  productCode,
  disabled = false,
  data,
  rightSlot,
}: AssignableBadgeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      type: 'assignable',
      ...data,
    },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...(!disabled ? { ...attributes, ...listeners } : {})}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-2 shadow-sm transition-all duration-150 touch-none',
        'bg-card border-border',
        disabled && 'cursor-not-allowed opacity-50 bg-muted/50',
        !disabled && 'cursor-grab active:cursor-grabbing hover:shadow-md',
        isDragging && 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1 font-bold text-xs flex-wrap">
          {productCode ?? label}{' '}
          <div className="text-xs  space-x-2">
            {productCode &&
              label !== productCode &&
              (() => {
                const withoutCode = label
                  .replace(
                    new RegExp(
                      `^${productCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
                      'i'
                    ),
                    ''
                  )
                  .trim()
                return withoutCode ? (
                  <span className="truncate">{withoutCode}</span>
                ) : null
              })()}
            {deadline && <span> {formatDate(deadline)}</span>}
          </div>
        </div>
        <span
          className={cn(
            'text-xs  tabular-nums',
            disabled ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {remaining.toLocaleString('tr-TR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          {unit}
        </span>
      </div>
      {rightSlot != null && (
        <span className="shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {rightSlot}
        </span>
      )}
    </div>
  )
}
