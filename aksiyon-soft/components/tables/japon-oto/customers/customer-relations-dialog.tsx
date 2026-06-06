'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function CustomerRelationsDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [searchPlate, setSearchPlate] = useState('')
  const [newPlate, setNewPlate] = useState('')
  const [newVehicleType, setNewVehicleType] = useState('')
  const [newColor, setNewColor] = useState('')
  const [newKm, setNewKm] = useState('0')

  const { data, isLoading } = useQuery({
    ...trpc.japonCustomer.getById.queryOptions({ id: customerId }),
    enabled: open,
  })

  const { data: searchResult, isFetching: isSearching } = useQuery({
    ...trpc.japonCar.searchForOperation.queryOptions({
      search: searchPlate.trim(),
      limit: 10,
    }),
    enabled: open && searchPlate.trim().length >= 2,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.japonCustomer.getById.queryKey({ id: customerId }),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.japonCustomer.list.queryKey(),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.japonCar.list.queryKey(),
    })
  }

  const { mutateAsync: transferAsync, isPending: isTransferring } = useMutation(
    trpc.japonCar.transferOwnership.mutationOptions({
      onSuccess: async () => {
        toast.success('Araç ilişkisi eklendi')
        await invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const { mutateAsync: createCarAsync, isPending: isCreatingCar } = useMutation(
    trpc.japonCar.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Yeni araç ilişkilendirildi')
        setNewPlate('')
        setNewVehicleType('')
        setNewColor('')
        setNewKm('0')
        await invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const { mutateAsync: deleteCarAsync, isPending: isDeletingCar } = useMutation(
    trpc.japonCar.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Araç ilişkisi silindi')
        await invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const jobsByCarId = useMemo(() => {
    const customerJobs = data?.jobs ?? []
    const map = new Map<string, typeof customerJobs>()
    for (const job of customerJobs) {
      const arr = map.get(job.carId) ?? []
      arr.push(job)
      map.set(job.carId, arr)
    }
    return map
  }, [data?.jobs])

  const allCars = useMemo(
    () => [...(data?.currentCars ?? []), ...(data?.pastCars ?? [])],
    [data?.currentCars, data?.pastCars]
  )

  const isBusy = isTransferring || isCreatingCar || isDeletingCar

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Araç-servis ilişkileri</DialogTitle>
          <DialogDescription>
            Bu alanda servis/müşteri düzenleme yoktur. Sadece araç
            ilişkilendirme (ekle/sil) yapılır.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-3 rounded-md border p-3">
              <h4 className="font-medium">Mevcut aracı ilişkilendir</h4>
              <Input
                value={searchPlate}
                onChange={(event) => setSearchPlate(event.target.value)}
                placeholder="Plaka ile ara (en az 2 karakter)"
              />
              {isSearching ? (
                <p className="text-sm text-muted-foreground">
                  Araçlar aranıyor…
                </p>
              ) : (
                <div className="space-y-2">
                  {(searchResult ?? [])
                    .filter((car) => car.customerId !== customerId)
                    .map((car) => (
                      <div
                        key={car.id}
                        className="flex items-center justify-between rounded border p-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {car.plate} · {car.vehicleType}
                          </p>
                          <p className="text-muted-foreground">
                            Sahip: {car.ownerLabel} ({car.ownerCustomerNo})
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            transferAsync({
                              carId: car.id,
                              newCustomerId: customerId,
                            })
                          }
                          disabled={isBusy}
                        >
                          İlişkilendir
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-md border p-3">
              <h4 className="font-medium">Yeni araç ilişkilendir</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Plaka</Label>
                  <Input
                    value={newPlate}
                    onChange={(event) =>
                      setNewPlate(event.target.value.toUpperCase())
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Araç tipi</Label>
                  <Input
                    value={newVehicleType}
                    onChange={(event) => setNewVehicleType(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Renk</Label>
                  <Input
                    value={newColor}
                    onChange={(event) => setNewColor(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>KM</Label>
                  <Input
                    value={newKm}
                    inputMode="numeric"
                    onChange={(event) =>
                      setNewKm(event.target.value.replace(/[^0-9]/g, '') || '0')
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() =>
                  createCarAsync({
                    customerId,
                    plate: newPlate.trim(),
                    vehicleType: newVehicleType.trim(),
                    color: newColor.trim(),
                    km: Number(newKm) || 0,
                  })
                }
                disabled={
                  isBusy ||
                  !newPlate.trim() ||
                  !newVehicleType.trim() ||
                  !newColor.trim()
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni araç ekle
              </Button>
            </section>

            <section className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Müşteriye bağlı araçlar</h4>
                <Badge variant="secondary">{allCars.length}</Badge>
              </div>
              <Accordion type="multiple" className="w-full">
                {allCars.map((car) => {
                  const jobs = jobsByCarId.get(car.id) ?? []
                  return (
                    <AccordionItem key={car.id} value={car.id}>
                      <AccordionTrigger>
                        <div className="flex w-full items-center justify-between pr-2 text-left">
                          <span>
                            {car.plate} · {car.vehicleType}
                          </span>
                          <Badge variant="outline">{jobs.length} servis</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground">
                            {car.color} · {car.km.toLocaleString('tr-TR')} km
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCarAsync({ id: car.id })}
                            disabled={isBusy}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            İlişkiyi sil
                          </Button>
                        </div>
                        <Accordion
                          type="multiple"
                          className="w-full rounded-md border px-3"
                        >
                          {jobs.length === 0 ? (
                            <p className="py-3 text-sm text-muted-foreground">
                              Bu araç için servis kaydı yok.
                            </p>
                          ) : (
                            jobs.map((job) => (
                              <AccordionItem key={job.id} value={job.id}>
                                <AccordionTrigger>
                                  {new Date(job.createdAt).toLocaleDateString(
                                    'tr-TR'
                                  )}{' '}
                                  · {job.services.length} servis ·{' '}
                                  {job.parts.length} parça
                                </AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                  <p className="text-sm">
                                    Servisler:{' '}
                                    {job.services
                                      .map((service) => service.name)
                                      .join(', ') || '—'}
                                  </p>
                                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                                    {job.parts.map((part) => (
                                      <li key={part.id}>
                                        {part.partName} x{part.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            ))
                          )}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
