'use client'

import {
  pointerWithin,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type Modifier,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AssignableBadge } from './assignable-badge'
import { DraggableAssignedBadge } from './draggable-assigned-badge'
import { AssignQuantityModal } from './assign-quantity-modal'
import { useState, useCallback } from 'react'

const snapCenterToCursor: Modifier = ({ transform, activeNodeRect }) => {
  if (!activeNodeRect) return transform

  return {
    ...transform,
    x: transform.x - activeNodeRect.width / 2,
    y: transform.y - activeNodeRect.height / 2,
  }
}

export interface AssignableItem {
  id: string
  label: string
  remaining: number
  unit?: string
  deadline?: Date | string | null
  productCode?: string | null
  data?: Record<string, unknown>
}

export interface DropZoneTarget {
  id: string
  label: string
  data?: Record<string, unknown>
  /** For machine allocation: color index 0–5 */
  colorIndex?: number
}

export interface PendingAssignPayload {
  sourceId: string
  targetId: string
  sourceLabel: string
  targetLabel: string
  maxQuantity: number
  unit?: string
  sourceData?: Record<string, unknown>
  targetData?: Record<string, unknown>
  /** Taşıma durumunda: kaynak zone id */
  sourceZoneId?: string
}

export interface AssignmentBoardProps {
  /** Assignable items (badges) shown at top */
  assignableItems: AssignableItem[]
  /** Assignable items section title (default: "Atanacak Kalemler", null = hide title) */
  assignableItemsTitle?: string | null
  /** Drop zone targets (boxes) shown at bottom */
  dropZones: DropZoneTarget[]
  /** Render drop zone - receives target + assigned items */
  renderDropZone: (
    target: DropZoneTarget,
    assignedItems: {
      id: string
      label: string
      quantity: number
      unit?: string
      data?: Record<string, unknown>
    }[]
  ) => React.ReactNode
  /** Layout: default = badges top, grid below; sidebar = left badges, right drop zones */
  layout?: 'default' | 'sidebar'
  /** Drop zones section title (default: "Makineler" for sidebar, "Atama Hedefleri" for default) */
  dropZonesTitle?: string
  /** Map: dropZoneId -> assigned items for that zone */
  assignedByZone: Record<
    string,
    {
      id: string
      label: string
      quantity: number
      unit?: string
      data?: Record<string, unknown>
    }[]
  >
  /** Called when user confirms quantity in modal */
  onAssign: (
    payload: PendingAssignPayload,
    quantity: number
  ) => void | Promise<void>
  /** Loading state for assign */
  isAssignPending?: boolean
  /** Optional: custom badge ids that are draggable (default: assignableItems.map(i => i.id)) */
  draggableIds?: string[]
  /** Optional: render extra content (e.g. History button) next to each assignable item */
  renderAssignableItemExtra?: (item: AssignableItem) => React.ReactNode
}

export function AssignmentBoard({
  assignableItems,
  assignableItemsTitle,
  dropZones,
  renderDropZone,
  assignedByZone,
  onAssign,
  isAssignPending = false,
  layout = 'default',
  dropZonesTitle,
  renderAssignableItemExtra,
}: AssignmentBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingAssign, setPendingAssign] =
    useState<PendingAssignPayload | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return
      const targetId = String(over.id)
      const target = dropZones.find((z) => z.id === targetId)
      if (!target) return

      const data = active.data.current as
        | {
            type?: string
            itemId?: string
            sourceZoneId?: string
            quantity?: number
            label?: string
            unit?: string
          }
        | undefined

      if (data?.type === 'assigned') {
        const { itemId, sourceZoneId, quantity, label, unit } = data
        if (!itemId || !sourceZoneId || !quantity || sourceZoneId === targetId)
          return
        setPendingAssign({
          sourceId: itemId,
          targetId,
          sourceLabel: label ?? '-',
          targetLabel: target.label,
          maxQuantity: quantity,
          unit: unit ?? 'kg',
          sourceZoneId,
        })
        return
      }

      const sourceId = String(active.id)
      const source = assignableItems.find((i) => i.id === sourceId)
      if (!source || source.remaining <= 0) return

      setPendingAssign({
        sourceId,
        targetId,
        sourceLabel: source.label,
        targetLabel: target.label,
        maxQuantity: source.remaining,
        unit: source.unit,
        sourceData: source.data,
        targetData: target.data,
      })
    },
    [assignableItems, dropZones]
  )

  const handleConfirmAssign = useCallback(
    async (quantity: number) => {
      if (!pendingAssign) return
      await onAssign(pendingAssign, quantity)
      setPendingAssign(null)
    },
    [pendingAssign, onAssign]
  )

  const activeAssignedData = activeId
    ? (() => {
        if (typeof activeId !== 'string' || !activeId.startsWith('assigned::'))
          return null
        const parts = activeId.split('::')
        if (parts.length !== 3) return null
        const [, itemId, sourceZoneId] = parts
        const assigned = assignedByZone[sourceZoneId] ?? []
        const item = assigned.find((a) => a.id === itemId)
        if (!item) return null
        return { item, sourceZoneId }
      })()
    : null
  const activeItem = activeId
    ? activeAssignedData
      ? null
      : assignableItems.find((i) => i.id === activeId)
    : null

  const resolvedAssignableItemsTitle =
    assignableItemsTitle === undefined
      ? 'Atanacak Kalemler'
      : assignableItemsTitle

  const badgesSection = (
    <div>
      {resolvedAssignableItemsTitle ? (
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {resolvedAssignableItemsTitle}
        </h3>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {assignableItems.map((item) => (
          <AssignableBadge
            key={item.id}
            id={item.id}
            label={item.label}
            remaining={item.remaining}
            unit={item.unit}
            deadline={item.deadline}
            productCode={item.productCode}
            disabled={item.remaining <= 0}
            data={item.data}
            rightSlot={renderAssignableItemExtra?.(item)}
          />
        ))}
      </div>
    </div>
  )

  const dropZonesSection = (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {dropZonesTitle ??
          (layout === 'sidebar' ? 'Makineler' : 'Atama Hedefleri')}
      </h3>
      {layout === 'sidebar' ? (
        <div className="flex flex-col gap-4 max-h-144 overflow-y-auto min-h-0">
          {dropZones.map((target) =>
            renderDropZone(target, assignedByZone[target.id] ?? [])
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 min-h-0"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {dropZones.map((target) =>
            renderDropZone(target, assignedByZone[target.id] ?? [])
          )}
        </div>
      )}
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={layout === 'sidebar' ? 'flex gap-6' : 'space-y-6'}>
        {layout === 'sidebar' ? (
          <>
            <div className="flex-1 min-w-0">{badgesSection}</div>
            <div className="w-95 shrink-0 min-w-80">{dropZonesSection}</div>
          </>
        ) : (
          <>
            {badgesSection}
            {dropZonesSection}
          </>
        )}
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeItem ? (
          <div className="opacity-95">
            <AssignableBadge
              id={activeItem.id}
              label={activeItem.label}
              remaining={activeItem.remaining}
              unit={activeItem.unit}
              deadline={activeItem.deadline}
              productCode={activeItem.productCode}
              disabled={false}
            />
          </div>
        ) : activeAssignedData ? (
          <div className="opacity-95">
            <DraggableAssignedBadge
              id={activeAssignedData.item.id}
              label={activeAssignedData.item.label}
              quantity={activeAssignedData.item.quantity}
              unit={activeAssignedData.item.unit}
              sourceZoneId={activeAssignedData.sourceZoneId}
              size="large"
              fullWidth
            />
          </div>
        ) : null}
      </DragOverlay>

      <AssignQuantityModal
        open={!!pendingAssign}
        onOpenChange={(open) => !open && setPendingAssign(null)}
        sourceLabel={pendingAssign?.sourceLabel ?? ''}
        targetLabel={pendingAssign?.targetLabel ?? ''}
        maxQuantity={pendingAssign?.maxQuantity ?? 0}
        unit={pendingAssign?.unit}
        onConfirm={handleConfirmAssign}
        isPending={isAssignPending}
      />
    </DndContext>
  )
}
