'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  StatSetFormFields,
  formValuesToMutationInput,
  rowToFormValues,
  type StatSetFormValues,
} from './stat-set-form-fields'
import type { AdminHomeStatSetRow } from './types'

export function UpdateStatSetDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminHomeStatSetRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<StatSetFormValues>(rowToFormValues(row))

  useEffect(() => {
    if (!open) return
    setValues(rowToFormValues(row))
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.homeStatSet.update.mutationOptions({
      onSuccess: () => {
        toast.success('İstatistik seti güncellendi')
        void queryClient.invalidateQueries({
          queryKey: trpc.homeStatSet.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const submit = async () => {
    await mutateAsync({ id: row.id, ...formValuesToMutationInput(values) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>İstatistik setini düzenle</DialogTitle>
        </DialogHeader>
        <StatSetFormFields
          values={values}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button type="button" disabled={isPending} onClick={() => void submit()}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
