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
  EMPTY_STAT_SET_FORM,
  StatSetFormFields,
  type StatSetFormValues,
} from './stat-set-form-fields'

export function CreateStatSetDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<StatSetFormValues>(EMPTY_STAT_SET_FORM)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY_STAT_SET_FORM)
  }, [open])

  const { mutateAsync, isPending } = useMutation(
    trpc.homeStatSet.create.mutationOptions({
      onSuccess: () => {
        toast.success('İstatistik seti oluşturuldu')
        void queryClient.invalidateQueries({
          queryKey: trpc.homeStatSet.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const submit = async () => {
    if (!values.name.trim()) {
      toast.error('Set adı gerekli')
      return
    }
    await mutateAsync(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni istatistik seti</DialogTitle>
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
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void submit()}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
