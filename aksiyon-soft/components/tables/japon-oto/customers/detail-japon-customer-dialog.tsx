'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function DetailJaponCustomerDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const { data, isLoading, isError, error } = useQuery({
    ...trpc.japonCustomer.getById.queryOptions({ id: customerId }),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Müşteri detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-destructive">
            {error?.message ?? 'Müşteri detayı alınamadı'}
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-base font-semibold">
                {data.customer.name} {data.customer.surname}
              </p>
              <p className="text-muted-foreground">
                {data.customer.customerNo}
              </p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>Telefon: {data.customer.phone}</p>
                <p>Adres: {data.customer.address ?? '—'}</p>
                <p className="sm:col-span-2">
                  Not: {data.customer.notes ?? '—'}
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium">Araçlar</span>
                <Badge variant="secondary">
                  {data.currentCars.length + data.pastCars.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {[...data.currentCars, ...data.pastCars].map((car) => (
                  <p key={car.id}>
                    {car.plate} · {car.vehicleType} ·{' '}
                    {car.km.toLocaleString('tr-TR')} km
                  </p>
                ))}
                {data.currentCars.length + data.pastCars.length === 0 ? (
                  <p className="text-muted-foreground">Araç yok</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium">Servis geçmişi</span>
                <Badge variant="secondary">{data.jobs.length}</Badge>
              </div>
              <div className="space-y-2">
                {data.jobs.slice(0, 8).map((job) => (
                  <div key={job.id} className="rounded border p-2">
                    <p className="font-medium">
                      {job.plate} ·{' '}
                      {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-muted-foreground">
                      Servis:{' '}
                      {job.services.map((service) => service.name).join(', ') ||
                        '—'}
                    </p>
                  </div>
                ))}
                {data.jobs.length === 0 ? (
                  <p className="text-muted-foreground">Servis kaydı yok</p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
