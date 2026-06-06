'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardSteps, type WizardStep } from '@/components/ui/wizard-steps'
import {
  CustomerFormFields,
  type CustomerFormValue,
} from '../customers/customer-form-fields'

const STEPS: readonly WizardStep[] = [
  { id: 'customer', label: 'Müşteri Bilgileri' },
  { id: 'car', label: 'Araç Bilgileri' },
  { id: 'service', label: 'Servisler', optional: true },
  { id: 'formen', label: 'Formen', optional: true },
  { id: 'parts', label: 'Parçalar', optional: true },
] as const

type CustomerStepData = CustomerFormValue

type CarStepData = {
  plate: string
  vehicleType: string
  color: string
  km: string
  notes: string
}

type PartRow = {
  rowId: string
  brand: string
  partNo: string
  partName: string
  quantity: string
  unitPrice: string
}

function newPartRow(): PartRow {
  return {
    rowId: crypto.randomUUID(),
    brand: '',
    partNo: '',
    partName: '',
    quantity: '1',
    unitPrice: '0.00',
  }
}

const PLATE_REGEX = /^[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{1,5}$/i

export function JaponCustomerWizard() {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const [customerData, setCustomerData] = useState<CustomerStepData>({
    name: '',
    surname: '',
    phone: '',
    address: '',
    notes: '',
  })

  const [carData, setCarData] = useState<CarStepData>({
    plate: '',
    vehicleType: '',
    color: '',
    km: '0',
    notes: '',
  })

  const [skipService, setSkipService] = useState(false)
  const [skipFormen, setSkipFormen] = useState(false)
  const [skipParts, setSkipParts] = useState(false)

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set()
  )
  const [selectedFormenId, setSelectedFormenId] = useState<string | null>(null)
  const [parts, setParts] = useState<PartRow[]>([newPartRow()])

  const [plateCheck, setPlateCheck] = useState<{
    pending: boolean
    exists: boolean | null
  }>({ pending: false, exists: null })

  const { data: services, isLoading: isServicesLoading } = useQuery(
    trpc.japonService.list.queryOptions(adminListFetchAllInput('name'))
  )
  const { data: formens, isLoading: isFormenLoading } = useQuery(
    trpc.japonFormen.list.queryOptions(adminListFetchAllInput('name'))
  )

  useEffect(() => {
    const plate = carData.plate.trim()
    if (!plate) {
      setPlateCheck({ pending: false, exists: null })
      return
    }
    setPlateCheck((prev) => ({ ...prev, pending: true }))
    const handle = setTimeout(async () => {
      try {
        const result = await queryClient.fetchQuery(
          trpc.japonCar.checkPlate.queryOptions({ plate })
        )
        setPlateCheck({ pending: false, exists: result.exists })
      } catch {
        setPlateCheck({ pending: false, exists: null })
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [carData.plate, queryClient, trpc])

  const { mutateAsync: createCustomerAsync, isPending: isCreatingCustomer } =
    useMutation(trpc.japonCustomer.create.mutationOptions())
  const { mutateAsync: createCarAsync, isPending: isCreatingCar } = useMutation(
    trpc.japonCar.create.mutationOptions()
  )
  const { mutateAsync: createJobAsync, isPending: isCreatingJob } = useMutation(
    trpc.japonServiceJob.createFromOperation.mutationOptions({
      onSuccess: async ({ id }) => {
        toast.success('İşlem kaydı oluşturuldu')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonServiceJob.list.queryKey(),
        })
        router.push(`${ADMIN_PANEL_PATH}/japon-oto/operations/${id}`)
      },
      onError: (error) => toast.error(error.message),
    })
  )
  const isSubmitting = isCreatingCustomer || isCreatingCar || isCreatingJob

  const canGoNext = useMemo(() => {
    if (currentStepIndex === 0) {
      return (
        customerData.name.trim().length > 0 &&
        customerData.surname.trim().length > 0 &&
        customerData.phone.trim().length > 0
      )
    }
    if (currentStepIndex === 1) {
      const km = Number(carData.km)
      return (
        carData.plate.trim().length > 0 &&
        carData.vehicleType.trim().length > 0 &&
        carData.color.trim().length > 0 &&
        Number.isFinite(km) &&
        km >= 0 &&
        plateCheck.exists !== true &&
        !plateCheck.pending
      )
    }
    if (currentStepIndex === 4) {
      if (skipParts) return true
      return parts.every(
        (p) =>
          p.partName.trim().length > 0 &&
          /^\d+(\.\d{1,2})?$/.test(p.unitPrice.trim()) &&
          Number(p.quantity) >= 1
      )
    }
    return true
  }, [currentStepIndex, customerData, carData, plateCheck, parts, skipParts])

  const goNext = () =>
    setCurrentStepIndex((s) => Math.min(s + 1, STEPS.length - 1))
  const goBack = () => setCurrentStepIndex((s) => Math.max(s - 1, 0))

  const hasInitialJob =
    !skipService || !skipFormen || (!skipParts && parts.length > 0)

  const submit = async () => {
    if (!canGoNext) return

    const trimmedPlate = carData.plate.trim().toUpperCase()
    if (!PLATE_REGEX.test(trimmedPlate.replace(/\s+/g, ' '))) {
      // Soft warning only — backend treats plate as free text but we hint.
      toast.warning(
        'Plaka formatı standart Türk plaka düzenine uymuyor olabilir, yine de kaydedildi.'
      )
    }

    const jobPayload = hasInitialJob
      ? {
          formenId: skipFormen ? null : selectedFormenId,
          serviceIds: skipService ? [] : Array.from(selectedServiceIds),
          parts: skipParts
            ? []
            : parts
                .filter((p) => p.partName.trim().length > 0)
                .map((p) => ({
                  brand: p.brand.trim() || undefined,
                  partNo: p.partNo.trim() || undefined,
                  partName: p.partName.trim(),
                  quantity: Number(p.quantity) || 1,
                  unitPrice: p.unitPrice.trim(),
                })),
          notes: undefined,
          isCompleted: false,
        }
      : null

    try {
      const customer = await createCustomerAsync({
        name: customerData.name.trim(),
        surname: customerData.surname.trim(),
        phone: customerData.phone.trim(),
        address: customerData.address.trim() || undefined,
        notes: customerData.notes.trim() || undefined,
      })

      const car = await createCarAsync({
        customerId: customer.id,
        plate: trimmedPlate,
        vehicleType: carData.vehicleType.trim(),
        color: carData.color.trim(),
        km: Number(carData.km) || 0,
        notes: carData.notes.trim() || undefined,
      })

      await createJobAsync({
        customerId: customer.id,
        carId: car.id,
        transferOwnership: false,
        formenId: jobPayload?.formenId ?? null,
        kmAtVisit: Number(carData.km) || 0,
        notes: jobPayload?.notes,
        isCompleted: jobPayload?.isCompleted ?? false,
        serviceIds: jobPayload?.serviceIds ?? [],
        parts: jobPayload?.parts ?? [],
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Kayıt oluşturulamadı'
      )
    }
  }

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return <CustomerStep value={customerData} onChange={setCustomerData} />
      case 1:
        return (
          <CarStep
            value={carData}
            onChange={setCarData}
            plateCheck={plateCheck}
          />
        )
      case 2:
        return (
          <ServicesStep
            services={services?.data ?? []}
            isLoading={isServicesLoading}
            selectedIds={selectedServiceIds}
            onChangeSelectedIds={setSelectedServiceIds}
            skip={skipService}
            onChangeSkip={setSkipService}
          />
        )
      case 3:
        return (
          <FormenStep
            formens={formens?.data ?? []}
            isLoading={isFormenLoading}
            selectedId={selectedFormenId}
            onChangeSelectedId={setSelectedFormenId}
            skip={skipFormen}
            onChangeSkip={setSkipFormen}
          />
        )
      case 4:
        return (
          <PartsStep
            parts={parts}
            onChange={setParts}
            skip={skipParts}
            onChangeSkip={setSkipParts}
          />
        )
      default:
        return null
    }
  }

  const isLastStep = currentStepIndex === STEPS.length - 1

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Yeni Müşteri Kaydı</CardTitle>
          <CardDescription>
            Kağıt formdaki gibi adım adım müşteri, araç ve servis bilgilerini
            doldurun. 3-4-5. adımları atlayıp daha sonra detay sayfasından
            tamamlayabilirsiniz.
          </CardDescription>
        </div>
        <div className="pt-4">
          <WizardSteps
            steps={STEPS}
            currentStepIndex={currentStepIndex}
            onStepClick={(index) => setCurrentStepIndex(index)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderCurrentStep()}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Geri
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={submit}
              disabled={!canGoNext || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Kaydet
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canGoNext || isSubmitting}
            >
              Devam
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CustomerStep({
  value,
  onChange,
}: {
  value: CustomerStepData
  onChange: (next: CustomerStepData) => void
}) {
  return <CustomerFormFields value={value} onChange={onChange} />
}

function CarStep({
  value,
  onChange,
  plateCheck,
}: {
  value: CarStepData
  onChange: (next: CarStepData) => void
  plateCheck: { pending: boolean; exists: boolean | null }
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-plate">Plaka *</Label>
          <Input
            id="wizard-plate"
            value={value.plate}
            onChange={(e) =>
              onChange({ ...value, plate: e.target.value.toUpperCase() })
            }
            placeholder="34 ABC 123"
            autoCapitalize="characters"
          />
          {plateCheck.pending ? (
            <p className="text-xs text-muted-foreground">
              Plaka kontrol ediliyor…
            </p>
          ) : plateCheck.exists === true ? (
            <p className="text-xs text-destructive">
              Bu araç plakası zaten kayıtlı.
            </p>
          ) : plateCheck.exists === false && value.plate.trim().length > 0 ? (
            <p className="text-xs text-emerald-600">Plaka kullanılabilir.</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-vehicle-type">Araç tipi *</Label>
          <Input
            id="wizard-vehicle-type"
            value={value.vehicleType}
            onChange={(e) =>
              onChange({ ...value, vehicleType: e.target.value })
            }
            placeholder="Toyota Corolla"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-color">Renk *</Label>
          <Input
            id="wizard-color"
            value={value.color}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            placeholder="Beyaz"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-km">KM *</Label>
          <Input
            id="wizard-km"
            inputMode="numeric"
            value={value.km}
            onChange={(e) =>
              onChange({ ...value, km: e.target.value.replace(/[^0-9]/g, '') })
            }
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-car-notes">Araç notu</Label>
        <Textarea
          id="wizard-car-notes"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  )
}

function ServicesStep({
  services,
  isLoading,
  selectedIds,
  onChangeSelectedIds,
  skip,
  onChangeSkip,
}: {
  services: Array<{
    id: string
    name: string
    description: string | null
    isActive: boolean
  }>
  isLoading: boolean
  selectedIds: Set<string>
  onChangeSelectedIds: (next: Set<string>) => void
  skip: boolean
  onChangeSkip: (next: boolean) => void
}) {
  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChangeSelectedIds(next)
  }

  const activeServices = services.filter((s) => s.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <Checkbox
          id="wizard-skip-services"
          checked={skip}
          onCheckedChange={(checked) => onChangeSkip(checked === true)}
        />
        <Label
          htmlFor="wizard-skip-services"
          className="text-sm font-normal text-muted-foreground"
        >
          Sonradan düzenleyeceğim, bu adımı atla
        </Label>
      </div>

      {skip ? (
        <p className="text-sm text-muted-foreground">
          Servisleri detay sayfasından sonra ekleyebilirsiniz.
        </p>
      ) : isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeServices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tanımlı servis yok. Önce <strong>Servis</strong> sayfasından servis
          ekleyin.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {activeServices.map((service) => {
            const isSelected = selectedIds.has(service.id)
            return (
              <label
                key={service.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(service.id)}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{service.name}</span>
                  {service.description ? (
                    <span className="text-xs text-muted-foreground">
                      {service.description}
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FormenStep({
  formens,
  isLoading,
  selectedId,
  onChangeSelectedId,
  skip,
  onChangeSkip,
}: {
  formens: Array<{
    id: string
    name: string
    surname: string | null
    phone: string | null
    isActive: boolean
  }>
  isLoading: boolean
  selectedId: string | null
  onChangeSelectedId: (next: string | null) => void
  skip: boolean
  onChangeSkip: (next: boolean) => void
}) {
  const activeFormens = formens.filter((f) => f.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <Checkbox
          id="wizard-skip-formen"
          checked={skip}
          onCheckedChange={(checked) => onChangeSkip(checked === true)}
        />
        <Label
          htmlFor="wizard-skip-formen"
          className="text-sm font-normal text-muted-foreground"
        >
          Sonradan düzenleyeceğim, bu adımı atla
        </Label>
      </div>

      {skip ? (
        <p className="text-sm text-muted-foreground">
          Formeni detay sayfasından sonra atayabilirsiniz.
        </p>
      ) : isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeFormens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tanımlı formen yok. Önce <strong>Formen</strong> sayfasından formen
          ekleyin.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {activeFormens.map((formen) => {
            const fullName = formen.surname
              ? `${formen.name} ${formen.surname}`
              : formen.name
            const isSelected = selectedId === formen.id
            return (
              <label
                key={formen.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      onChangeSelectedId(formen.id)
                    } else if (isSelected) {
                      onChangeSelectedId(null)
                    }
                  }}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{fullName}</span>
                  {formen.phone ? (
                    <span className="text-xs text-muted-foreground">
                      {formen.phone}
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PartsStep({
  parts,
  onChange,
  skip,
  onChangeSkip,
}: {
  parts: PartRow[]
  onChange: (next: PartRow[]) => void
  skip: boolean
  onChangeSkip: (next: boolean) => void
}) {
  const updateRow = (index: number, patch: Partial<PartRow>) => {
    const next = parts.slice()
    next[index] = { ...next[index]!, ...patch }
    onChange(next)
  }
  const removeRow = (index: number) => {
    onChange(parts.filter((_, i) => i !== index))
  }
  const addRow = () => onChange([...parts, newPartRow()])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <Checkbox
          id="wizard-skip-parts"
          checked={skip}
          onCheckedChange={(checked) => onChangeSkip(checked === true)}
        />
        <Label
          htmlFor="wizard-skip-parts"
          className="text-sm font-normal text-muted-foreground"
        >
          Sonradan düzenleyeceğim, bu adımı atla
        </Label>
      </div>

      {skip ? (
        <p className="text-sm text-muted-foreground">
          Parça listesini detay sayfasından sonra ekleyebilirsiniz.
        </p>
      ) : (
        <div className="space-y-3">
          {parts.map((row, index) => (
            <div
              key={row.rowId}
              className="grid gap-2 rounded-md border p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Marka</Label>
                <Input
                  value={row.brand}
                  onChange={(e) => updateRow(index, { brand: e.target.value })}
                  placeholder="Bosch"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Parça No</Label>
                <Input
                  value={row.partNo}
                  onChange={(e) => updateRow(index, { partNo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <Label className="text-xs">Parça Adı *</Label>
                <Input
                  value={row.partName}
                  onChange={(e) =>
                    updateRow(index, { partName: e.target.value })
                  }
                  placeholder="Yağ filtresi"
                />
              </div>
              <div className="sm:col-span-1 space-y-1.5">
                <Label className="text-xs">Adet</Label>
                <Input
                  value={row.quantity}
                  inputMode="numeric"
                  onChange={(e) =>
                    updateRow(index, {
                      quantity: e.target.value.replace(/[^0-9]/g, '') || '1',
                    })
                  }
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Birim Fiyat ₺ *</Label>
                <Input
                  value={row.unitPrice}
                  inputMode="decimal"
                  onChange={(e) =>
                    updateRow(index, {
                      unitPrice: e.target.value.replace(/[^0-9.]/g, ''),
                    })
                  }
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  disabled={parts.length === 1}
                  aria-label="Parçayı kaldır"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1.5 h-4 w-4" />
            Parça satırı ekle
          </Button>
        </div>
      )}
    </div>
  )
}
