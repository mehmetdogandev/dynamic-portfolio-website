'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxItem } from '@/components/ui/combobox'
import { WizardSteps, type WizardStep } from '@/components/ui/wizard-steps'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STEPS: readonly WizardStep[] = [
  { id: 'customer', label: 'Müşteri' },
  { id: 'car', label: 'Araç' },
  { id: 'service', label: 'Servisler', optional: true },
  { id: 'formen', label: 'Formen', optional: true },
  { id: 'parts', label: 'Parçalar', optional: true },
] as const

type SelectedCustomer = {
  id: string
  customerNo: string
  name: string
  surname: string
  phone: string
}

type SelectedCar = {
  id: string
  plate: string
  vehicleType: string
  customerId: string
  ownerLabel: string
}

type JaponOperationWizardProps = {
  variant?: 'page' | 'dialog'
  onSuccess?: () => void
  onCancel?: () => void
}

export function JaponOperationWizard({
  variant = 'page',
  onSuccess,
  onCancel,
}: JaponOperationWizardProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null)
  const [carSearch, setCarSearch] = useState('')
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(null)
  const [transferPending, setTransferPending] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [kmAtVisit, setKmAtVisit] = useState('0')
  const [jobNotes, setJobNotes] = useState('')

  const { data: customerResults, isLoading: customersLoading } = useQuery({
    ...trpc.japonCustomer.searchForOperation.queryOptions({
      search: customerSearch || ' ',
      limit: 20,
    }),
    enabled: customerSearch.trim().length >= 2,
  })

  const { data: carResults, isLoading: carsLoading } = useQuery({
    ...trpc.japonCar.searchForOperation.queryOptions({
      search: carSearch || ' ',
      customerId: selectedCustomer?.id,
      limit: 20,
    }),
    enabled: Boolean(selectedCustomer) && carSearch.trim().length >= 2,
  })

  const { data: customerCars } = useQuery({
    ...trpc.japonCar.listByCustomer.queryOptions({
      customerId: selectedCustomer?.id ?? '',
    }),
    enabled: Boolean(selectedCustomer?.id),
  })

  useEffect(() => {
    if (!selectedCustomer || !customerCars?.length) return
    if (customerCars.length === 1 && !selectedCar) {
      const car = customerCars[0]
      setSelectedCar({
        id: car.id,
        plate: car.plate,
        vehicleType: car.vehicleType,
        customerId: car.customerId,
        ownerLabel: `${selectedCustomer.name} ${selectedCustomer.surname}`,
      })
    }
  }, [selectedCustomer, customerCars, selectedCar])

  const customerItems: ComboboxItem[] = useMemo(
    () =>
      (customerResults ?? []).map((c) => ({
        value: c.id,
        label: `${c.name} ${c.surname} · ${c.customerNo} · ${c.phone}`,
      })),
    [customerResults]
  )

  const carItems: ComboboxItem[] = useMemo(() => {
    const fromSearch = (carResults ?? []).map((c) => ({
      value: c.id,
      label: `${c.plate} — ${c.ownerLabel}${c.isOwnedBySelectedCustomer === false ? ' (başka müşteri)' : ''}`,
    }))
    const owned = (customerCars ?? []).map((c) => ({
      value: c.id,
      label: `${c.plate} (müşterinin aracı)`,
    }))
    const merged = new Map<string, ComboboxItem>()
    for (const item of [...owned, ...fromSearch]) {
      merged.set(item.value, item)
    }
    return [...merged.values()]
  }, [carResults, customerCars])

  const { mutateAsync: createOperation, isPending: isSubmitting } = useMutation(
    trpc.japonServiceJob.createFromOperation.mutationOptions({
      onSuccess: async ({ id }) => {
        onSuccess?.()
        toast.success('İşlem kaydı oluşturuldu')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonServiceJob.list.queryKey(),
        })
        router.push(`${ADMIN_PANEL_PATH}/japon-oto/operations/${id}`)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const needsTransfer =
    selectedCustomer &&
    selectedCar &&
    selectedCar.customerId !== selectedCustomer.id

  const canGoNext = useMemo(() => {
    if (currentStepIndex === 0) return Boolean(selectedCustomer)
    if (currentStepIndex === 1) return Boolean(selectedCar)
    return true
  }, [currentStepIndex, selectedCustomer, selectedCar])

  const submitOperation = useCallback(
    async (transferOwnership: boolean) => {
      if (!selectedCustomer || !selectedCar) return
      await createOperation({
        customerId: selectedCustomer.id,
        carId: selectedCar.id,
        transferOwnership,
        formenId: null,
        kmAtVisit: Number(kmAtVisit) || 0,
        notes: jobNotes.trim() || undefined,
        isCompleted: false,
        serviceIds: [],
        parts: [],
      })
    },
    [createOperation, selectedCustomer, selectedCar, kmAtVisit, jobNotes]
  )

  const goNext = () => {
    if (currentStepIndex === 1 && needsTransfer) {
      setTransferPending(true)
      return
    }
    setCurrentStepIndex((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const isLastStep = currentStepIndex === STEPS.length - 1

  const body = (
    <>
      <div className={variant === 'dialog' ? 'space-y-6' : undefined}>
        {variant === 'dialog' ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Yeni işlem</h2>
            <p className="text-muted-foreground text-sm">
              Müşteri ve aracı seçin; gerekirse yeni kayıt ekleyin. Sonraki
              adımlarda servis detaylarını girebilirsiniz.
            </p>
            <WizardSteps
              steps={STEPS}
              currentStepIndex={currentStepIndex}
              onStepClick={setCurrentStepIndex}
            />
          </div>
        ) : null}
        <div className="space-y-6">
          {currentStepIndex === 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[280px] flex-1 space-y-1.5">
                  <Label>Müşteri ara</Label>
                  <Combobox
                    items={customerItems}
                    value={selectedCustomer?.id}
                    onChange={(id) => {
                      const found = customerResults?.find((c) => c.id === id)
                      if (found) {
                        setSelectedCustomer(found)
                        setSelectedCar(null)
                      }
                    }}
                    onQueryChange={setCustomerSearch}
                    isLoading={customersLoading}
                    placeholder="Ad, müşteri no, telefon veya plaka"
                    searchPlaceholder="En az 2 karakter yazın"
                    emptyMessage="Müşteri bulunamadı"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewCustomerOpen(true)}
                >
                  <Plus className="mr-1 size-4" />
                  Müşteri ekle
                </Button>
              </div>
              {selectedCustomer ? (
                <p className="text-muted-foreground text-sm">
                  Seçili: {selectedCustomer.name} {selectedCustomer.surname} —{' '}
                  {selectedCustomer.customerNo}
                </p>
              ) : null}
            </div>
          ) : null}

          {currentStepIndex === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Araç ara (plaka)</Label>
                <Combobox
                  items={carItems}
                  value={selectedCar?.id}
                  onChange={(id) => {
                    const fromList =
                      carResults?.find((c) => c.id === id) ??
                      customerCars?.find((c) => c.id === id)
                    if (fromList && selectedCustomer) {
                      const ownerLabel =
                        'ownerLabel' in fromList
                          ? (fromList as { ownerLabel: string }).ownerLabel
                          : `${selectedCustomer.name} ${selectedCustomer.surname}`
                      setSelectedCar({
                        id: fromList.id,
                        plate: fromList.plate,
                        vehicleType: fromList.vehicleType,
                        customerId: fromList.customerId,
                        ownerLabel,
                      })
                    }
                  }}
                  onQueryChange={setCarSearch}
                  isLoading={carsLoading}
                  enabled={Boolean(selectedCustomer)}
                  placeholder="Plaka ile ara"
                  searchPlaceholder="En az 2 karakter"
                  emptyMessage="Araç bulunamadı"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>KM (ziyaret)</Label>
                  <Input
                    inputMode="numeric"
                    value={kmAtVisit}
                    onChange={(e) =>
                      setKmAtVisit(e.target.value.replace(/[^0-9]/g, ''))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Not</Label>
                <Textarea
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  rows={2}
                />
              </div>
              {selectedCar ? (
                <p className="text-muted-foreground text-sm">
                  Seçili plaka: {selectedCar.plate}
                  {needsTransfer
                    ? ' — farklı müşteriye kayıtlı, devamda onay istenecek'
                    : null}
                </p>
              ) : null}
            </div>
          ) : null}

          {currentStepIndex >= 2 ? (
            <p className="text-muted-foreground text-sm">
              Servis, formen ve parça adımları işlem oluşturulduktan sonra detay
              sayfasından tamamlanabilir. Devam ile işlemi kaydedin.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentStepIndex === 0 || isSubmitting}
              onClick={() => {
                if (currentStepIndex === 0 && onCancel) {
                  onCancel()
                  return
                }
                setCurrentStepIndex((s) => Math.max(0, s - 1))
              }}
            >
              <ArrowLeft className="mr-1 size-4" />
              {currentStepIndex === 0 && onCancel ? 'Vazgeç' : 'Geri'}
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                disabled={!canGoNext || isSubmitting}
                onClick={() => void submitOperation(needsTransfer === true)}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                Kaydet
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canGoNext || isSubmitting}
                onClick={goNext}
              >
                Devam
                <ArrowRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni müşteri</DialogTitle>
          </DialogHeader>
          <QuickCustomerForm
            onCreated={(customer) => {
              setSelectedCustomer(customer)
              setNewCustomerOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={transferPending} onOpenChange={setTransferPending}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sahiplik devri</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCar?.plate} plakalı araç başka bir müşteriye kayıtlı.
              Sahiplik seçili müşteriye devredilsin mi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTransferPending(false)
                setCurrentStepIndex((s) => Math.min(s + 1, STEPS.length - 1))
              }}
            >
              Devret ve devam et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  if (variant === 'dialog') {
    return body
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni işlem</CardTitle>
        <CardDescription>
          Müşteri ve aracı seçin; gerekirse yeni kayıt ekleyin. Sonraki
          adımlarda servis detaylarını girebilirsiniz.
        </CardDescription>
        <div className="pt-4">
          <WizardSteps
            steps={STEPS}
            currentStepIndex={currentStepIndex}
            onStepClick={setCurrentStepIndex}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{body}</CardContent>
    </Card>
  )
}

function QuickCustomerForm({
  onCreated,
}: {
  onCreated: (customer: SelectedCustomer) => void
}) {
  const trpc = useTRPC()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')

  const { mutateAsync, isPending } = useMutation(
    trpc.japonCustomer.create.mutationOptions({
      onSuccess: (data) => {
        onCreated({
          id: data.id,
          customerNo: data.customerNo,
          name,
          surname,
          phone,
        })
        toast.success('Müşteri oluşturuldu')
      },
      onError: (e) => toast.error(e.message),
    })
  )

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void mutateAsync({
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
        })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ad</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Soyad</Label>
          <Input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Telefon</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Kaydet'}
        </Button>
      </DialogFooter>
    </form>
  )
}
