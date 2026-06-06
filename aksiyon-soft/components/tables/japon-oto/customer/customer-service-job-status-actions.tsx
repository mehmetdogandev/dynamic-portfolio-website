'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { JaponJobStatus } from '@/lib/japon/service-job-status'
import { CompleteServiceDialog } from './customer-complete-service-dialog'

type ServiceJobStatusActionsProps = {
  status: JaponJobStatus
  disabled?: boolean
  onContinue: () => Promise<void>
  onComplete: (serviceFee: string) => Promise<void>
  onCancel: () => Promise<void>
}

export function ServiceJobStatusActions({
  status,
  disabled = false,
  onContinue,
  onComplete,
  onCancel,
}: ServiceJobStatusActionsProps) {
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  if (status === 'completed' || status === 'cancelled') {
    return null
  }

  const run = async (action: () => Promise<void>) => {
    try {
      setIsPending(true)
      await action()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === 'none' ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || isPending}
              onClick={() => run(onContinue)}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Devam Ettir
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || isPending}
              onClick={() => setCompleteOpen(true)}
            >
              Tamamla
            </Button>
          </>
        ) : null}
        {status === 'in_progress' ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={disabled || isPending}
              onClick={() => setCompleteOpen(true)}
            >
              Tamamla
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={disabled || isPending}
              onClick={() => setCancelOpen(true)}
            >
              Servis İptal
            </Button>
          </>
        ) : null}
      </div>

      <CompleteServiceDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onConfirm={onComplete}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Servisi iptal et</AlertDialogTitle>
            <AlertDialogDescription>
              Bu servis kaydı iptal edilecek. Parça ve hizmet bilgileri salt
              okunur hale gelir. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Vazgeç</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  await onCancel()
                  setCancelOpen(false)
                })
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Servis İptal
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
