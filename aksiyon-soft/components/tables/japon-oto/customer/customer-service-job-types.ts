'use client'

export type JaponPartDraft = {
  rowId: string
  brand: string
  partNo: string
  partName: string
  quantity: string
  unitPrice: string
}

export type JaponCustomerJob = {
  id: string
  carId: string
  customerId: string
  formenId: string | null
  kmAtVisit: number
  notes: string | null
  isCompleted: boolean
  isCancelled: boolean
  serviceFee: string | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  formenLabel: string | null
  services: Array<{ id: string; name: string }>
  parts: Array<{
    id: string
    brand: string | null
    partNo: string | null
    partName: string
    quantity: number
    unitPrice: string
  }>
}

export type JaponJobDraft = {
  parts: JaponPartDraft[]
  serviceIds: string[]
}

export function newPartDraft(): JaponPartDraft {
  return {
    rowId: crypto.randomUUID(),
    brand: '',
    partNo: '',
    partName: '',
    quantity: '1',
    unitPrice: '0.00',
  }
}

export function partsFromJob(
  parts: JaponCustomerJob['parts']
): JaponPartDraft[] {
  if (parts.length === 0) return []
  return parts.map((p) => ({
    rowId: p.id,
    brand: p.brand ?? '',
    partNo: p.partNo ?? '',
    partName: p.partName,
    quantity: String(p.quantity),
    unitPrice: p.unitPrice,
  }))
}

export function serializePartsForApi(parts: JaponPartDraft[]) {
  return parts
    .filter((p) => p.partName.trim().length > 0)
    .map((p) => ({
      brand: p.brand.trim() || undefined,
      partNo: p.partNo.trim() || undefined,
      partName: p.partName.trim(),
      quantity: Number(p.quantity) || 1,
      unitPrice: p.unitPrice.trim(),
    }))
}

export function validatePartDrafts(parts: JaponPartDraft[]): string | null {
  for (const p of parts) {
    if (!p.partName.trim()) continue
    if (!/^\d+(\.\d{1,2})?$/.test(p.unitPrice.trim())) {
      return `"${p.partName}" için geçersiz birim fiyat`
    }
    if (Number(p.quantity) < 1) {
      return `"${p.partName}" için adet en az 1 olmalı`
    }
  }
  return null
}
