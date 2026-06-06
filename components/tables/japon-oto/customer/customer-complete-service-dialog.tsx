'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { PRICE_REGEX } from '@/lib/japon/service-job-status'

type CompleteServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (serviceFee: string) => Promise<void>
}

export function CompleteServiceDialog({
  open,
  onOpenChange,
  onConfirm,
}: CompleteServiceDialogProps) {
  const [serviceFee, setServiceFee] = useState('0.00')
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    const trimmed = serviceFee.trim()
    if (!PRICE_REGEX.test(trimmed)) {
      return
    }
    try {
      setIsPending(true)
      await onConfirm(trimmed)
      onOpenChange(false)
      setServiceFee('0.00')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Servisi tamamla</DialogTitle>
          <DialogDescription>
            Servis kaydını tamamlamak için hizmet ücretini girin. Bu tutar genel
            toplama eklenecektir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="service-fee">Hizmet ücreti (₺)</Label>
          <Input
            id="service-fee"
            value={serviceFee}
            inputMode="decimal"
            onChange={(e) =>
              setServiceFee(e.target.value.replace(/[^0-9.]/g, ''))
            }
            placeholder="0.00"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button
            type="button"
            disabled={isPending || !PRICE_REGEX.test(serviceFee.trim())}
            onClick={submit}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Tamamla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
