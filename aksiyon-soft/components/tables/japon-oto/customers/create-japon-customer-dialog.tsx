'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  CustomerFormFields,
  emptyCustomerFormValue,
  type CustomerFormValue,
} from './customer-form-fields'

export function CreateJaponCustomerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CustomerFormValue>(emptyCustomerFormValue)

  const { mutateAsync, isPending } = useMutation(
    trpc.japonCustomer.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Müşteri oluşturuldu')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.list.queryKey(),
        })
        onOpenChange(false)
        setForm(emptyCustomerFormValue)
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
      name: form.name.trim(),
      surname: form.surname.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setForm(emptyCustomerFormValue)
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni müşteri</DialogTitle>
          <DialogDescription>
            Müşteri numarası kayıt sırasında otomatik atanır.
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
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
