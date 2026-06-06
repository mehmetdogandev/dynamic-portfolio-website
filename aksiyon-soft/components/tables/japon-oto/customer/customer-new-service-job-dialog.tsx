'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type NewServiceJobDialogProps = {
  customerId: string
  cars: Array<{
    id: string
    plate: string
    vehicleType: string
    km: number
  }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewServiceJobDialog({
  customerId,
  cars,
  open,
  onOpenChange,
}: NewServiceJobDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [carId, setCarId] = useState('')
  const [kmAtVisit, setKmAtVisit] = useState('0')

  useEffect(() => {
    if (!open) return
    const first = cars[0]
    setCarId(first?.id ?? '')
    setKmAtVisit(String(first?.km ?? 0))
  }, [open, cars])

  useEffect(() => {
    const car = cars.find((c) => c.id === carId)
    if (car) setKmAtVisit(String(car.km))
  }, [carId, cars])

  const { mutateAsync, isPending } = useMutation(
    trpc.japonServiceJob.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Yeni servis kaydı oluşturuldu')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.getById.queryKey({ id: customerId }),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    if (!carId) {
      toast.error('Araç seçin')
      return
    }
    const km = Number(kmAtVisit)
    if (!Number.isFinite(km) || km < 0) {
      toast.error('Geçerli KM girin')
      return
    }
    await mutateAsync({
      customerId,
      carId,
      kmAtVisit: km,
      serviceIds: [],
      parts: [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni servis kaydı</DialogTitle>
          <DialogDescription>
            Tamamlanmış veya iptal edilmiş kayıtlar düzenlenemez. Yeni bir
            servis ziyareti açın.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Araç</Label>
            <Select value={carId} onValueChange={setCarId}>
              <SelectTrigger>
                <SelectValue placeholder="Araç seçin" />
              </SelectTrigger>
              <SelectContent>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.plate} · {car.vehicleType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-job-km">KM</Label>
            <Input
              id="new-job-km"
              value={kmAtVisit}
              inputMode="numeric"
              onChange={(e) =>
                setKmAtVisit(e.target.value.replace(/[^0-9]/g, '') || '0')
              }
            />
          </div>
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
          <Button type="button" disabled={isPending || !carId} onClick={submit}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
