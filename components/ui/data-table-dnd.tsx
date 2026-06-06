'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ReactNode } from 'react'

export type DataTableDndStrategy = 'vertical' | 'horizontal'

export interface DataTableDndConfig {
  items: string[]
  strategy?: DataTableDndStrategy
  onDragEnd: (event: DragEndEvent) => void
  disabled?: boolean
  activationDistance?: number
}

export interface DataTableDndProps extends DataTableDndConfig {
  children: ReactNode
}

export function DataTableDnd({
  items,
  strategy = 'vertical',
  onDragEnd,
  disabled = false,
  children,
  activationDistance = 6,
}: DataTableDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: activationDistance },
    })
  )

  if (disabled) {
    return <>{children}</>
  }

  const sortingStrategy =
    strategy === 'horizontal'
      ? horizontalListSortingStrategy
      : verticalListSortingStrategy

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={sortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
