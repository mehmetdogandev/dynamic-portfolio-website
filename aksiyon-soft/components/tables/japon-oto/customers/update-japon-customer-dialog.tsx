'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { JaponCustomerListRow } from './customers-data-table'
import {
  CustomerFormFields,
  emptyCustomerFormValue,
  type CustomerFormValue,
} from './customer-form-fields'

export function UpdateJaponCustomerDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JaponCustomerListRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CustomerFormValue>(emptyCustomerFormValue)
  const { data } = useQuery({
    ...trpc.japonCustomer.getById.queryOptions({ id: row.id }),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name: data?.customer.name ?? row.name,
      surname: data?.customer.surname ?? row.surname,
      phone: data?.customer.phone ?? row.phone,
      address: data?.customer.address ?? row.address ?? '',
      notes: data?.customer.notes ?? '',
    })
  }, [open, row, data?.customer])

  const { mutateAsync, isPending } = useMutation(
    trpc.japonCustomer.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Müşteri güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.list.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.getById.queryKey({ id: row.id }),
        })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!form.name.trim() || !form.surname.trim() || !form.phone.trim()) {
      toast.error('Ad, soyad ve telefon zorunludur')
      return
    }
    await mutateAsync({
      id: row.id,
      name: form.name.trim(),
      surname: form.surname.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Müşteri düzenle</DialogTitle>
          <DialogDescription>
            Müşteri no: <span className="font-medium">{row.customerNo}</span>
          </DialogDescription>
        </DialogHeader>
        <CustomerFormFields
          value={form}
          onChange={setForm}
          disabled={isPending}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Güncelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
