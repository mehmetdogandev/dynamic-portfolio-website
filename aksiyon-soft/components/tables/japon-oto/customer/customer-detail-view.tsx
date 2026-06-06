'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Car,
  Loader2,
  Pencil,
  Plus,
  Save,
  Wrench,
  X,
} from 'lucide-react'
import { usePermission } from '@/lib/hooks/use-rbac'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { isJaponJobEditable } from '@/lib/japon/service-job-status'
import { useTRPC } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NewServiceJobDialog } from './customer-new-service-job-dialog'
import { ServiceJobEditor } from './customer-service-job-editor'
import {
  partsFromJob,
  serializePartsForApi,
  validatePartDrafts,
  type JaponCustomerJob,
  type JaponJobDraft,
} from './customer-service-job-types'

type DetailViewProps = {
  customerId: string
}

function buildInitialDrafts(
  jobs: JaponCustomerJob[]
): Record<string, JaponJobDraft> {
  const drafts: Record<string, JaponJobDraft> = {}
  for (const job of jobs) {
    if (!isJaponJobEditable(job)) continue
    drafts[job.id] = {
      parts: partsFromJob(job.parts),
      serviceIds: job.services.map((s) => s.id),
    }
  }
  return drafts
}

export function JaponCustomerDetailView({ customerId }: DetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: canUpdate } = usePermission(
    SCOPES.JAPON_OTO_CUSTOMER,
    PERMISSIONS.UPDATE
  )
  const { data: canCreate } = usePermission(
    SCOPES.JAPON_OTO_CUSTOMER,
    PERMISSIONS.CREATE
  )

  const initialEdit = searchParams?.get('edit') === '1'
  const [isEditing, setIsEditing] = useState(initialEdit && canUpdate === true)
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [jobDrafts, setJobDrafts] = useState<Record<string, JaponJobDraft>>({})

  useEffect(() => {
    if (initialEdit && canUpdate) setIsEditing(true)
  }, [initialEdit, canUpdate])

  const { data, isLoading, isError, error } = useQuery(
    trpc.japonCustomer.getById.queryOptions({ id: customerId })
  )

  const jobs = useMemo(
    () => (data?.jobs ?? []) as JaponCustomerJob[],
    [data?.jobs]
  )

  useEffect(() => {
    if (!data?.jobs) return
    setJobDrafts(buildInitialDrafts(data.jobs as JaponCustomerJob[]))
  }, [data?.jobs])

  const [form, setForm] = useState({
    name: '',
    surname: '',
    phone: '',
    address: '',
    notes: '',
  })

  useEffect(() => {
    if (!data?.customer) return
    setForm({
      name: data.customer.name,
      surname: data.customer.surname,
      phone: data.customer.phone,
      address: data.customer.address ?? '',
      notes: data.customer.notes ?? '',
    })
  }, [data])

  const invalidateCustomer = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.japonCustomer.getById.queryKey({ id: customerId }),
    })
    await queryClient.invalidateQueries({
      queryKey: trpc.japonCustomer.list.queryKey(),
    })
  }, [queryClient, trpc, customerId])

  const { mutateAsync: updateAsync, isPending: isSavingCustomer } = useMutation(
    trpc.japonCustomer.update.mutationOptions({
      onError: (e) => toast.error(e.message),
    })
  )

  const { mutateAsync: setPartsAsync } = useMutation(
    trpc.japonServiceJob.setParts.mutationOptions({
      onError: (e) => toast.error(e.message),
    })
  )

  const { mutateAsync: setServicesAsync } = useMutation(
    trpc.japonServiceJob.setServices.mutationOptions({
      onError: (e) => toast.error(e.message),
    })
  )

  const { mutateAsync: transitionStatusAsync, isPending: isTransitioning } =
    useMutation(
      trpc.japonServiceJob.transitionStatus.mutationOptions({
        onSuccess: async () => {
          await invalidateCustomer()
        },
        onError: (e) => toast.error(e.message),
      })
    )

  const saveJobDraft = async (jobId: string, draft: JaponJobDraft) => {
    const validationError = validatePartDrafts(draft.parts)
    if (validationError) {
      throw new Error(validationError)
    }
    await setPartsAsync({
      jobId,
      parts: serializePartsForApi(draft.parts),
    })
    await setServicesAsync({
      jobId,
      serviceIds: draft.serviceIds,
    })
  }

  const saveAllJobDrafts = async () => {
    for (const job of jobs) {
      if (!isJaponJobEditable(job)) continue
      const draft = jobDrafts[job.id]
      if (!draft) continue
      await saveJobDraft(job.id, draft)
    }
  }

  const saveCustomer = async () => {
    if (!form.name.trim() || !form.surname.trim() || !form.phone.trim()) {
      toast.error('Ad, soyad ve telefon gerekli')
      return
    }
    if (!data?.customer) return

    try {
      if (isEditing) {
        await saveAllJobDrafts()
      }
      await updateAsync({
        id: data.customer.id,
        name: form.name.trim(),
        surname: form.surname.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      toast.success('Kayıt güncellendi')
      await invalidateCustomer()
      setIsEditing(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Kayıt güncellenemedi'
      toast.error(message)
    }
  }

  const handleJobDraftChange = (jobId: string, next: JaponJobDraft) => {
    setJobDrafts((prev) => ({ ...prev, [jobId]: next }))
  }

  const runJobTransition = async (
    jobId: string,
    action: 'continue' | 'complete' | 'cancel',
    serviceFee?: string
  ) => {
    const draft = jobDrafts[jobId]
    if (draft) {
      await saveJobDraft(jobId, draft)
    }
    await transitionStatusAsync({
      jobId,
      action,
      serviceFee,
    })
    const labels = {
      continue: 'Servis devam ediyor',
      complete: 'Servis tamamlandı',
      cancel: 'Servis iptal edildi',
    }
    toast.success(labels[action])
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Müşteri bulunamadı</CardTitle>
          <CardDescription>
            {error?.message ?? 'Bilinmeyen hata'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { customer, currentCars, pastCars } = data
  const allCars = [...currentCars, ...pastCars]
  const fullName = `${customer.name} ${customer.surname}`
  const isSaving = isSavingCustomer || isTransitioning

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(`${ADMIN_PANEL_PATH}/japon-oto/customers`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Müşteri listesine dön
        </Button>
        {canUpdate ? (
          isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  if (data.jobs) {
                    setJobDrafts(
                      buildInitialDrafts(data.jobs as JaponCustomerJob[])
                    )
                  }
                }}
                disabled={isSaving}
              >
                <X className="mr-1.5 h-4 w-4" />
                İptal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveCustomer}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Kaydet
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Düzenle
            </Button>
          )
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Müşteri bilgileri' : fullName}</CardTitle>
          <CardDescription>
            Müşteri profili. Düzenleme modunda Ad/Soyad/Telefon zorunludur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Ad</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Soyad</Label>
                  <Input
                    value={form.surname}
                    onChange={(e) =>
                      setForm({ ...form, surname: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Adres</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notlar</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <DescRow label="Müşteri no" value={customer.customerNo} />
              <DescRow label="Telefon" value={customer.phone} />
              <DescRow label="Adres" value={customer.address ?? '—'} />
              <DescRow
                label="Kayıt tarihi"
                value={new Date(customer.createdAt).toLocaleString('tr-TR')}
              />
              <DescRow label="Notlar" value={customer.notes ?? '—'} />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="size-4" />
            Araçlar
            <Badge variant="secondary">{allCars.length}</Badge>
          </CardTitle>
          <CardDescription>
            Güncel ve geçmiş sahiplik dönemlerindeki araçlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="mb-2 text-sm font-medium">Güncel araçlar</h4>
            {currentCars.length === 0 ? (
              <p className="text-sm text-muted-foreground">Güncel araç yok.</p>
            ) : (
              <CarTable cars={currentCars} />
            )}
          </div>
          {pastCars.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-medium">Geçmiş araçlar</h4>
              <CarTable cars={pastCars} showOwnershipDates />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-4" />
              Servis kayıtları
              <Badge variant="secondary">{jobs.length}</Badge>
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Parça ekleyebilir, servis durumunu güncelleyebilirsiniz.'
                : 'Servis ziyaretleri, parçalar ve toplamlar.'}
            </CardDescription>
          </div>
          {canCreate && currentCars.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setNewJobOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Yeni servis kaydı
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz servis kaydı yok.
            </p>
          ) : (
            jobs.map((job) => {
              const car = allCars.find((c) => c.id === job.carId)
              const draft = jobDrafts[job.id] ?? {
                parts: partsFromJob(job.parts),
                serviceIds: job.services.map((s) => s.id),
              }

              return (
                <ServiceJobEditor
                  key={job.id}
                  job={job}
                  carLabel={car ? car.plate : 'Bilinmeyen araç'}
                  carSubLabel={car?.vehicleType}
                  isEditing={isEditing}
                  draft={draft}
                  onDraftChange={(next) => handleJobDraftChange(job.id, next)}
                  statusActionsDisabled={isSaving}
                  onContinue={() => runJobTransition(job.id, 'continue')}
                  onComplete={(serviceFee) =>
                    runJobTransition(job.id, 'complete', serviceFee)
                  }
                  onCancel={() => runJobTransition(job.id, 'cancel')}
                />
              )
            })
          )}
        </CardContent>
      </Card>

      {canCreate && currentCars.length > 0 ? (
        <NewServiceJobDialog
          customerId={customerId}
          cars={currentCars.map((c) => ({
            id: c.id,
            plate: c.plate,
            vehicleType: c.vehicleType,
            km: c.km,
          }))}
          open={newJobOpen}
          onOpenChange={setNewJobOpen}
        />
      ) : null}
    </div>
  )
}

function DescRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[120px] text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

type CarRow = {
  id: string
  plate: string
  vehicleType: string
  color: string
  km: number
  ownershipStartedAt?: Date
  ownershipEndedAt?: Date | null
}

function CarTable({
  cars,
  showOwnershipDates = false,
}: {
  cars: CarRow[]
  showOwnershipDates?: boolean
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plaka</TableHead>
            <TableHead>Araç tipi</TableHead>
            <TableHead>Renk</TableHead>
            {showOwnershipDates ? <TableHead>Sahiplik</TableHead> : null}
            <TableHead className="text-right">KM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell className="font-medium">{car.plate}</TableCell>
              <TableCell>{car.vehicleType}</TableCell>
              <TableCell>{car.color}</TableCell>
              {showOwnershipDates ? (
                <TableCell className="text-xs text-muted-foreground">
                  {car.ownershipStartedAt
                    ? new Date(car.ownershipStartedAt).toLocaleDateString(
                        'tr-TR'
                      )
                    : '—'}
                  {' — '}
                  {car.ownershipEndedAt
                    ? new Date(car.ownershipEndedAt).toLocaleDateString('tr-TR')
                    : '—'}
                </TableCell>
              ) : null}
              <TableCell className="text-right">
                {car.km.toLocaleString('tr-TR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
