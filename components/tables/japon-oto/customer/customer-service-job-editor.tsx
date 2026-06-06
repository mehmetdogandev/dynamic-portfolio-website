'use client'

import { useMemo } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  getJaponJobStatus,
  getJaponJobStatusLabel,
  isJaponJobEditable,
} from '@/lib/japon/service-job-status'
import { useTRPC } from '@/lib/trpc/client'
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceJobStatusActions } from './customer-service-job-status-actions'
import { ServiceJobTotals } from './customer-service-job-totals'
import {
  newPartDraft,
  type JaponCustomerJob,
  type JaponJobDraft,
  type JaponPartDraft,
} from './customer-service-job-types'

type ServiceJobEditorProps = {
  job: JaponCustomerJob
  carLabel: string
  carSubLabel?: string
  isEditing: boolean
  draft: JaponJobDraft
  onDraftChange: (next: JaponJobDraft) => void
  onContinue: () => Promise<void>
  onComplete: (serviceFee: string) => Promise<void>
  onCancel: () => Promise<void>
  statusActionsDisabled?: boolean
}

function statusBadgeVariant(
  status: ReturnType<typeof getJaponJobStatus>
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'
    case 'in_progress':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function ServiceJobEditor({
  job,
  carLabel,
  carSubLabel,
  isEditing,
  draft,
  onDraftChange,
  onContinue,
  onComplete,
  onCancel,
  statusActionsDisabled = false,
}: ServiceJobEditorProps) {
  const trpc = useTRPC()
  const { data: catalogServices, isLoading: isServicesLoading } = useQuery({
    ...trpc.japonService.list.queryOptions(adminListFetchAllInput('name')),
    enabled: isEditing && isJaponJobEditable(job),
  })

  const editable = isEditing && isJaponJobEditable(job)

  const servicesCount = editable ? draft.serviceIds.length : job.services.length

  const status = useMemo(
    () =>
      getJaponJobStatus({
        isCompleted: job.isCompleted,
        isCancelled: job.isCancelled,
        startedAt: job.startedAt,
        servicesCount,
      }),
    [job, servicesCount]
  )
  const showServicePicker =
    editable && (status === 'none' || status === 'in_progress')

  const displayParts: JaponPartDraft[] = editable
    ? draft.parts
    : job.parts.map((p) => ({
        rowId: p.id,
        brand: p.brand ?? '',
        partNo: p.partNo ?? '',
        partName: p.partName,
        quantity: String(p.quantity),
        unitPrice: p.unitPrice,
      }))

  const updatePart = (index: number, patch: Partial<JaponPartDraft>) => {
    const next = draft.parts.slice()
    next[index] = { ...next[index]!, ...patch }
    onDraftChange({ ...draft, parts: next })
  }

  const removePart = (index: number) => {
    onDraftChange({
      ...draft,
      parts: draft.parts.filter((_, i) => i !== index),
    })
  }

  const addPart = () => {
    onDraftChange({ ...draft, parts: [...draft.parts, newPartDraft()] })
  }

  const toggleService = (serviceId: string) => {
    const next = new Set(draft.serviceIds)
    if (next.has(serviceId)) next.delete(serviceId)
    else next.add(serviceId)
    onDraftChange({ ...draft, serviceIds: [...next] })
  }

  const activeServices = (catalogServices?.data ?? []).filter((s) => s.isActive)

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {carLabel}
              {carSubLabel ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {carSubLabel}
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>
              {new Date(job.createdAt).toLocaleString('tr-TR')} · KM:{' '}
              {job.kmAtVisit.toLocaleString('tr-TR')}
              {job.formenLabel ? ` · Formen: ${job.formenLabel}` : ''}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(status)}>
            {getJaponJobStatusLabel(status)}
          </Badge>
        </div>
        {editable ? (
          <ServiceJobStatusActions
            status={status}
            disabled={statusActionsDisabled}
            onContinue={onContinue}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {job.notes ? (
          <p className="text-sm text-muted-foreground">{job.notes}</p>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Servisler
          </p>
          {showServicePicker ? (
            isServicesLoading ? (
              <div className="mt-2 flex min-h-[80px] items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeServices.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Tanımlı servis yok.
              </p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {activeServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={draft.serviceIds.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <span className="font-medium">{service.name}</span>
                  </label>
                ))}
              </div>
            )
          ) : draft.serviceIds.length === 0 && job.services.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">—</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(editable
                ? activeServices.filter((s) => draft.serviceIds.includes(s.id))
                : job.services
              ).map((s) => (
                <Badge key={s.id} variant="outline">
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Parçalar
            </p>
            {editable ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPart}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Parça ekle
              </Button>
            ) : null}
          </div>

          {displayParts.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {editable ? 'Henüz parça eklenmedi.' : '—'}
            </p>
          ) : editable ? (
            <div className="mt-2 space-y-3">
              {draft.parts.map((row, index) => (
                <div
                  key={row.rowId}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Marka</Label>
                    <Input
                      value={row.brand}
                      onChange={(e) =>
                        updatePart(index, { brand: e.target.value })
                      }
                      placeholder="Bosch"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Parça No</Label>
                    <Input
                      value={row.partNo}
                      onChange={(e) =>
                        updatePart(index, { partNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs">Parça Adı *</Label>
                    <Input
                      value={row.partName}
                      onChange={(e) =>
                        updatePart(index, { partName: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs">Adet</Label>
                    <Input
                      value={row.quantity}
                      inputMode="numeric"
                      onChange={(e) =>
                        updatePart(index, {
                          quantity:
                            e.target.value.replace(/[^0-9]/g, '') || '1',
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
                        updatePart(index, {
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
                      onClick={() => removePart(index)}
                      aria-label="Parça satırını sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-1 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marka</TableHead>
                    <TableHead>Parça No</TableHead>
                    <TableHead>Parça Adı</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayParts.map((p) => (
                    <TableRow key={p.rowId}>
                      <TableCell>{p.brand || '—'}</TableCell>
                      <TableCell>{p.partNo || '—'}</TableCell>
                      <TableCell className="font-medium">
                        {p.partName}
                      </TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">
                        {p.unitPrice}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <ServiceJobTotals
          parts={displayParts}
          serviceFee={job.isCompleted ? job.serviceFee : null}
        />

        {!editable && (status === 'completed' || status === 'cancelled') ? (
          <p className="text-sm text-muted-foreground">
            Değişiklik için yeni servis kaydı açın.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
