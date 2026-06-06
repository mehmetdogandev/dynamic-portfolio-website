'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface AssignQuantityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceLabel: string
  targetLabel: string
  maxQuantity: number
  unit?: string
  onConfirm: (quantity: number) => void | Promise<void>
  isPending?: boolean
}

export function AssignQuantityModal({
  open,
  onOpenChange,
  sourceLabel,
  targetLabel,
  maxQuantity,
  unit = 'kg',
  onConfirm,
  isPending = false,
}: AssignQuantityModalProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setValue(maxQuantity > 0 ? String(maxQuantity) : '')
    }
  }, [open, maxQuantity])

  const numValue = parseFloat(value.replace(',', '.')) || 0
  const isValid = numValue > 0 && numValue <= maxQuantity

  const handleConfirm = async () => {
    if (!isValid) return
    await onConfirm(numValue)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Miktar Girin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{sourceLabel}</span> →{' '}
            <span className="font-medium text-foreground">{targetLabel}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="quantity">Miktar ({unit})</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="decimal"
              min={0}
              max={maxQuantity}
              step="0.001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`0 - ${maxQuantity.toLocaleString('tr-TR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}`}
            />
            <p className="text-xs text-muted-foreground">
              Maksimum:{' '}
              {maxQuantity.toLocaleString('tr-TR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              {unit}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
